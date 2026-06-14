const express = require('express');
const router = express.Router();
const db = require('../db');

// Progress is measured against real activity in the goal's week, scoped to the user.
function computeProgress(userId, weekStart) {
  const apps = db.prepare(
    `SELECT COUNT(*) AS c FROM applications
     WHERE user_id = ?
       AND applied_date IS NOT NULL
       AND date(applied_date) >= date(?)
       AND date(applied_date) <= date(?, '+6 days')`
  ).get(userId, weekStart, weekStart).c;

  const conns = db.prepare(
    `SELECT COUNT(*) AS c FROM connections
     WHERE user_id = ?
       AND reached_out = 1
       AND outreach_date IS NOT NULL
       AND date(outreach_date) >= date(?)
       AND date(outreach_date) <= date(?, '+6 days')`
  ).get(userId, weekStart, weekStart).c;

  return { applications_done: apps, connections_done: conns };
}

function withProgress(userId, goal) {
  if (!goal) return goal;
  return { ...goal, ...computeProgress(userId, goal.week_start) };
}

router.get('/', (req, res) => {
  const goals = db.prepare('SELECT * FROM weekly_goals WHERE user_id = ? ORDER BY week_start DESC').all(req.userId);
  res.json(goals.map(g => withProgress(req.userId, g)));
});

router.get('/week', (req, res) => {
  const { week_start } = req.query;
  if (!week_start) return res.status(400).json({ error: 'week_start required' });
  const goal = db.prepare('SELECT * FROM weekly_goals WHERE user_id = ? AND week_start = ?').get(req.userId, week_start);
  if (goal) return res.json(withProgress(req.userId, goal));
  res.json({ week_start, applications_target: 0, connections_target: 0, notes: null, ...computeProgress(req.userId, week_start) });
});

router.post('/', (req, res) => {
  const { week_start, applications_target, connections_target, notes } = req.body;
  if (!week_start) return res.status(400).json({ error: 'week_start required' });

  const existing = db.prepare('SELECT * FROM weekly_goals WHERE user_id = ? AND week_start = ?').get(req.userId, week_start);
  if (existing) {
    db.prepare(`UPDATE weekly_goals SET applications_target = ?, connections_target = ?, notes = ?, updated_at = datetime('now') WHERE user_id = ? AND week_start = ?`)
      .run(applications_target ?? existing.applications_target, connections_target ?? existing.connections_target, notes ?? existing.notes, req.userId, week_start);
  } else {
    db.prepare('INSERT INTO weekly_goals (user_id, week_start, applications_target, connections_target, notes) VALUES (?, ?, ?, ?, ?)')
      .run(req.userId, week_start, applications_target || 0, connections_target || 0, notes || null);
  }
  res.json(withProgress(req.userId, db.prepare('SELECT * FROM weekly_goals WHERE user_id = ? AND week_start = ?').get(req.userId, week_start)));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM weekly_goals WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

module.exports = router;
