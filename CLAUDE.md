# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## What this repo is

This is a loose collection of independent prototypes, not a single
cohesive application. The pieces don't share code or a build pipeline,
and there is no top-level dependency manifest (no `requirements.txt`,
`pyproject.toml`, or `package.json` anywhere in the repo) — each piece
lists its own dependencies inline (see below). Treat each area as its own
project when making changes; don't assume changes in one affect another.

| Area | What it is |
|---|---|
| `app.py` + `tests/` | A minimal Flask backend scaffold for a "Telegram alert service" |
| `frontend/` | A React (JSX) UI for a plant-health-tracking app, using Firebase and Gemini |
| `earthquake_map.py` | Standalone script: plots recent Japan earthquakes on a map |
| `gaza_satboard_make_images.py` | Standalone script: pre/post NDVI satellite imagery analysis |

## Repository structure

```
app.py                              # Flask app factory (create_app) + a pure-stdlib Flask shim
tests/test_app.py                   # pytest tests for app.py (work with or without Flask installed)
earthquake_map.py                   # Standalone matplotlib/cartopy script (not wired to app.py)
gaza_satboard_make_images.py        # Standalone rasterio/pystac-client script (not wired to app.py)
frontend/
  App.jsx                           # Root component: auth gate -> dashboard or plant detail view
  hooks/
    useFirebaseAuth.js              # Firebase init + anonymous/custom-token auth, exposes AUTH_STATUS
    useFirestoreCollection.js       # Generic onSnapshot-backed Firestore collection subscriber
  utils/
    firebase.js                     # Reads __firebase_config / __initial_auth_token / __app_id off window
    ai.js                           # Calls the Gemini API for AI plant health diagnosis
    media.js                        # Image/file helpers
  components/
    common/                         # FileUploader, Modal, LoadingState, ErrorState
    dashboard/
      PlantDashboard.jsx            # Grid of PlantCard, "Add plant" entry point
      PlantCard.jsx
      KiloSimulation.jsx            # 907-line canvas simulation component — NOT imported/used anywhere
    plant/                          # AddPlantModal, PlantDetailView, HealthLogModal, HealthLogEntry
.github/workflows/blank.yml         # Generic placeholder CI (echoes strings, no real build/test step)
.github/workflows/jekyll-gh-pages.yml  # Jekyll-based GitHub Pages deploy on push to main
LICENSE
```

Notable gotcha: `frontend/components/dashboard/KiloSimulation.jsx` is a
large, self-contained canvas-based simulation component that is defined
but never imported by `App.jsx` or `PlantDashboard.jsx`. If you're asked
to work on "the simulation," confirm whether the goal is to wire it in,
replace it, or leave it dormant — don't assume it's reachable from the UI
today.

## `app.py`: Flask backend

- `create_app()` is the application factory. It registers:
  - `POST /api/alerts/generate` — placeholder; always returns
    `{"status": "success", "alerts_generated": 0, "alerts_sent": 0}` with
    no real alert logic implemented yet.
  - `GET /healthz` — liveness check, returns `{"ok": True}`.
  - `GET /`, `GET /<path:path>` — serves static files from `static/`
    (created relative to the app dir), falling back to `index.html` for
    client-side routing, and 404 if neither exists.
  - A `teardown_appcontext` hook that stops a `DataManager` stub
    (`start()`/`stop()` only — no real state machine yet).
- **Flask is optional.** If `flask` isn't installed, `app.py` falls back
  to `MiniFlask`, a small stdlib-only reimplementation of the subset of
  Flask's API this app needs (`route`, `test_client`,
  `teardown_appcontext`, path-based static serving, `jsonify`). This is
  why the test suite passes with zero dependencies installed. When
  editing `app.py`, keep new routes compatible with both — i.e. don't use
  a Flask feature `MiniFlask` doesn't implement without also extending
  the shim, or the tests (and any environment without Flask) will break.
- `app.run()` reads `HOST` (default `0.0.0.0`) and `PORT` (default
  `5000`) from the environment.

### Running the backend

```bash
python app.py                 # runs with real Flask if installed, otherwise raises
                               # (MiniFlask.run() intentionally refuses to serve — install Flask for that)
pip install flask              # only if you need to actually serve traffic
```

### Tests

```bash
cd /path/to/repo
python -m pytest tests/       # no dependencies required; exercises both the Flask and MiniFlask paths
```
`tests/test_app.py` explicitly monkeypatches `app_module.Flask` to
`MiniFlask` in one test to force-exercise the fallback path even when real
Flask is installed — keep that pattern in mind if you add tests for new
routes (test both backends where behavior could diverge).

