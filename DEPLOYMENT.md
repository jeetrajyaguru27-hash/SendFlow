# SendFlow Deployment Guide

This repo is now prepared for production deployment with:

- React frontend
- FastAPI backend
- Redis-backed RQ worker
- PostgreSQL for production data

## Recommended Setup

Use:

- `Render` for backend API + worker + Redis + Postgres
- `Vercel` or `Render Static Site` for the frontend

If you want the easiest single-provider path, use `Render` for everything with the included [render.yaml](/Users/j3et/Downloads/CODE/Email%20Automation/render.yaml:1).

## What Was Prepared

- Frontend now accepts both `VITE_API_URL` and `VITE_API_BASE_URL`
- Backend CORS now reads from `FRONTEND_URL` and `CORS_ORIGINS`
- Database URL now supports Render/Railway style `postgres://` URLs
- Postgres driver was added to `requirements.txt`
- Render blueprint was added in [render.yaml](/Users/j3et/Downloads/CODE/Email%20Automation/render.yaml:1)

## Option 1: Render Only

### 1. Push this folder to GitHub

Your repo should include:

- [render.yaml](/Users/j3et/Downloads/CODE/Email%20Automation/render.yaml:1)
- [requirements.txt](/Users/j3et/Downloads/CODE/Email%20Automation/requirements.txt:1)
- [sendflow-pro-main](/Users/j3et/Downloads/CODE/Email%20Automation/sendflow-pro-main)
- [backend](/Users/j3et/Downloads/CODE/Email%20Automation/backend)

### 2. Create the Render Blueprint

In Render:

1. Click `New +`
2. Choose `Blueprint`
3. Connect your GitHub repo
4. Render will detect `render.yaml`

It will create:

- `sendflow-api`
- `sendflow-worker`
- `sendflow-web`
- `sendflow-redis`
- `sendflow-db`

### 3. Set the required environment variables

Render will ask for the `sync: false` variables. Set these values:

For `sendflow-api`:

- `FRONTEND_URL=https://your-frontend-domain.onrender.com`
- `BASE_URL=https://your-api-domain.onrender.com`
- `CORS_ORIGINS=https://your-frontend-domain.onrender.com`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `GOOGLE_REDIRECT_URI=https://your-api-domain.onrender.com/auth/callback`

For `sendflow-worker`:

- `SECRET_KEY` must be the same as the API service
- `FRONTEND_URL=https://your-frontend-domain.onrender.com`
- `BASE_URL=https://your-api-domain.onrender.com`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `GOOGLE_REDIRECT_URI=https://your-api-domain.onrender.com/auth/callback`

For `sendflow-web`:

- `VITE_API_URL=https://your-api-domain.onrender.com`

### 4. Update Google Cloud OAuth

In Google Cloud Console:

1. Open `APIs & Services` -> `Credentials`
2. Open your OAuth client
3. Add this redirect URI:

```text
https://your-api-domain.onrender.com/auth/callback
```

4. In `OAuth consent screen`:

- publish the app
- add your production domain
- if Google still keeps the app in testing mode, add test users manually until publishing is complete

### 5. Deploy

After the env vars are saved, Render will deploy all services.

Production URLs:

- Frontend: `https://your-frontend-domain.onrender.com`
- API: `https://your-api-domain.onrender.com`

## Option 2: Vercel Frontend + Render Backend

This is a very good production split too.

### Backend on Render

Use the same steps above, but only keep:

- `sendflow-api`
- `sendflow-worker`
- `sendflow-redis`
- `sendflow-db`

You can ignore the static `sendflow-web` service if you use Vercel.

### Frontend on Vercel

In Vercel:

1. Import the repo
2. Set project root to:

```text
sendflow-pro-main
```

3. Set:

- Build Command: `npm run build`
- Output Directory: `dist`

4. Add env var:

```text
VITE_API_URL=https://your-api-domain.onrender.com
```

5. Deploy

Then set on Render:

- `FRONTEND_URL=https://your-vercel-domain.vercel.app`
- `CORS_ORIGINS=https://your-vercel-domain.vercel.app`

And update Google OAuth redirect:

```text
https://your-api-domain.onrender.com/auth/callback
```

## Required Environment Variables

Use these in production:

```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-api-domain.com/auth/callback

SECRET_KEY=very_long_random_secret
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com
BASE_URL=https://your-api-domain.com

DEV_MODE=false
MAX_EMAILS_PER_DAY=30
MIN_DELAY_MINUTES=2
MAX_DELAY_MINUTES=7
```

## Before You Go Live

Do these checks:

- Login with Google works from the deployed frontend
- Campaign creation works
- CSV import works
- `Send Now` works
- Worker is processing jobs
- Tracking links use the production `BASE_URL`
- Unsubscribe links open your deployed backend domain

## Notes

- Development uses SQLite, but production should use Postgres
- Production should always use Redis so background jobs survive restarts
- The frontend is a static app, so Vercel or Render Static Site both work well
- The API and worker must share the same `SECRET_KEY`, DB, and Redis

## Quick Deploy Order

If you want the shortest path:

1. Push repo to GitHub
2. Deploy backend + worker + Redis + Postgres on Render
3. Deploy frontend on Vercel
4. Set env vars
5. Update Google OAuth redirect URI
6. Test login and send flow
