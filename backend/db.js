const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'acamellar.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS user_profile (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    name TEXT,
    email TEXT,
    resume TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT NOT NULL,
    position TEXT NOT NULL,
    job_url TEXT,
    job_listing TEXT,
    status TEXT DEFAULT 'researching',
    applied_date TEXT,
    notes TEXT,
    tailored_resume TEXT,
    cover_letter TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    title TEXT,
    company TEXT,
    linkedin_url TEXT,
    email TEXT,
    reached_out INTEGER DEFAULT 0,
    outreach_date TEXT,
    response TEXT,
    outcome TEXT,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS general_chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER REFERENCES applications(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    scheduled_at TEXT NOT NULL,
    sent INTEGER DEFAULT 0,
    sent_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Access control: the first N distinct Auth0 accounts to log in each claim a slot.
  -- Enforces a hard cap on how many people can use the app (see MAX_ACCOUNTS).
  CREATE TABLE IF NOT EXISTS authorized_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auth0_sub TEXT NOT NULL UNIQUE,
    email TEXT,
    name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  -- Weekly accountability goals. week_start is the Monday (YYYY-MM-DD) of the week.
  -- Progress is computed live from applications.applied_date and connections.outreach_date.
  CREATE TABLE IF NOT EXISTS weekly_goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    week_start TEXT NOT NULL UNIQUE,
    applications_target INTEGER DEFAULT 0,
    connections_target INTEGER DEFAULT 0,
    notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Interview rounds per application, with optional scheduled time for calendar export.
  CREATE TABLE IF NOT EXISTS interviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    round TEXT,
    scheduled_at TEXT,
    duration_min INTEGER DEFAULT 60,
    format TEXT,
    interviewers TEXT,
    location TEXT,
    prep_notes TEXT,
    outcome TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  -- Saved "this is my voice" sample documents used to teach Claude the user's style.
  -- doc_type: 'resume' | 'cover_letter'
  CREATE TABLE IF NOT EXISTS style_examples (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doc_type TEXT NOT NULL,
    label TEXT,
    content TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// --- Lightweight migrations for already-deployed databases ---
// Add a column only if it doesn't already exist (SQLite has no ADD COLUMN IF NOT EXISTS).
function addColumnIfMissing(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some(c => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

addColumnIfMissing('user_profile', 'writing_style', 'TEXT');

// ---------------------------------------------------------------------------
// Multi-user isolation: every user-data row is scoped by user_id (the Auth0 sub).
// ---------------------------------------------------------------------------
const USER_TABLES = [
  'applications', 'connections', 'chat_messages', 'general_chat_messages',
  'reminders', 'style_examples', 'interviews',
];
for (const t of USER_TABLES) addColumnIfMissing(t, 'user_id', 'TEXT');

// Per-user profile (replaces the singleton user_profile row with id = 1).
db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    resume TEXT,
    writing_style TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// The owner = first account to have logged in (claims pre-existing data).
function ownerSub() {
  const row = db.prepare('SELECT auth0_sub FROM authorized_users ORDER BY id ASC LIMIT 1').get();
  return row ? row.auth0_sub : null;
}
const OWNER = ownerSub();

// Rebuild weekly_goals so uniqueness is per (user_id, week_start), not global per week.
const weeklyGoalsHasUserId = db.prepare('PRAGMA table_info(weekly_goals)').all().some(c => c.name === 'user_id');
if (!weeklyGoalsHasUserId) {
  db.exec(`
    CREATE TABLE weekly_goals_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT,
      week_start TEXT NOT NULL,
      applications_target INTEGER DEFAULT 0,
      connections_target INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, week_start)
    );
    INSERT INTO weekly_goals_new (id, week_start, applications_target, connections_target, notes, created_at, updated_at)
      SELECT id, week_start, applications_target, connections_target, notes, created_at, updated_at FROM weekly_goals;
    DROP TABLE weekly_goals;
    ALTER TABLE weekly_goals_new RENAME TO weekly_goals;
  `);
}

// Backfill all pre-existing (NULL user_id) data to the owner, and migrate the old profile.
if (OWNER) {
  for (const t of [...USER_TABLES, 'weekly_goals']) {
    db.prepare(`UPDATE ${t} SET user_id = ? WHERE user_id IS NULL`).run(OWNER);
  }
  const oldProfile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  if (oldProfile) {
    const exists = db.prepare('SELECT 1 FROM profiles WHERE user_id = ?').get(OWNER);
    if (!exists) {
      db.prepare('INSERT INTO profiles (user_id, name, email, resume, writing_style) VALUES (?, ?, ?, ?, ?)')
        .run(OWNER, oldProfile.name, oldProfile.email, oldProfile.resume, oldProfile.writing_style);
    }
  }
}

module.exports = db;
