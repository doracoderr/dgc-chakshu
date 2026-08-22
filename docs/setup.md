# Setup Guide

This guide gets DGC Chakshu running on your machine for local development.

## Prerequisites

- **Node.js** v18 or higher — [download](https://nodejs.org)
- **Git** — [download](https://git-scm.com)
- A **MongoDB Atlas** connection string (free tier). Ask the project lead for the shared dev database credentials, or [create your own free cluster](https://www.mongodb.com/cloud/atlas/register) for local testing.
- A code editor — VS Code recommended.

## 1. Clone the repository

```bash
git clone https://github.com/doracoderr/dgc-chakshu.git
cd dgc-chakshu
git checkout dev
```

All active development happens on `dev`. Never branch off `main` directly.

## 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and fill in:

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
CLIENT_URL=http://localhost:5173
```

Start the server:

```bash
npm run dev
```

The API should now be running at `http://localhost:5000`. Visit `http://localhost:5000/api/health` to confirm it's up.

## 3. Frontend setup

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

The app should now be running at `http://localhost:5173`.

## 4. Verify your setup

- Backend health check: `http://localhost:5000/api/health` → should return `{ "success": true }`
- Frontend: `http://localhost:5173` → should load the homepage without console errors

## 5. Start working on a task

```bash
git checkout dev
git pull origin dev
git checkout -b feature/short-task-name
```

Make your changes, then:

```bash
git add .
git commit -m "feat: short description of what you did"
git push origin feature/short-task-name
```

Open a Pull Request on GitHub with **base branch set to `dev`** (not `main`).

## Troubleshooting

| Issue | Fix |
|---|---|
| `MongoServerError: bad auth` | Double-check `MONGO_URI` in `.env` — no extra spaces, correct password |
| `Port 5000 already in use` | Change `PORT` in `.env` or stop the other process using that port |
| Frontend can't reach backend | Confirm backend is running and `CLIENT_URL`/API base URL match |
| `npm install` fails | Delete `node_modules` and `package-lock.json`, then retry |

Still stuck? Ask in the group chat with the exact error message and a screenshot.
