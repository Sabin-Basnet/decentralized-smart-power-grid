# Dharan Smart Grid — Web App

Vite + React frontend for the Decentralized Smart Power Grid project. Pairs with
the FastAPI backend (`main.py` / `ml_engine.py`) expected at `http://127.0.0.1:8000`.

## Setup

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # production build to dist/
npm run preview   # preview the production build
```

The app works with or without the backend running. If `http://127.0.0.1:8000` is
unreachable, an offline banner appears and the UI falls back to generated Dharan
demo data (meters DHARAN-001 through DHARAN-006) so nothing ever crashes.

## Demo accounts

| Role     | Email                | Password     |
|----------|-----------------------|--------------|
| Client   | client@grid.local     | client123    |
| Provider | provider@grid.local   | provider123  |

## Project structure

```
src/
  config/constants.js     API URL, roles, demo accounts, color tokens, meter IDs
  services/api.js         Dashboard/telemetry fetch with offline fallback
  services/auth.js        Frontend demo-account login + session persistence
  data/demoData.js        Deterministic Dharan demo dataset generator
  context/                Auth + toast providers
  hooks/useDashboardData.js
  components/auth/        LoginPage, ProtectedRoute
  components/layout/      ClientLayout, ProviderLayout (separate nav per role)
  components/shared/      Gauge, StatCard, banners, skeletons, status screens
  pages/client/           Overview, Consumption, Token Balance, Transactions, Profile
  pages/provider/         Overview, Active Users, User Detail, Anomalies, Reports, Profile
  utils/format.js         Formatting helpers
  index.css               Full design system (dark charcoal/green, gold/teal/red)
```

## Notes

- Only two backend endpoints exist today (`GET /api/v1/dashboard`,
  `POST /api/v1/telemetry`). Balance and hours-remaining come from the live API
  when reachable; consumption history, transactions, and reports are generated
  demo data since the backend has no endpoints for them yet — this is clearly
  labeled in the UI via the offline/demo banner and network status indicator.
- Theft detection mirrors the backend rule exactly:
  `abs(line_current - neutral_current) > 0.15` → `Theft Detected`.
- This project was scaffolded and written in an offline sandbox (no npm
  registry access), so `npm install`/`npm run build` have not been executed
  against real dependencies. All files were syntax-checked with the
  TypeScript compiler in parse-only mode, but please run the real build
  locally and report back anything it surfaces.
