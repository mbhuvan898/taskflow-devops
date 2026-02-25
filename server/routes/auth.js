const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool }   = require('../db');
const auth       = require('../middleware/auth');
const { upload } = require('../db/s3');

const sign = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/* ── Register ─────────────────────────────────────── */
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 50 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  try {
    const { username, email, password } = req.body;
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (username,email,password) VALUES ($1,$2,$3)
       RETURNING id,username,email,created_at`,
      [username, email, hash]
    );
    const user = rows[0];

    // seed default categories
    await pool.query(`
      INSERT INTO categories (user_id,name,color,icon) VALUES
        ($1,'Personal','#f472b6','🏠'),
        ($1,'Work','#60a5fa','💼'),
        ($1,'Shopping','#fb923c','🛒'),
        ($1,'Health','#4ade80','❤️')
    `, [user.id]);

    res.status(201).json({ token: sign(user.id), user });
  } catch (e) {
    if (e.code === '23505')
      return res.status(409).json({ error: 'Username or email already taken' });
    res.status(500).json({ error: e.message });
  }
});

/* ── Login ───────────────────────────────────────── */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  try {
    const { email, password } = req.body;
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, rows[0].password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const { password: _, ...user } = rows[0];
    res.json({ token: sign(user.id), user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ── Current user ────────────────────────────────── */
router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.username, u.email, u.avatar_url, u.created_at,
        (SELECT COUNT(*)                          FROM todos WHERE user_id=u.id)::int AS total_todos,
        (SELECT COUNT(*) FILTER(WHERE completed)  FROM todos WHERE user_id=u.id)::int AS done_todos,
        (SELECT COUNT(*) FILTER(WHERE NOT completed AND due_date < NOW())
                                                  FROM todos WHERE user_id=u.id)::int AS overdue_todos
      FROM users u WHERE u.id=$1
    `, [req.user.id]);
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── Upload avatar (→ S3) ────────────────────────── */
router.post('/avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });
    await pool.query('UPDATE users SET avatar_url=$1 WHERE id=$2', [req.file.location, req.user.id]);
    res.json({ avatar_url: req.file.location });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
