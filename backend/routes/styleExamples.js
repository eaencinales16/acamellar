const express = require('express');
const router = express.Router();
const db = require('../db');

// Sample documents that teach Claude the candidate's authentic voice (per user).

router.get('/', (req, res) => {
  const { doc_type } = req.query;
  let query = 'SELECT * FROM style_examples WHERE user_id = ?';
  const params = [req.userId];
  if (doc_type) {
    query += ' AND doc_type = ?';
    params.push(doc_type);
  }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { doc_type, label, content } = req.body;
  if (!doc_type || !content) return res.status(400).json({ error: 'doc_type and content required' });
  if (!['resume', 'cover_letter'].includes(doc_type)) return res.status(400).json({ error: 'invalid doc_type' });
  const result = db.prepare('INSERT INTO style_examples (user_id, doc_type, label, content) VALUES (?, ?, ?, ?)')
    .run(req.userId, doc_type, label || null, content);
  res.status(201).json(db.prepare('SELECT * FROM style_examples WHERE id = ?').get(result.lastInsertRowid));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM style_examples WHERE id = ? AND user_id = ?').run(req.params.id, req.userId);
  res.json({ success: true });
});

module.exports = router;
