# React Frontend

## Run

1. Start Django backend on `127.0.0.1:8000`.
2. Install frontend deps:
   - `npm install`
3. Start React dev server:
   - `npm run dev`
4. Open:
   - `http://127.0.0.1:5173`

`vite.config.js` proxies `/api/*` calls to Django, so auth/session + CSRF work with the same frontend origin during development.

## Optional Frontend Env

- Create `.env` from `.env.example` if you want to call backend directly instead of Vite proxy:
  - `VITE_API_BASE_URL=http://127.0.0.1:8000`

## Notes

- Dark/light theme toggle is in the top-right navbar and persists in `localStorage`.
- React pages now cover the previous Django templates:
  - `/` home list
  - `/videos/:videoId` detail
  - `/channel/:username` channel page
  - `/upload` upload
  - `/login` login
  - `/register` register
  - `/signed-out` logout confirmation
- Additional user-library pages:
  - `/history` watch history
  - `/watch-later` watch later
  - `/liked` liked videos
