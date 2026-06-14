const express = require('express');
const router = express.Router();
const db = require('../db');

const withApp = `SELECT i.*, a.company, a.position FROM interviews i
  LEFT JOIN applications a ON i.application_id = a.id`;

// List interviews. ?application_id= to scope to one app; ?upcoming=1 for future only.
router.get('/', (req, res) => {
  const { application_id, upcoming } = req.query;
  const clauses = ['i.user_id = ?'];
  const params = [req.userId];
  if (application_id) { clauses.push('i.application_id = ?'); params.push(application_id); }
  if (upcoming) { clauses.push("i.scheduled_at IS NOT NULL AND datetime(i.scheduled_at) >= datetime('now')"); }
  const where = ` WHERE ${clauses.join(' AND ')}`;
  const order = upcoming ? ' ORDER BY i.scheduled_at ASC' : ' ORDER BY i.scheduled_at DESC';
  res.json(db.prepare(withApp + where + order).all(...params));
});

router.post('/', (req, res) => {
  const { application_id, round, scheduled_at, duration_min, format, interviewers, location, prep_notes, outcome } = req.body;
  if (!application_id) return res.status(400).json({ error: 'application_id required' });
  // Ensure the application belongs to this user before attaching an interview.
  const owns = db.prepare('SELECT 1 FROM applications WHERE id = ? AND user_id = ?').get(application_id, req.userId);
  if (!owns) return res.status(404).json({ error: 'Application not found' });
  const result = db.prepare(
    `INSERT INTO interviews (user_id, application_id, round, scheduled_at, duration_min, format, interviewers, location, prep_notes, outcome)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(req.userId, application_id, round || null, scheduled_at || null, duration_min || 60, format || null, interviewers || null, location || null, prep_notes || null, outcome || null);
  res.status(201).json(db.prepare(withApp + ' WHERE i.id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM interviews WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const f = req.body;
  db.prepare(`UPDATE interviews SET
    round = ?, scheduled_at = ?, duration_min = ?, format = ?, interviewers = ?,
    location = ?, prep_notes = ?, outcome = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?`).run(
    f.round ?? existing.round, f.scheduled_at ?? existing.scheduled_at, f.duration_min ?? existing.duration_min,
    f.format ?? existing.format, f.interviewers ?? existing.interviewers, f.location ?? existing.location,
    f.prep_notes ?? existing.prep_notes, f.outcome ?? existing.outcome, req.params.id, req.userId
  );
  res.json(db.prepare(withApp + ' WHERE i.id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM interviews WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

// Calendar export — a .ics file the user can import into Google/Apple/Outlook calendar.
router.get('/:id/calendar.ics', (req, res) => {
  const iv = db.prepare(withApp + ' WHERE i.id = ? AND i.user_id = ?').get(req.params.id, req.userId);
  if (!iv) return res.status(404).json({ error: 'Not found' });
  if (!iv.scheduled_at) return res.status(400).json({ error: 'Interview has no scheduled time' });

  // Build local floating time stamps (YYYYMMDDTHHMMSS) so calendars import in the user's zone.
  const start = new Date(iv.scheduled_at);
  const end = new Date(start.getTime() + (iv.duration_min || 60) * 60000);
  const fmt = d => d.getFullYear().toString()
    + String(d.getMonth() + 1).padStart(2, '0')
    + String(d.getDate()).padStart(2, '0') + 'T'
    + String(d.getHours()).padStart(2, '0')
    + String(d.getMinutes()).padStart(2, '0') + '00';
  const esc = s => (s || '').replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');

  const title = `${iv.round || 'Interview'} — ${iv.position || ''} @ ${iv.company || ''}`.trim();
  const descParts = [];
  if (iv.format) descParts.push(`Format: ${iv.format}`);
  if (iv.interviewers) descParts.push(`Interviewers: ${iv.interviewers}`);
  if (iv.prep_notes) descParts.push(`Prep: ${iv.prep_notes}`);

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//A Camellar//Interview//EN',
    'BEGIN:VEVENT',
    `UID:interview-${iv.id}@acamellar`,
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(descParts.join('\n'))}`,
    iv.location ? `LOCATION:${esc(iv.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean).join('\r\n');

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="interview-${iv.id}.ics"`);
  res.send(ics);
});

module.exports = router;
