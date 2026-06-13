const express = require('express');
const router = express.Router();
const db = require('../db');

// Progress is measured against real activity in the goal's week:
//  - applications submitted = applications with an applied_date in the week
//  - people contacted      = connections marked reached_out with an outreach_date in the week
function computeProgress(weekStart) {
  const apps = db.prepare(
    `SELECT COUNT(*) AS c FROM applications
     WHERE applied_date IS NOT NULL
       AND date(applied_date) >= date(?)
       AND date(applied_date) <= date(?, '+6 days')`
  ).get(weekStart, weekStart).c;

  const conns = db.prepare(
    `SELECT COUNT(*) AS c FROM connections
     WHERE reached_out = 1
       AND outreach_date IS NOT NULL
       AND date(outreach_date) >= date(?)
       AND date(outreach_date) <= date(?, '+6 days')`
  ).get(weekStart, weekStart).c;

  return { applications_done: apps, connections_done: conns };
}

function withProgress(goal) {
  if (!goal) return goal;
  return { ...goal, ...computeProgress(goal.week_start) };
}

// List all goals (most recent week first), each with live progress.
router.get('/', (req, res) => {
  const goals = db.prepare('SELECT * FROM weekly_goals ORDER BY week_start DESC').all();
  res.json(goals.map(withProgress));
});

// Get (or synthesize) the goal for a specific week. ?week_start=YYYY-MM-DD required.
router.get('/week', (req, res) => {
  const { week_start } = req.query;
  if (!week_start) return res.status(400).json({ error: 'week_start required' });
  const goal = db.prepare('SELECT * FROM weekly_goals WHERE week_start = ?').get(week_start);
  if (goal) return res.json(withProgress(goal));
  // No goal set yet for this week — return an empty shell with live progress so the UI can show it.
  res.json({ week_start, applications_target: 0, connections_target: 0, notes: null, ...computeProgress(week_start) });
});

// Create or update the goal for a week (upsert on week_start).
router.post('/', (req, res) => {
  const { week_start, applications_target, connections_target, notes } = req.body;
  if (!week_start) return res.status(400).json({ error: 'week_start required' });

  const existing = db.prepare('SELECT * FROM weekly_goals WHERE week_start = ?').get(week_start);
  if (existing) {
    db.prepare(`UPDATE weekly_goals SET applications_target = ?, connections_target = ?, notes = ?, updated_at = datetime('now') WHERE week_start = ?`)
      .run(applications_target ?? existing.applications_target, connections_target ?? existing.connections_target, notes ?? existing.notes, week_start);
  } else {
    db.prepare('INSERT INTO weekly_goals (week_start, applications_target, connections_target, notes) VALUES (?, ?, ?, ?)')
      .run(week_start, applications_target || 0, connections_target || 0, notes || null);
  }
  res.json(withProgress(db.prepare('SELECT * FROM weekly_goals WHERE week_start = ?').get(week_start)));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM weekly_goals WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
