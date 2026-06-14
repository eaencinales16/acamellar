const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const { application_id } = req.query;
  let query = 'SELECT c.*, a.company as app_company, a.position FROM connections c LEFT JOIN applications a ON c.application_id = a.id WHERE c.user_id = ?';
  const params = [req.userId];
  if (application_id) {
    query += ' AND c.application_id = ?';
    params.push(application_id);
  }
  query += ' ORDER BY c.created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { application_id, name, title, company, linkedin_url, email, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });
  const result = db.prepare(
    'INSERT INTO connections (user_id, application_id, name, title, company, linkedin_url, email, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, application_id || null, name, title || null, company || null, linkedin_url || null, email || null, notes || null);
  res.status(201).json(db.prepare('SELECT * FROM connections WHERE id = ?').get(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
  const { name, title, company, linkedin_url, email, reached_out, outreach_date, response, outcome, notes, application_id } = req.body;
  const existing = db.prepare('SELECT * FROM connections WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`UPDATE connections SET
    name = ?, title = ?, company = ?, linkedin_url = ?, email = ?,
    reached_out = ?, outreach_date = ?, response = ?, outcome = ?,
    notes = ?, application_id = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ?`).run(
    name ?? existing.name,
    title ?? existing.title,
    company ?? existing.company,
    linkedin_url ?? existing.linkedin_url,
    email ?? existing.email,
    reached_out ?? existing.reached_out,
    outreach_date ?? existing.outreach_date,
    response ?? existing.response,
    outcome ?? existing.outcome,
    notes ?? existing.notes,
    application_id ?? existing.application_id,
    req.params.id, req.userId
  );
  res.json(db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM connections WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

module.exports = router;