## `frontend/`: plant health tracker (React)

There is **no `package.json`, bundler config, or lockfile** in this repo.
The JSX assumes a React + Tailwind + `lucide-react` + `firebase` (v9+
modular SDK) environment is provided externally — don't invent a build
config unless asked; confirm with the user what host environment (e.g. an
existing app shell, a canvas/artifact environment) these components are
meant to run in.

Key patterns:
- **Firebase config is not hardcoded.** `frontend/utils/firebase.js`
  reads `window.__firebase_config` (JSON string), `window.__app_id`, and
  `window.__initial_auth_token` at runtime — these must be injected by
  whatever host page loads the bundle. `getOrInitializeFirebase()` throws
  if `config.apiKey` is missing.
- **Auth**: `useFirebaseAuth` signs in with the injected custom token if
  present, otherwise falls back to `signInAnonymously`. `AUTH_STATUS` is
  `IDLE -> LOADING -> READY | ERROR`.
- **Data model**: plants live at Firestore path
  `/artifacts/${appId}/users/${uid}/plants`, loaded live via
  `useFirestoreCollection` (wraps `onSnapshot`).
- **AI diagnosis**: `frontend/utils/ai.js` calls the Gemini
  `generateContent` endpoint directly from the client with a structured
  JSON response schema (`plant_species`, `health_summary`,
  `potential_issues`, `care_recommendations`). The API key is read from
  one of several `window.__gemini*` globals — again, injected by the
  host, never hardcoded. If you touch this file, preserve the
  fail-fast behavior (`throw` when the key or image is missing) rather
  than silently no-oping.
- Component split follows `common/` (generic UI), `dashboard/` (list
  view), `plant/` (detail view + modals) — put new shared UI in
  `common/`, not inside a feature folder.

## Standalone scripts (`earthquake_map.py`, `gaza_satboard_make_images.py`)

These are not part of the Flask app or the frontend — they're
independent, run-manually data/visualization scripts with their own
dependency sets declared as comments/docstrings at the top of each file
rather than in a shared manifest:

- `earthquake_map.py` — hardcoded sample earthquake data for Japan,
  plotted with `matplotlib` + `cartopy`. Run with
  `pip install matplotlib cartopy && python earthquake_map.py`.
- `gaza_satboard_make_images.py` — pulls Sentinel-2 imagery via the
  public STAC API (`earth-search.aws.element84.com`) to build pre/post
  NDVI comparison images and an optional PPTX. Dependencies are listed in
  its module docstring (`pystac-client`, `rasterio`, `rioxarray`,
  `matplotlib`, `numpy`, `pillow`, `python-pptx`, `affine`, `requests`,
  `tqdm`, `pystac`, plus `matplotlib-scalebar`, `shapely`, `pyproj`
  imported at the top). It makes live network calls to fetch imagery —
  don't run it in a sandboxed/offline environment expecting it to work.

If you're asked to add a new one-off analysis script, follow this same
pattern (self-contained script, dependencies documented at the top)
rather than trying to fold it into `app.py` or add a shared
`requirements.txt` — that would be a bigger structural change than a
typical task here calls for; raise it with the user first if you think
the repo actually needs consolidating.

## CI / deployment

- `.github/workflows/blank.yml` is the GitHub Actions starter template
  (echoes placeholder strings) — it is not a real build or test gate.
  There is currently **no CI workflow that runs `pytest` or lints the
  frontend.** If you add one, prefer running `python -m pytest tests/`
  (no install step required, per above) plus whatever the frontend needs
  once it has a real toolchain.
- `.github/workflows/jekyll-gh-pages.yml` builds and deploys the repo
  root as a Jekyll site to GitHub Pages on push to `main`. This is
  unrelated to the Flask app or the React frontend — be aware that
  pushing to `main` triggers a live Pages deployment of whatever Jekyll
  can build from the repo root.

## General conventions

- Don't assume this is one product — confirm which area (backend,
  frontend, or a specific script) a task targets before making changes,
  since they don't share dependencies, tests, or deployment paths.
- Keep the `MiniFlask` shim and real-Flask code paths in sync in `app.py`.
- Never hardcode Firebase/Gemini credentials into the frontend — they are
  injected via `window` globals by design.
- There's no formatter/linter config checked in; match the existing style
  in whichever file you're editing.
