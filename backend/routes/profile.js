const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const profile = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);
  res.json(profile || {});
});

router.put('/', (req, res) => {
  const { name, email, resume, writing_style } = req.body;
  const existing = db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId);

  if (existing) {
    db.prepare("UPDATE profiles SET name = ?, email = ?, resume = ?, writing_style = ?, updated_at = datetime('now') WHERE user_id = ?")
      .run(name ?? existing.name, email ?? existing.email, resume ?? existing.resume, writing_style ?? existing.writing_style, req.userId);
  } else {
    db.prepare('INSERT INTO profiles (user_id, name, email, resume, writing_style) VALUES (?, ?, ?, ?, ?)')
      .run(req.userId, name || null, email || null, resume || null, writing_style || null);
  }
  res.json(db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(req.userId));
});

module.exports = router;
