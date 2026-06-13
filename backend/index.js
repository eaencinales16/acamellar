require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const db = require('./db');
const { sendAccountabilityDigest, sendReminder } = require('./services/email');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/applications', require('./routes/applications'));
app.use('/api/applications/:id/chat', require('./routes/chat'));
app.use('/api/connections', require('./routes/connections'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/profile', require('./routes/profile'));

// Stats endpoint for dashboard
app.get('/api/stats', (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
  const byStatus = db.prepare("SELECT status, COUNT(*) as count FROM applications GROUP BY status").all();
  const connections = db.prepare('SELECT COUNT(*) as count FROM connections').get().count;
  const pendingOutreach = db.prepare('SELECT COUNT(*) as count FROM connections WHERE reached_out = 0').get().count;
  const recentApps = db.prepare('SELECT * FROM applications ORDER BY created_at DESC LIMIT 5').all();
  const upcomingReminders = db.prepare("SELECT r.*, a.company, a.position FROM reminders r LEFT JOIN applications a ON r.application_id = a.id WHERE r.sent = 0 AND r.scheduled_at >= datetime('now') ORDER BY r.scheduled_at ASC LIMIT 5").all();
  res.json({ total, byStatus, connections, pendingOutreach, recentApps, upcomingReminders });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const publicPath = path.join(__dirname, 'public');
  app.use(express.static(publicPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
  });
}

// Daily accountability digest at 8am
cron.schedule('0 8 * * *', async () => {
  try {
    const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
    if (!profile?.email) return;
    const total = db.prepare('SELECT COUNT(*) as count FROM applications').get().count;
    const applied = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status = 'applied'").get().count;
    const inProgress = db.prepare("SELECT COUNT(*) as count FROM applications WHERE status IN ('phone_screen','interview','offer')").get().count;
    const connections = db.prepare('SELECT COUNT(*) as count FROM connections').get().count;
    const pendingOutreach = db.prepare('SELECT COUNT(*) as count FROM connections WHERE reached_out = 0').get().count;
    await sendAccountabilityDigest(profile.email, profile.name, { total, applied, inProgress, connections, pendingOutreach });
  } catch (e) {
    console.error('Digest error:', e.message);
  }
});

// Check and send due reminders every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  try {
    const due = db.prepare("SELECT r.*, a.company, a.position FROM reminders r LEFT JOIN applications a ON r.application_id = a.id WHERE r.sent = 0 AND r.scheduled_at <= datetime('now')").all();
    const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
    const to = profile?.email || process.env.GMAIL_USER;
    for (const reminder of due) {
      await sendReminder(to, reminder.title, reminder.message,
        reminder.company ? { company: reminder.company, position: reminder.position } : null);
      db.prepare("UPDATE reminders SET sent = 1, sent_at = datetime('now') WHERE id = ?").run(reminder.id);
    }
  } catch (e) {
    console.error('Reminder cron error:', e.message);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`A Camellar server running on port ${PORT}`));
