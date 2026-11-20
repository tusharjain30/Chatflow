# ChatFlow

Monorepo with one backend and three separate dashboard apps.

## Folders

| Folder | Purpose | Dev URL | Command |
|--------|---------|---------|---------|
| `backend` | API + Prisma | `http://localhost:4000` | `cd backend && npm run dev` |
| `customer-owner` | Owner / customer dashboard | `http://localhost:5173` | `cd customer-owner && npm run dev` |
| `reseller` | Reseller dashboard | `http://localhost:8081` | `cd reseller && npm run dev` |
| `admin` | Super admin dashboard | `http://localhost:8082` | `cd admin && npm run dev` |

> Note: port `8080` is often used by EDB Postgres/Apache on Windows, so the owner app uses `5173`.

> `frontend/` is the old combined app. Prefer the three apps above.

## Setup

```bash
cd backend && npm install
cd ../customer-owner && npm install
cd ../reseller && npm install
cd ../admin && npm install
```

Copy each app's `.env.example` to `.env` if needed.

## Redis + BullMQ + Socket.IO

The backend uses Redis for:

- **BullMQ** — email jobs (forgot password) and campaign batch workers
- **Socket.IO** — live campaign progress / chat message events to the owner app

Set `REDIS_URL` in `backend/.env` (default `redis://127.0.0.1:6379`).

```bash
# Docker example
docker run -d --name chatflow-redis -p 6379:6379 redis:7-alpine
```

Socket.IO path: `http://localhost:4000/socket.io` (owner app connects automatically after login).
