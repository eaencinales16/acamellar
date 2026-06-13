const express = require('express');
const router = express.Router();
const db = require('../db');
const { tailorResume, generateCoverLetter } = require('../services/ai');

router.get('/', (req, res) => {
  const apps = db.prepare('SELECT * FROM applications ORDER BY updated_at DESC').all();
  res.json(apps);
});

router.get('/:id', (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Not found' });
  res.json(app);
});

router.post('/', (req, res) => {
  const { company, position, job_url, job_listing, status, applied_date, notes } = req.body;
  if (!company || !position) return res.status(400).json({ error: 'company and position required' });
  const result = db.prepare(
    'INSERT INTO applications (company, position, job_url, job_listing, status, applied_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(company, position, job_url || null, job_listing || null, status || 'researching', applied_date || null, notes || null);
  const created = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const { company, position, job_url, job_listing, status, applied_date, notes, tailored_resume, cover_letter } = req.body;
  const existing = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`UPDATE applications SET
    company = ?, position = ?, job_url = ?, job_listing = ?, status = ?,
    applied_date = ?, notes = ?, tailored_resume = ?, cover_letter = ?,
    updated_at = datetime('now')
    WHERE id = ?`).run(
    company ?? existing.company,
    position ?? existing.position,
    job_url ?? existing.job_url,
    job_listing ?? existing.job_listing,
    status ?? existing.status,
    applied_date ?? existing.applied_date,
    notes ?? existing.notes,
    tailored_resume ?? existing.tailored_resume,
    cover_letter ?? existing.cover_letter,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.post('/:id/tailor-resume', async (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  if (!app.job_listing) return res.status(400).json({ error: 'Add job listing first' });

  const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  if (!profile?.resume) return res.status(400).json({ error: 'Add your base resume in Profile first' });

  try {
    const tailored = await tailorResume(profile.resume, app.job_listing, app.company, app.position);
    db.prepare("UPDATE applications SET tailored_resume = ?, updated_at = datetime('now') WHERE id = ?")
      .run(tailored, req.params.id);
    res.json({ tailored_resume: tailored });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/cover-letter', async (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  if (!app.job_listing) return res.status(400).json({ error: 'Add job listing first' });

  const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  if (!profile?.resume) return res.status(400).json({ error: 'Add your base resume in Profile first' });

  try {
    const letter = await generateCoverLetter(profile.resume, app.job_listing, app.company, app.position, profile.name);
    db.prepare("UPDATE applications SET cover_letter = ?, updated_at = datetime('now') WHERE id = ?")
      .run(letter, req.params.id);
    res.json({ cover_letter: letter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
