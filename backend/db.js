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

module.exports = db;
