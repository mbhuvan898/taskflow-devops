# ⚡ TaskFlow — Full-Stack Todo App
### Create React App + Node/Express + Amazon RDS + Amazon S3 + JWT

> **No Vite.** Uses Create React App (CRA) with the built-in `proxy` field
> to forward `/api` calls to the Express server — zero CORS config needed.

---

## 📁 Project Structure

```
taskflow/
├── package.json              ← Root: runs both servers with concurrently
│
├── server/                   ← Node.js + Express API  (port 5000)
│   ├── index.js              ← Entry point
│   ├── package.json
│   ├── .env.example          ← Copy to .env
│   ├── db/
│   │   ├── index.js          ← PostgreSQL pool + auto schema init
│   │   └── s3.js             ← S3 client, multer-s3 upload, deleteFile()
│   ├── middleware/
│   │   └── auth.js           ← JWT verification middleware
│   └── routes/
│       ├── auth.js           ← /api/auth/*
│       ├── todos.js          ← /api/todos/*
│       ├── categories.js     ← /api/categories/*
│       └── analytics.js      ← /api/analytics/dashboard
│
└── client/                   ← React (CRA)  (port 3000)
    ├── package.json          ← "proxy": "http://localhost:5000"  ← key line
    ├── public/index.html
    └── src/
        ├── index.js          ← ReactDOM.render
        ├── App.js            ← Router + providers
        ├── index.css         ← Full design system
        ├── context/
        │   ├── AuthContext.js
        │   └── ToastContext.js
        ├── utils/api.js      ← axios client (relative /api paths)
        ├── components/
        │   ├── Sidebar.js
        │   ├── TodoCard.js
        │   ├── TodoModal.js
        │   └── CategoryModal.js
        └── pages/
            ├── AuthPage.js
            ├── TodosPage.js
            ├── AnalyticsPage.js
            └── ProfilePage.js
```

---

## 🚀 Quick Start (Local Dev)

### Step 1 — Prerequisites
```bash
node --version   # Need v18+
npm  --version   # Need v9+
```

### Step 2 — Install Everything
```bash
# From the taskflow/ root folder:
npm install            # installs concurrently
cd server && npm install && cd ..
cd client && npm install && cd ..
```

Or use the shortcut:
```bash
npm run install:all
```

### Step 3 — Configure the Server
```bash
cd server
cp .env.example .env
# Open .env and fill in your values (see below)
```

### Step 4 — Create the Database
```bash
# macOS
createdb taskflowdb

# Ubuntu
sudo -u postgres createdb taskflowdb

# The tables are created AUTOMATICALLY when the server first starts
```

### Step 5 — Run Both Servers
```bash
# From the taskflow/ root:
npm run dev
```

This starts:
- **API**  → http://localhost:5000
- **App**  → http://localhost:3000

CRA's `"proxy": "http://localhost:5000"` in `client/package.json`
automatically forwards every `/api/*` request to the Express server.

---

## 🔑 Environment Variables (`server/.env`)

```env
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d

# Amazon RDS — use localhost for local PostgreSQL
RDS_HOST=localhost
RDS_PORT=5432
RDS_DB=taskflowdb
RDS_USER=postgres
RDS_PASSWORD=your_password

# Amazon S3 — leave blank to skip file uploads
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name

# CORS — CRA dev server
CLIENT_URL=http://localhost:3000
```

---

## ☁️ AWS Setup

### Amazon RDS (PostgreSQL)
1. AWS Console → RDS → Create Database → PostgreSQL
2. Free tier template, set DB name `taskflowdb`
3. Public access: **Yes** (for dev)
4. Security group: allow inbound TCP 5432 from your IP
5. Copy the **Endpoint** → paste as `RDS_HOST` in `.env`
6. Change `RDS_HOST=localhost` to the endpoint and set `NODE_ENV=production`
   (this enables `ssl: { rejectUnauthorized: false }` automatically)

### Amazon S3
1. AWS Console → S3 → Create bucket
2. Uncheck "Block all public access"
3. IAM → User → attach `AmazonS3FullAccess` → create access key
4. Copy Key ID + Secret → paste into `.env`

---

## 🏗️ Production Build

```bash
# Build the React app
npm run build
# → outputs to client/build/

# Start the server (serves the React build + API)
NODE_ENV=production npm start
# → Everything on http://localhost:5000
```

---

## 🧪 Test the API directly

```bash
# Health
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","email":"alice@test.com","password":"secret123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@test.com","password":"secret123"}'

# Use the token from login response:
TOKEN="eyJ..."
curl http://localhost:5000/api/todos -H "Authorization: Bearer $TOKEN"
```

---

## ✨ Features

| Feature | Details |
|---------|---------|
| 🔐 Auth | Register/login, JWT tokens, bcrypt passwords |
| 📋 Tasks | Full CRUD, toggle, search, filter, sort |
| 🎯 Priority | Low/Medium/High/Urgent with color badges |
| 📂 Categories | Custom icon + color, seeded on register |
| 🏷️ Tags | Multi-tag with inline add/remove |
| 📅 Due Dates | Date picker, overdue highlighting |
| 📎 Attachments | Upload to S3, image thumbnails, delete cleanup |
| 📊 Analytics | Charts (recharts), completion ring, trend line |
| 👤 Profile | Avatar upload to S3, category management |
| 🔔 Toasts | Global success/error/info notifications |
| 🛡️ Security | Helmet, rate limiting, SQL-injection-safe queries |
| 📝 Activity Log | All todo actions recorded in DB |

---

## 🩺 Troubleshooting

| Problem | Fix |
|---------|-----|
| `ECONNREFUSED 5432` | Start PostgreSQL: `brew services start postgresql` |
| `relation "users" does not exist` | Tables auto-create on server start — check DB name |
| CRA proxy not working | Make sure server is running on port **5000** |
| S3 upload fails | Check `AWS_*` values in `.env`; bucket must allow public-read |
| `npm install` error on CRA | Use Node v18–v20; CRA has issues with v21+ |
