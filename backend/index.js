require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const { auth } = require('express-openid-connect');
const db = require('./db');
const { sendAccountabilityDigest, sendReminder } = require('./services/email');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// --- Auth0 authentication ---
// Adds /login, /logout, and /callback routes plus an encrypted session cookie.
// authRequired:false so static files & the landing page still load; the API
// data routes are guarded individually by requireAuth below.
app.use(auth({
  authRequired: false,
  auth0Logout: true,
  baseURL: process.env.BASE_URL,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  authorizationParams: { response_type: 'code', scope: 'openid profile email' },
  routes: { postLogoutRedirect: '/' },
}));

// Sign-up: same Auth0 Universal Login, but opens straight on the registration screen.
app.get('/signup', (req, res) => {
  res.oidc.login({
    returnTo: '/',
    authorizationParams: { response_type: 'code', scope: 'openid profile email', screen_hint: 'signup' },
  });
});

// The frontend polls this to decide whether to show the app or the landing page.
app.get('/api/me', (req, res) => {
  if (req.oidc && req.oidc.isAuthenticated()) {
    return res.json({ authenticated: true, user: req.oidc.user });
  }
  res.status(401).json({ authenticated: false });
});

// Gate for data routes — returns 401 JSON (not an HTML redirect) so fetch() can handle it.
function requireAuth(req, res, next) {
  if (req.oidc && req.oidc.isAuthenticated()) return next();
  res.status(401).json({ error: 'unauthorized' });
}

// Protected API routes
app.use('/api/applications', requireAuth, require('./routes/applications'));
app.use('/api/applications/:id/chat', requireAuth, require('./routes/chat'));
app.use('/api/chat', requireAuth, require('./routes/generalChat'));
app.use('/api/connections', requireAuth, require('./routes/connections'));
app.use('/api/reminders', requireAuth, require('./routes/reminders'));
app.use('/api/profile', requireAuth, require('./routes/profile'));
app.use('/api/style-examples', requireAuth, require('./routes/styleExamples'));
app.use('/api/goals', requireAuth, require('./routes/goals'));

// Stats endpoint for dashboard
app.get('/api/stats', requireAuth, (req, res) => {
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
