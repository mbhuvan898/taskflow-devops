const router     = require('express').Router();
const { body, validationResult } = require('express-validator');
const { pool }   = require('../db');
const auth       = require('../middleware/auth');
const { upload, deleteFile } = require('../db/s3');

router.use(auth);

/* ── List / search / filter ─────────────────────── */
router.get('/', async (req, res) => {
  try {
    const {
      search, priority, completed, category_id,
      tag, overdue, sort = 'position', order = 'ASC',
      page = 1, limit = 100,
    } = req.query;

    const conds  = ['t.user_id=$1'];
    const params = [req.user.id];
    let p = 2;

    if (search) {
      conds.push(`(t.title ILIKE $${p} OR t.description ILIKE $${p})`);
      params.push(`%${search}%`); p++;
    }
    if (priority)    { conds.push(`t.priority=$${p}`);        params.push(priority);           p++; }
    if (completed !== undefined)
                     { conds.push(`t.completed=$${p}`);        params.push(completed==='true'); p++; }
    if (category_id) { conds.push(`t.category_id=$${p}`);     params.push(+category_id);       p++; }
    if (tag)         { conds.push(`$${p}=ANY(t.tags)`);       params.push(tag);                p++; }
    if (overdue==='true') conds.push('t.due_date<NOW() AND t.completed=false');

    const safe = ['position','created_at','due_date','priority','title'];
    const col  = safe.includes(sort) ? sort : 'position';
    const dir  = order==='DESC' ? 'DESC' : 'ASC';
    const off  = (+page - 1) * +limit;

    const { rows: todos } = await pool.query(`
      SELECT t.*,
        c.name  AS category_name,
        c.color AS category_color,
        c.icon  AS category_icon
      FROM todos t
      LEFT JOIN categories c ON c.id=t.category_id
      WHERE ${conds.join(' AND ')}
      ORDER BY t.${col} ${dir}, t.created_at DESC
      LIMIT $${p} OFFSET $${p+1}
    `, [...params, +limit, off]);

    const { rows: ct } = await pool.query(
      `SELECT COUNT(*)::int AS n FROM todos t WHERE ${conds.join(' AND ')}`,
      params
    );

    res.json({ todos, total: ct[0].n, page: +page });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── Create ─────────────────────────────────────── */
router.post('/', upload.single('file'), [
  body('title').trim().notEmpty().isLength({ max: 500 }),
  body('priority').optional().isIn(['low','medium','high','urgent']),
], async (req, res) => {
  const errs = validationResult(req);
  if (!errs.isEmpty()) return res.status(400).json({ errors: errs.array() });

  try {
    const { title, description='', priority='medium', due_date, category_id, tags } = req.body;

    const { rows: pos } = await pool.query(
      'SELECT COALESCE(MAX(position),0)+1 AS n FROM todos WHERE user_id=$1', [req.user.id]
    );
    const tagsArr = tags
      ? (typeof tags === 'string' ? JSON.parse(tags) : tags)
      : [];

    const { rows } = await pool.query(`
      INSERT INTO todos
        (user_id,category_id,title,description,priority,due_date,position,tags,
         file_url,file_name,file_type,file_size)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *
    `, [
      req.user.id,
      category_id || null,
      title, description, priority,
      due_date || null,
      pos[0].n,
      tagsArr,
      req.file?.location    || null,
      req.file?.originalname|| null,
      req.file?.mimetype    || null,
      req.file?.size        || null,
    ]);

    await pool.query(
      'INSERT INTO activity_log(user_id,todo_id,action,detail) VALUES($1,$2,$3,$4)',
      [req.user.id, rows[0].id, 'created', title]
    );
    res.status(201).json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── Get one ─────────────────────────────────────── */
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
      FROM todos t LEFT JOIN categories c ON c.id=t.category_id
      WHERE t.id=$1 AND t.user_id=$2
    `, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── Update ─────────────────────────────────────── */
router.put('/:id', upload.single('file'), async (req, res) => {
  try {
    const { rows: ex } = await pool.query(
      'SELECT * FROM todos WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]
    );
    if (!ex.length) return res.status(404).json({ error: 'Not found' });
    const old = ex[0];

    let fu=old.file_url, fn=old.file_name, ft=old.file_type, fs=old.file_size;
    if (req.file) {
      await deleteFile(fu);
      fu=req.file.location; fn=req.file.originalname; ft=req.file.mimetype; fs=req.file.size;
    }

    const { title, description, priority, due_date, category_id, completed, tags } = req.body;
    const comp = completed !== undefined ? completed==='true' : old.completed;
    const compAt = (comp && !old.completed) ? new Date() : (!comp ? null : old.completed_at);
    const tagsArr = tags
      ? (typeof tags === 'string' ? JSON.parse(tags) : tags)
      : old.tags;

    const { rows } = await pool.query(`
      UPDATE todos SET
        title=$1, description=$2, priority=$3, due_date=$4,
        category_id=$5, completed=$6, completed_at=$7, tags=$8,
        file_url=$9, file_name=$10, file_type=$11, file_size=$12
      WHERE id=$13 AND user_id=$14 RETURNING *
    `, [
      title || old.title,
      description !== undefined ? description : old.description,
      priority    || old.priority,
      due_date !== undefined ? (due_date || null) : old.due_date,
      category_id !== undefined ? (category_id||null) : old.category_id,
      comp, compAt, tagsArr,
      fu, fn, ft, fs,
      req.params.id, req.user.id,
    ]);

    await pool.query(
      'INSERT INTO activity_log(user_id,todo_id,action,detail) VALUES($1,$2,$3,$4)',
      [req.user.id, req.params.id, 'updated', rows[0].title]
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── Toggle complete ────────────────────────────── */
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      UPDATE todos SET
        completed    = NOT completed,
        completed_at = CASE WHEN NOT completed THEN NOW() ELSE NULL END
      WHERE id=$1 AND user_id=$2 RETURNING *
    `, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    await pool.query(
      'INSERT INTO activity_log(user_id,todo_id,action) VALUES($1,$2,$3)',
      [req.user.id, req.params.id, rows[0].completed ? 'completed' : 'reopened']
    );
    res.json(rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── Delete ─────────────────────────────────────── */
router.delete('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM todos WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    await deleteFile(rows[0].file_url);
    await pool.query('DELETE FROM todos WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

/* ── Remove attachment only ─────────────────────── */
router.delete('/:id/file', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM todos WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    await deleteFile(rows[0].file_url);
    await pool.query(
      'UPDATE todos SET file_url=NULL,file_name=NULL,file_type=NULL,file_size=NULL WHERE id=$1',
      [req.params.id]
    );
    res.json({ message: 'File removed' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
