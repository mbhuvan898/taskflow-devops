const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.RDS_HOST     || 'localhost',
  port:     parseInt(process.env.RDS_PORT) || 5432,
  database: process.env.RDS_DB      || 'taskflowdb',
  user:     process.env.RDS_USER     || 'postgres',
  password: process.env.RDS_PASSWORD || '',
  ssl: process.env.RDS_HOST && process.env.RDS_HOST !== 'localhost'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => console.error('DB pool error:', err.message));

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      -- Users
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username    VARCHAR(50)  UNIQUE NOT NULL,
        email       VARCHAR(255) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        avatar_url  TEXT,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      -- Categories
      CREATE TABLE IF NOT EXISTS categories (
        id          SERIAL PRIMARY KEY,
        user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
        name        VARCHAR(100) NOT NULL,
        color       VARCHAR(7)   DEFAULT '#f472b6',
        icon        VARCHAR(10)  DEFAULT '📁',
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );

      -- Todos
      CREATE TABLE IF NOT EXISTS todos (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
        category_id  INT  REFERENCES categories(id) ON DELETE SET NULL,
        title        VARCHAR(500) NOT NULL,
        description  TEXT,
        completed    BOOLEAN     DEFAULT false,
        priority     VARCHAR(10) DEFAULT 'medium'
                       CHECK (priority IN ('low','medium','high','urgent')),
        due_date     DATE,
        position     INT         DEFAULT 0,
        tags         TEXT[]      DEFAULT '{}',
        file_url     TEXT,
        file_name    TEXT,
        file_type    TEXT,
        file_size    BIGINT,
        completed_at TIMESTAMPTZ,
        created_at   TIMESTAMPTZ DEFAULT NOW(),
        updated_at   TIMESTAMPTZ DEFAULT NOW()
      );

      -- Activity log
      CREATE TABLE IF NOT EXISTS activity_log (
        id         SERIAL PRIMARY KEY,
        user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
        todo_id    UUID,
        action     VARCHAR(50) NOT NULL,
        detail     TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Auto-update updated_at
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS todos_updated_at ON todos;
      CREATE TRIGGER todos_updated_at
        BEFORE UPDATE ON todos
        FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
    console.log('✅  Database schema ready');
  } catch (err) {
    console.error('❌  DB init error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
