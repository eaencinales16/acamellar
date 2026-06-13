const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const profile = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();
  res.json(profile || {});
});

router.put('/', (req, res) => {
  const { name, email, resume, writing_style } = req.body;
  const existing = db.prepare('SELECT * FROM user_profile WHERE id = 1').get();

  if (existing) {
    db.prepare("UPDATE user_profile SET name = ?, email = ?, resume = ?, writing_style = ?, updated_at = datetime('now') WHERE id = 1")
      .run(name ?? existing.name, email ?? existing.email, resume ?? existing.resume, writing_style ?? existing.writing_style);
  } else {
    db.prepare('INSERT INTO user_profile (id, name, email, resume, writing_style) VALUES (1, ?, ?, ?, ?)')
      .run(name || null, email || null, resume || null, writing_style || null);
  }
  res.json(db.prepare('SELECT * FROM user_profile WHERE id = 1').get());
});

module.exports = router;
