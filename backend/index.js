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

// Hard cap on how many distinct accounts may use the app.
const MAX_ACCOUNTS = 5;

// Decide whether the authenticated user is allowed in. The first MAX_ACCOUNTS
// distinct Auth0 accounts to reach here each claim a permanent slot.
// Returns { status: 'authorized' | 'unauthenticated' | 'full' }.
function authorize(req) {
  if (!req.oidc || !req.oidc.isAuthenticated()) return { status: 'unauthenticated' };
  const sub = req.oidc.user.sub;
  const existing = db.prepare('SELECT 1 FROM authorized_users WHERE auth0_sub = ?').get(sub);
  if (existing) return { status: 'authorized' };
  const count = db.prepare('SELECT COUNT(*) AS c FROM authorized_users').get().c;
  if (count >= MAX_ACCOUNTS) return { status: 'full' };
  db.prepare('INSERT INTO authorized_users (auth0_sub, email, name) VALUES (?, ?, ?)')
    .run(sub, req.oidc.user.email || null, req.oidc.user.name || null);
  console.log(`Account slot claimed (${count + 1}/${MAX_ACCOUNTS}): ${req.oidc.user.email || sub}`);
  return { status: 'authorized' };
}

// The frontend polls this to decide what to render: the app, the landing page, or a "full" screen.
app.get('/api/me', (req, res) => {
  const a = authorize(req);
  if (a.status === 'authorized') return res.json({ authenticated: true, user: req.oidc.user });
  if (a.status === 'full') return res.status(403).json({ authenticated: true, error: 'capacity_full' });
  res.status(401).json({ authenticated: false });
});

// Gate for data routes — returns JSON (not an HTML redirect) so fetch() can handle it.
// On success, attaches req.userId so every route can scope its queries to this user.
function requireAuth(req, res, next) {
  const a = authorize(req);
  if (a.status === 'authorized') { req.userId = req.oidc.user.sub; return next(); }
  if (a.status === 'full') return res.status(403).json({ error: 'capacity_full' });
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
app.use('/api/interviews', requireAuth, require('./routes/interviews'));

// Stats endpoint for dashboard — scoped to the logged-in user.
app.get('/api/stats', requireAuth, (req, res) => {
  const u = req.userId;
  const total = db.prepare('SELECT COUNT(*) as count FROM applications WHERE user_id = ?').get(u).count;
  const byStatus = db.prepare('SELECT status, COUNT(*) as count FROM applications WHERE user_id = ? GROUP BY status').all(u);
  const connections = db.prepare('SELECT COUNT(*) as count FROM connections WHERE user_id = ?').get(u).count;
  const pendingOutreach = db.prepare('SELECT COUNT(*) as count FROM connections WHERE user_id = ? AND reached_out = 0').get(u).count;
  const recentApps = db.prepare('SELECT * FROM applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 5').all(u);
  const upcomingReminders = db.prepare("SELECT r.*, a.company, a.position FROM reminders r LEFT JOIN applications a ON r.application_id = a.id WHERE r.user_id = ? AND r.sent = 0 AND r.scheduled_at >= datetime('now') ORDER BY r.scheduled_at ASC LIMIT 5").all(u);
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

// Daily accountability digest at 8am — one per user who has set an email.
cron.schedule('0 8 * * *', async () => {
  try {
    const profiles = db.prepare('SELECT * FROM profiles WHERE email IS NOT NULL AND email != ""').all();
    for (const profile of profiles) {
      const u = profile.user_id;
      const total = db.prepare('SELECT COUNT(*) as count FROM applications WHERE user_id = ?').get(u).count;
      const applied = db.prepare("SELECT COUNT(*) as count FROM applications WHERE user_id = ? AND status = 'applied'").get(u).count;
      const inProgress = db.prepare("SELECT COUNT(*) as count FROM applications WHERE user_id = ? AND status IN ('phone_screen','interview','offer')").get(u).count;
      const connections = db.prepare('SELECT COUNT(*) as count FROM connections WHERE user_id = ?').get(u).count;
      const pendingOutreach = db.prepare('SELECT COUNT(*) as count FROM connections WHERE user_id = ? AND reached_out = 0').get(u).count;
      await sendAccountabilityDigest(profile.email, profile.name, { total, applied, inProgress, connections, pendingOutreach });
    }
  } catch (e) {
    console.error('Digest error:', e.message);
  }
});

// Check and send due reminders every 15 minutes — each goes to its owner's email.
cron.schedule('*/15 * * * *', async () => {
  try {
    const due = db.prepare("SELECT r.*, a.company, a.position FROM reminders r LEFT JOIN applications a ON r.application_id = a.id WHERE r.sent = 0 AND r.scheduled_at <= datetime('now')").all();
    for (const reminder of due) {
      const profile = reminder.user_id ? db.prepare('SELECT email FROM profiles WHERE user_id = ?').get(reminder.user_id) : null;
      const to = profile?.email || process.env.GMAIL_USER;
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
