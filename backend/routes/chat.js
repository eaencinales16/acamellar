const express = require('express');
const router = express.Router({ mergeParams: true });
const db = require('../db');
const { chatAboutJob } = require('../services/ai');

router.get('/', (req, res) => {
  const messages = db.prepare('SELECT * FROM chat_messages WHERE application_id = ? ORDER BY created_at ASC').all(req.params.id);
  res.json(messages);
});

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  const history = db.prepare('SELECT role, content FROM chat_messages WHERE application_id = ? ORDER BY created_at ASC').all(req.params.id);

  db.prepare('INSERT INTO chat_messages (application_id, role, content) VALUES (?, ?, ?)').run(req.params.id, 'user', message);

  try {
    const reply = await chatAboutJob(app.job_listing, app.company, app.position, profile?.resume, history, message);
    db.prepare('INSERT INTO chat_messages (application_id, role, content) VALUES (?, ?, ?)').run(req.params.id, 'assistant', reply);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM chat_messages WHERE application_id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
