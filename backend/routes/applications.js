const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const db = require('../db');
const { tailorResume, generateCoverLetter, extractJob } = require('../services/ai');
const { buildPdf, buildDocx } = require('../services/documents');

router.get('/', (req, res) => {
  const apps = db.prepare('SELECT * FROM applications WHERE user_id = ? ORDER BY updated_at DESC').all(req.userId);
  res.json(apps);
});

// Capture a job posting from a URL: fetch the page, strip to text, AI-extract fields.
// Returns parsed fields for the frontend to review before saving — does not save.
router.post('/capture', async (req, res) => {
  const { url } = req.body;
  if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'A valid http(s) URL is required' });
  try {
    const resp = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ACamellarBot/1.0)' }, redirect: 'follow' });
    if (!resp.ok) return res.status(422).json({ error: `Couldn't fetch that page (HTTP ${resp.status}). Paste the listing manually instead.` });
    const html = await resp.text();
    const $ = cheerio.load(html);
    $('script, style, noscript, svg, header nav, footer').remove();
    const pageText = $('body').text().replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();
    if (!pageText || pageText.length < 50) return res.status(422).json({ error: "Couldn't read that page (it may require login or JavaScript). Paste the listing manually." });
    const parsed = await extractJob(pageText, url);
    res.json({ ...parsed, job_url: url });
  } catch (err) {
    res.status(500).json({ error: `Capture failed: ${err.message}. You can paste the listing manually.` });
  }
});

router.get('/:id', (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!app) return res.status(404).json({ error: 'Not found' });
  res.json(app);
});

router.post('/', (req, res) => {
  const { company, position, job_url, job_listing, status, applied_date, notes } = req.body;
  if (!company || !position) return res.status(400).json({ error: 'company and position required' });
  const result = db.prepare(
    'INSERT INTO applications (user_id, company, position, job_url, job_listing, status, applied_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(req.userId, company, position, job_url || null, job_listing || null, status || 'researching', applied_date || null, notes || null);
  const created = db.prepare('SELECT * FROM applications WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const { company, position, job_url, job_listing, status, applied_date, notes, tailored_resume, cover_letter } = req.body;
  const existing = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  db.prepare(`UPDATE applications SET
    company = ?, position = ?, job_url = ?, job_listing = ?, status = ?,
    applied_date = ?, notes = ?, tailored_resume = ?, cover_letter = ?,
    updated_at = datetime('now')
    WHERE id = ? AND user_id = ?`).run(
    company ?? existing.company,
    position ?? existing.position,
    job_url ?? existing.job_url,
    job_listing ?? existing.job_listing,
    status ?? existing.status,
    applied_date ?? existing.applied_date,
    notes ?? existing.notes,
    tailored_resume ?? existing.tailored_resume,
    cover_letter ?? existing.cover_letter,
    req.params.id, req.userId
  );
  res.json(db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM applications WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

router.post('/:id/tailor-resume', async (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  if (!app.job_listing) return res.status(400).json({ error: 'Add job listing first' });

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
  if (!profile?.resume) return res.status(400).json({ error: 'Add your base resume in Profile first' });

  const examples = db.prepare("SELECT label, content FROM style_examples WHERE user_id = ? AND doc_type = 'resume' ORDER BY created_at DESC LIMIT 2").all(req.userId);

  try {
    const tailored = await tailorResume(profile.resume, app.job_listing, app.company, app.position, { writingStyle: profile.writing_style, examples });
    db.prepare("UPDATE applications SET tailored_resume = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?")
      .run(tailored, req.params.id, req.userId);
    res.json({ tailored_resume: tailored });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/cover-letter', async (req, res) => {
  const app = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!app) return res.status(404).json({ error: 'Application not found' });
  if (!app.job_listing) return res.status(400).json({ error: 'Add job listing first' });

  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
  if (!profile?.resume) return res.status(400).json({ error: 'Add your base resume in Profile first' });

  const examples = db.prepare("SELECT label, content FROM style_examples WHERE user_id = ? AND doc_type = 'cover_letter' ORDER BY created_at DESC LIMIT 2").all(req.userId);

  try {
    const letter = await generateCoverLetter(profile.resume, app.job_listing, app.company, app.position, profile.name, { writingStyle: profile.writing_style, examples });
    db.prepare("UPDATE applications SET cover_letter = ?, updated_at = datetime('now') WHERE id = ? AND user_id = ?")
      .run(letter, req.params.id, req.userId);
    res.json({ cover_letter: letter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download a tailored resume or cover letter as PDF or Word.
// ?doc=resume|cover &format=pdf|docx
router.get('/:id/export', async (req, res) => {
  const { doc = 'resume', format = 'pdf' } = req.query;
  const app = db.prepare('SELECT * FROM applications WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!app) return res.status(404).json({ error: 'Application not found' });

  const isCover = doc === 'cover';
  const text = isCover ? app.cover_letter : app.tailored_resume;
  if (!text) return res.status(400).json({ error: `No ${isCover ? 'cover letter' : 'tailored resume'} generated yet` });

  const safe = s => (s || '').replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '');
  const base = `${isCover ? 'CoverLetter' : 'Resume'}_${safe(app.company)}_${safe(app.position)}`;

  try {
    if (format === 'docx') {
      const buf = await buildDocx(text);
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${base}.docx"`);
      return res.send(buf);
    }
    const buf = await buildPdf(text);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${base}.pdf"`);
    res.send(buf);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
