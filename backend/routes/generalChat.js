const express = require('express');
const router = express.Router();
const db = require('../db');
const { chatGeneral } = require('../services/ai');

// Build a compact text snapshot of this user's whole job search for coaching context
function buildJobSearchContext(userId) {
  const apps = db.prepare('SELECT company, position, status, applied_date FROM applications WHERE user_id = ? ORDER BY updated_at DESC').all(userId);
  const total = apps.length;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM applications WHERE user_id = ? GROUP BY status').all(userId);
  const connections = db.prepare('SELECT COUNT(*) as count FROM connections WHERE user_id = ?').get(userId).count;
  const pendingOutreach = db.prepare('SELECT COUNT(*) as count FROM connections WHERE user_id = ? AND reached_out = 0').get(userId).count;
  const upcoming = db.prepare("SELECT title, scheduled_at FROM reminders WHERE user_id = ? AND sent = 0 AND scheduled_at >= datetime('now') ORDER BY scheduled_at ASC LIMIT 5").all(userId);

  if (total === 0 && connections === 0) {
    return 'The user has not added any applications or connections yet. Encourage them to get started.';
  }

  const statusLine = byStatus.map(s => `${s.count} ${s.status}`).join(', ');
  const appList = apps.slice(0, 15).map(a => `- ${a.position} at ${a.company} (${a.status})`).join('\n');
  const reminderList = upcoming.length
    ? upcoming.map(r => `- ${r.title} (${r.scheduled_at})`).join('\n')
    : 'None scheduled';

  return `Total applications: ${total} (${statusLine})
Connections: ${connections} total, ${pendingOutreach} pending outreach

Applications:
${appList}

Upcoming reminders:
${reminderList}`;
}

router.get('/', (req, res) => {
  const messages = db.prepare('SELECT * FROM general_chat_messages WHERE user_id = ? ORDER BY created_at ASC').all(req.userId);
  res.json(messages);
});

router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
  const history = db.prepare('SELECT role, content FROM general_chat_messages WHERE user_id = ? ORDER BY created_at ASC').all(req.userId);

  db.prepare('INSERT INTO general_chat_messages (user_id, role, content) VALUES (?, ?, ?)').run(req.userId, 'user', message);

  try {
    const context = buildJobSearchContext(req.userId);
    const reply = await chatGeneral(profile, context, history, message);
    db.prepare('INSERT INTO general_chat_messages (user_id, role, content) VALUES (?, ?, ?)').run(req.userId, 'assistant', reply);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', (req, res) => {
  db.prepare('DELETE FROM general_chat_messages WHERE user_id = ?').run(req.userId);
  res.json({ success: true });
});

module.exports = router;
