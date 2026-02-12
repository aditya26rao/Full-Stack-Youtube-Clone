# Deploy Guide: Frontend on Netlify + Backend on Render

This project is split into:
- Frontend (React/Vite): `frontend`
- Backend (Django API): `backend`

## 1) Backend (Render)

### 1.1 Prerequisites
Add these packages to `requirements.txt` (if not already):
- `gunicorn`
- `dj-database-url`
- `psycopg[binary]` (or `psycopg2-binary`)

Then install locally once to verify:

```bash
pip install gunicorn dj-database-url "psycopg[binary]"
```

### 1.2 Update Django settings for production (required)
Your current `settings.py` has hardcoded `DEBUG=True`, `ALLOWED_HOSTS=[]`, and sqlite only.
Use env-driven settings in production:

```python
# settings.py
import os
from pathlib import Path
import dj_database_url

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-secret")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,
        ssl_require=False,
    )
}
```

### 1.3 Create Render services
In Render:
1. Create PostgreSQL database (recommended).
2. Create Web Service for Django API.

Use:
- Root Directory: `backend`
- Build Command:
  ```bash
  pip install -r requirements.txt && python manage.py migrate
  ```
- Start Command:
  ```bash
  gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT
  ```

### 1.4 Render environment variables
Set these in Render:
- `SECRET_KEY` = strong random secret
- `DEBUG` = `False`
- `ALLOWED_HOSTS` = `your-render-service.onrender.com`
- `DATABASE_URL` = auto from Render PostgreSQL
- `IMAGEKIT_PUBLIC_KEY`
- `IMAGEKIT_PRIVATE_KEY`
- `IMAGEKIT_URL_ENDPOINT`
- `CORS_ALLOWED_ORIGINS` = `https://your-netlify-site.netlify.app`
- `CSRF_TRUSTED_ORIGINS` = `https://your-netlify-site.netlify.app`

## 2) Frontend (Netlify)

### 2.1 Set frontend API URL
In Netlify environment variables:
- `VITE_API_BASE_URL` = `https://your-render-service.onrender.com`

### 2.2 Netlify build settings
Use:
- Base directory: `frontend`
- Build command:
  ```bash
  npm run build
  ```
- Publish directory:
  ```bash
  dist
  ```

### 2.3 SPA fallback (important)
Create file `frontend/public/_redirects`:

```txt
/* /index.html 200
```

This prevents 404 on direct route open (e.g. `/videos/9`).

## 3) Post-deploy checks

### Backend checks
- `GET https://your-render-service.onrender.com/api/videos/`
- `GET https://your-render-service.onrender.com/api/auth/csrf/`

### Frontend checks
- Open Netlify URL
- Register/login
- Upload video + thumbnail
- Open detail page, vote, watch later
- Settings page update (name/description/photo)

## 4) Common issues

### `ECONNREFUSED 127.0.0.1:8000`
Frontend is still calling local backend.
Fix `VITE_API_BASE_URL` in Netlify env and redeploy.

### `403 CSRF failed`
Check:
- `CSRF_TRUSTED_ORIGINS` includes Netlify URL
- frontend sends credentials and `X-CSRFToken`

### `DisallowedHost`
Add Render hostname to `ALLOWED_HOSTS`.

### `500 no such table ...`
Run migrations in build command:
`python manage.py migrate`
