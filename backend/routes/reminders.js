const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendReminder } = require('../services/email');

router.get('/', (req, res) => {
  const reminders = db.prepare(`
    SELECT r.*, a.company, a.position FROM reminders r
    LEFT JOIN applications a ON r.application_id = a.id
    ORDER BY r.scheduled_at ASC
  `).all();
  res.json(reminders);
});

router.post('/', (req, res) => {
  const { application_id, title, message, scheduled_at } = req.body;
  if (!title || !message || !scheduled_at) return res.status(400).json({ error: 'title, message, scheduled_at required' });
  const result = db.prepare('INSERT INTO reminders (application_id, title, message, scheduled_at) VALUES (?, ?, ?, ?)')
    .run(application_id || null, title, message, scheduled_at);
  res.status(201).json(db.prepare('SELECT * FROM reminders WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { title, message, scheduled_at, sent } = req.body;
  const existing = db.prepare('SELECT * FROM reminders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE reminders SET title = ?, message = ?, scheduled_at = ?, sent = ? WHERE id = ?')
    .run(title ?? existing.title, message ?? existing.message, scheduled_at ?? existing.scheduled_at, sent ?? existing.sent, req.params.id);
  res.json(db.prepare('SELECT * FROM reminders WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM reminders WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/send', async (req, res) => {
  const reminder = db.prepare('SELECT r.*, a.company, a.position FROM reminders r LEFT JOIN applications a ON r.application_id = a.id WHERE r.id = ?').get(req.params.id);
  if (!reminder) return res.status(404).json({ error: 'Not found' });

  const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  const to = profile?.email || process.env.GMAIL_USER;

  try {
    await sendReminder(to, reminder.title, reminder.message,
      reminder.company ? { company: reminder.company, position: reminder.position } : null);
    db.prepare("UPDATE reminders SET sent = 1, sent_at = datetime('now') WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
