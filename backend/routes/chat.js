const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');
const { chatAboutJob } = require('../services/ai');

// Confirm the application belongs to the current user before touching its chat.
function ownApp(req) {
  return db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
}

router.get('/', (req, res) => {
  if (!ownApp(req)) return res.status(404).json({ error: 'Application not found' });
  const messages = db.prepare('SELECT * FROM chat_messages WHERE application_id = ? AND user_id = ? ORDER BY created_at ASC').all(req.params.id, req.userId);
  res.json(messages);
});

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const app = ownApp(req);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
  const history = db.prepare('SELECT role, content FROM chat_messages WHERE application_id = ? AND user_id = ? ORDER BY created_at ASC').all(req.params.id, req.userId);

  db.prepare('INSERT INTO chat_messages (user_id, application_id, role, content) VALUES (?, ?, ?, ?)').run(req.userId, req.params.id, 'user', message);

  try {
    const reply = await chatAboutJob(app.job_listing, app.company, app.position, profile?.resume, history, message, { writingStyle: profile?.writing_style });
    db.prepare('INSERT INTO chat_messages (user_id, application_id, role, content) VALUES (?, ?, ?, ?)').run(req.userId, req.params.id, 'assistant', reply);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM chat_messages WHERE application_id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

module.exports = router;
