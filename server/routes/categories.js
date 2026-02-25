const router = require('express').Router();
const { pool } = require('../db');
const auth     = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT c.*,
        COUNT(t.id)::int                                AS total,
        COUNT(t.id) FILTER(WHERE NOT t.completed)::int AS active
      FROM categories c
      LEFT JOIN todos t ON t.category_id=c.id
      WHERE c.user_id=$1
      GROUP BY c.id ORDER BY c.created_at
    `, [req.user.id]);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { name, color='#f472b6', icon='📁' } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name required' });
    const { rows } = await pool.query(
      'INSERT INTO categories(user_id,name,color,icon) VALUES($1,$2,$3,$4) RETURNING *',
      [req.user.id, name.trim(), color, icon]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, color, icon } = req.body;
    const { rows } = await pool.query(`
      UPDATE categories SET
        name  = COALESCE($1, name),
        color = COALESCE($2, color),
        icon  = COALESCE($3, icon)
      WHERE id=$4 AND user_id=$5 RETURNING *
    `, [name, color, icon, req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM categories WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
