# CLAUDE.md

Guidance for Claude Code (and other AI assistants) working in this repository.

## Repository reality check

Despite the name, this is **not** a single cohesive "Telegram" application. It is a
loose collection of independent, mostly-unrelated scripts and one small React
frontend that were added to the same repo over time. There is no shared build
system, no root `package.json`, and no dependency manifest (`requirements.txt`)
tying the pieces together. Treat each top-level item as its own mini-project
unless you're specifically told otherwise, and don't assume changes in one
affect the others.

## Layout

```
app.py                        Flask "alert service" skeleton (see below)
earthquake_map.py              Standalone matplotlib/cartopy script
gaza_satboard_make_images.py   Standalone Sentinel-2 satellite-imagery script
tests/test_app.py              pytest tests for app.py only
frontend/                      React app — actually a plant-care tracker
  App.jsx
  components/
    common/                   Generic UI: Modal, LoadingState, ErrorState, FileUploader
    dashboard/                PlantDashboard, PlantCard, KiloSimulation (orphaned, see below)
    plant/                    AddPlantModal, HealthLogModal, HealthLogEntry, PlantDetailView
  hooks/                      useFirebaseAuth, useFirestoreCollection
  utils/                      firebase.js, ai.js, media.js
```

### `app.py` — Flask alert-service skeleton
- `create_app()` is the application factory. Routes: `POST /api/alerts/generate`
  (placeholder — returns a canned success response, no real logic yet),
  `GET /healthz`, and a catch-all `/` / `/<path:path>` that serves static files
  (SPA-style, falling back to `index.html`).
- If Flask isn't installed, the module falls back to a hand-rolled `MiniFlask` /
  `SimpleResponse` / `MiniTestClient` shim (same file) that implements just
  enough of the Flask API to run and test the app without the dependency. When
  editing routes or responses, keep both code paths in sync — the real Flask
  app and the `MiniFlask` fallback must behave identically, since tests may run
  against either depending on what's installed.
- `DataManager` is a stub with `start()`/`stop()`, wired into
  `teardown_appcontext` for cleanup. It doesn't do anything real yet.

### `earthquake_map.py` and `gaza_satboard_make_images.py`
Independent, run-as-scripts data/geospatial visualizations. Not imported by
`app.py`, not covered by tests, and not on a shared dependency list — each
declares (or documents, in the case of `gaza_satboard_make_images.py`'s
docstring) its own package needs (`matplotlib`, `cartopy`, `rasterio`,
`rioxarray`, `pystac-client`, `python-pptx`, etc.). `gaza_satboard_make_images.py`
streams public Sentinel-2 imagery from an AWS STAC endpoint over the network —
running it requires internet access and will make outbound HTTP requests.

### `frontend/` — plant-care tracker (React, no build config committed)
A small React app for tracking houseplants: sign in (Firebase Auth, anonymous
or custom-token), list/add plants, log health entries with photos, and get an
AI diagnosis of plant health from an uploaded photo via the Gemini API.
- **No `package.json`, bundler config, or `node_modules` are checked in.** The
  code uses `import` from bare package names (`react`, `firebase/app`,
  `firebase/auth`, `firebase/firestore`, `lucide-react`) and Tailwind utility
  classes, implying it's meant to run inside a host environment that provides
  these (e.g. an import-map-based sandbox or a separate build step not present
  in this repo) rather than via `npm install && npm run build` from here.
- Firebase/Gemini configuration is read from `window` globals at runtime —
  `window.__firebase_config`, `window.__app_id`, `window.__initial_auth_token`,
  `window.__gemini_api_key` (see `frontend/utils/firebase.js` and
  `frontend/utils/ai.js`) — not from `.env` files or build-time env vars.
  Never hardcode real API keys or Firebase config into these files.
- Data model: Firestore documents live under
  `/artifacts/{appId}/users/{uid}/plants`, subscribed live via
  `onSnapshot` in `useFirestoreCollection`.

## Known issues / gotchas
- `frontend/components/dashboard/KiloSimulation.jsx` (~900 lines, a
  targeting/animation simulation unrelated to plants) is **not imported
  anywhere** in the app — it's dead code. Don't assume it's wired up; confirm
  before modifying or removing it.
- `frontend/utils/ai.js` has a typo in the Gemini endpoint host:
  `generativanguage.googleapis.com` should be `generativelanguage.googleapis.com`.
  This means AI plant-health analysis is currently broken. Fix the URL if
  asked to repair that feature.
- `gggggg` referenced in this session is a **separate, unrelated repository**
  (an interactive Three.js demo) — don't conflate the two.

## Development workflow

### Python (`app.py`, tests)
There's no `requirements.txt`. At minimum, install `pytest` to run tests; the
app itself works with or without `flask` installed (see the `MiniFlask`
fallback above), so install `flask` too if you want to exercise the real
implementation.

```bash
pip install pytest flask
pytest tests/
```

Run the app locally:
```bash
python app.py            # honors $HOST (default 0.0.0.0) and $PORT (default 5000)
```

### Frontend
No install/build/test tooling is present in the repo. If asked to add one,
default to a standard Vite + React + Tailwind setup consistent with the
existing JSX/hooks style, and ask before assuming a specific host platform's
global-variable conventions can be dropped.

## Conventions observed in the code
- **Python**: type hints on new public functions/classes where practical
  (see `app.py`), short docstrings only where behavior isn't obvious from the
  name, `os.path` for path handling.
- **React/JSX**: functional components with named exports (`export const Foo
  = (...) => ...`), hooks-based state/effects, Tailwind utility classes for
  styling (no CSS modules/styled-components), `lucide-react` for icons,
  2-space indentation, semicolons, single quotes.
- No linter or formatter config is committed — match the surrounding file's
  style rather than introducing a new one.
- No CI configuration exists in this repo.

## Working across the two repos in scope
This session may also have access to `stephenkenney97-prog/gggggg`, a
completely separate, unrelated project (a single-file Three.js browser demo).
It has its own `CLAUDE.md`. Do not mix concerns between the two repos.
