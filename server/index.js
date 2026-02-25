require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const { initDB }  = require('./db');
const authRoutes  = require('./routes/auth');
const todoRoutes  = require('./routes/todos');
const catRoutes   = require('./routes/categories');
const analRoutes  = require('./routes/analytics');

const app = express();

/* ── Security ─────────────────────────────────── */
app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

/* ── CORS ─────────────────────────────────────── */
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Rate limiting ────────────────────────────── */
app.use('/api/', rateLimit({ windowMs: 15*60*1000, max: 500, standardHeaders: true }));
app.use('/api/auth/', rateLimit({ windowMs: 15*60*1000, max: 30 }));

/* ── API Routes ───────────────────────────────── */
app.use('/api/auth',        authRoutes);
app.use('/api/todos',       todoRoutes);
app.use('/api/categories',  catRoutes);
app.use('/api/analytics',   analRoutes);

/* ── Health check ─────────────────────────────── */
app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', time: new Date().toISOString() })
);

/* ── Serve CRA build in production ───────────── */
if (process.env.NODE_ENV === 'production') {
  const build = path.join(__dirname, '../client/build');
  app.use(express.static(build));
  app.get('*', (_, res) => res.sendFile(path.join(build, 'index.html')));
}

/* ── Global error handler ─────────────────────── */
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(413).json({ error: 'File too large (max 10 MB)' });
  console.error(err);
  res.status(500).json({ error: process.env.NODE_ENV === 'production' ? 'Server error' : err.message });
});

/* ── Start ───────────────────────────────────── */
const PORT = process.env.PORT || 5000;
initDB()
  .then(() => app.listen(PORT, () => {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  ⚡  TaskFlow API`);
    console.log(`  🚀  http://localhost:${PORT}`);
    console.log(`  🗄️   RDS  → ${process.env.RDS_HOST || 'localhost'}`);
    console.log(`  ☁️   S3   → ${process.env.S3_BUCKET || '(not configured)'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }))
  .catch(err => { console.error('Startup failed:', err); process.exit(1); });
