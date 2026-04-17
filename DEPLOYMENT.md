# SendFlow Free Deployment Guide

This repo is now prepared for a free deployment setup with:

- Render free web service for the FastAPI API
- Render free static site for the React frontend
- Render free Postgres database
- GitHub Actions cron for scheduled campaign processing

## Architecture

- `sendflow-web` serves the frontend
- `sendflow-api` serves the backend API
- `sendflow-db` stores application data
- GitHub Actions triggers `POST /internal/scheduler/run` every 5 minutes

There is no paid persistent worker in this setup.

## What To Push

Make sure GitHub has:

- [render.yaml](/Users/j3et/Downloads/CODE/Email%20Automation/render.yaml:1)
- [.github/workflows/sendflow-scheduler.yml](/Users/j3et/Downloads/CODE/Email%20Automation/.github/workflows/sendflow-scheduler.yml:1)
- [backend](/Users/j3et/Downloads/CODE/Email%20Automation/backend)
- [sendflow-pro-main](/Users/j3et/Downloads/CODE/Email%20Automation/sendflow-pro-main)

## Render Setup

### 1. Create the Blueprint

In Render:

1. Click `New +`
2. Choose `Blueprint`
3. Select this GitHub repo
4. Use branch `main`
5. Use blueprint path `render.yaml`

It should create:

- `sendflow-api`
- `sendflow-web`
- `sendflow-db`

### 2. Required Environment Variables

Render will prompt for the `sync: false` variables. Set:

For `sendflow-api`:

- `FRONTEND_URL=https://your-frontend-domain.onrender.com`
- `BASE_URL=https://your-api-domain.onrender.com`
- `CORS_ORIGINS=https://your-frontend-domain.onrender.com`
- `GOOGLE_CLIENT_ID=...`
- `GOOGLE_CLIENT_SECRET=...`
- `GOOGLE_REDIRECT_URI=https://your-api-domain.onrender.com/auth/callback`

Render generates:

- `SECRET_KEY`
- `SCHEDULER_SECRET`

For `sendflow-web`:

- `VITE_API_URL=https://your-api-domain.onrender.com`

### 3. Database

`sendflow-db` is declared as a free Postgres database in [render.yaml](/Users/j3et/Downloads/CODE/Email%20Automation/render.yaml:1).

## GitHub Actions Setup

After Render finishes the first deploy, go to your GitHub repo:

1. Open `Settings`
2. Open `Secrets and variables`
3. Open `Actions`
4. Add these repository secrets:

- `SEND_FLOW_API_URL=https://your-api-domain.onrender.com`
- `SCHEDULER_SECRET=<copy from sendflow-api env vars in Render>`

The workflow file is:

- [.github/workflows/sendflow-scheduler.yml](/Users/j3et/Downloads/CODE/Email%20Automation/.github/workflows/sendflow-scheduler.yml:1)

It runs every 5 minutes and can also be triggered manually from GitHub Actions.

## Google Cloud OAuth

In Google Cloud Console:

1. Go to `APIs & Services`
2. Open `Credentials`
3. Open your OAuth client
4. Add this redirect URI:

```text
https://your-api-domain.onrender.com/auth/callback
```

If you want public users, publish the OAuth consent screen. If the app stays in testing mode, only configured test users can log in.

## Free Plan Limitations

- Render free web services spin down after inactivity
- GitHub Actions scheduled jobs run at a minimum interval of 5 minutes
- Scheduled sends are near-real-time, not second-by-second
- GitHub Actions scheduled workflows on public repos can be auto-disabled after 60 days of no repo activity

## Final Test Checklist

1. Open the frontend URL
2. Log in with Google
3. Create a campaign
4. Import leads
5. Click `Send Now`
6. Confirm scheduled campaigns continue when the GitHub Action runs
7. Trigger the workflow manually from GitHub Actions once to verify it can reach the API
