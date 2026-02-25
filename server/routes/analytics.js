const router = require('express').Router();
const { pool } = require('../db');
const auth     = require('../middleware/auth');

router.use(auth);

router.get('/dashboard', async (req, res) => {
  try {
    const uid = req.user.id;
    const [totals, byPriority, byCategory, trend, activity, upcoming] = await Promise.all([
      pool.query(`
        SELECT
          COUNT(*)::int                                         AS total,
          COUNT(*) FILTER(WHERE completed)::int                 AS completed,
          COUNT(*) FILTER(WHERE NOT completed)::int             AS active,
          COUNT(*) FILTER(WHERE NOT completed AND due_date<NOW())::int AS overdue,
          COUNT(*) FILTER(WHERE due_date::date=CURRENT_DATE AND NOT completed)::int AS due_today,
          ROUND(100.0*COUNT(*) FILTER(WHERE completed)/NULLIF(COUNT(*),0),1) AS rate
        FROM todos WHERE user_id=$1
      `, [uid]),
      pool.query(`
        SELECT priority,
          COUNT(*)::int AS total,
          COUNT(*) FILTER(WHERE completed)::int AS done
        FROM todos WHERE user_id=$1 GROUP BY priority
      `, [uid]),
      pool.query(`
        SELECT c.name,c.color,c.icon,
          COUNT(t.id)::int AS total,
          COUNT(t.id) FILTER(WHERE t.completed)::int AS done
        FROM categories c
        LEFT JOIN todos t ON t.category_id=c.id AND t.user_id=$1
        WHERE c.user_id=$1 GROUP BY c.id ORDER BY total DESC
      `, [uid]),
      pool.query(`
        SELECT DATE(completed_at) AS day, COUNT(*)::int AS count
        FROM todos WHERE user_id=$1 AND completed
          AND completed_at >= NOW()-INTERVAL '14 days'
        GROUP BY day ORDER BY day
      `, [uid]),
      pool.query(`
        SELECT al.action, al.detail, al.created_at, t.title
        FROM activity_log al LEFT JOIN todos t ON al.todo_id=t.id
        WHERE al.user_id=$1 ORDER BY al.created_at DESC LIMIT 10
      `, [uid]),
      pool.query(`
        SELECT id,title,due_date,priority
        FROM todos
        WHERE user_id=$1 AND NOT completed AND due_date>=CURRENT_DATE
        ORDER BY due_date LIMIT 5
      `, [uid]),
    ]);

    res.json({
      totals:         totals.rows[0],
      byPriority:     byPriority.rows,
      byCategory:     byCategory.rows,
      trend:          trend.rows,
      recentActivity: activity.rows,
      upcoming:       upcoming.rows,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
