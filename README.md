# SendFlow

SendFlow is a Gmail outreach app with:

- Google login
- multi-account sending
- campaign wizard
- lead import and mapping
- inbox and reply tracking
- analytics
- GitHub Actions scheduled campaign processing

## Local Run

```bash
./run.sh
```

App URLs:

- Frontend: `http://localhost:8081`
- Backend: `http://localhost:8000`
- API docs: `http://localhost:8000/docs`

## Environment

Start from [.env.example](/Users/j3et/Downloads/CODE/Email%20Automation/.env.example:1).

Important variables:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `SECRET_KEY`
- `SCHEDULER_SECRET`
- `DATABASE_URL`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `BASE_URL`

## Production Deployment

Recommended:

- Backend + frontend + Postgres on Render
- GitHub Actions cron for scheduled sending

Deployment guide:

- [DEPLOYMENT.md](/Users/j3et/Downloads/CODE/Email%20Automation/DEPLOYMENT.md:1)

## Production Files Added

- [render.yaml](/Users/j3et/Downloads/CODE/Email%20Automation/render.yaml:1)
- [vercel.json](/Users/j3et/Downloads/CODE/Email%20Automation/vercel.json:1)

## Notes

- Dev can use SQLite
- Production should use Postgres
- Production uses GitHub Actions instead of a dedicated background worker
