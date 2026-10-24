# Agent guidance

- This repository contains independent projects: `app.py` (alert-service shell), `frontend/` (React plant tracker), `market-seismograph.html` (standalone demo), and two geospatial Python scripts.
- Identify the affected project first; keep changes scoped to it and read [DESIGN.md](DESIGN.md) for UI work.
- Python setup: `python3 -m venv .venv` then `.venv/bin/python -m pip install -r requirements-dev.txt`; run tests with `.venv/bin/python -m pytest tests/` from this root.
- `app.py` uses Flask when installed and a small fallback when absent; preserve `create_app()`, response contracts, static routing, and request teardown behavior.
- The alert-generation endpoint is a placeholder returning zero counts; inspect its implementation before assuming any external alert integration exists.
- Standalone demo preview: `python3 -m http.server 8000 --bind 127.0.0.1`, then open `/market-seismograph.html`; no build step or API key is needed.
- Preserve the demo's Coinbase → CoinGecko → simulated-feed fallback, visible source mode, and artistic-visualization disclaimer.
- Its Three.js core and OrbitControls use `0.128.0`; verify version-specific APIs and keep CDN versions compatible.
- `frontend/` has no package manifest or checked-in build/test configuration; report that gap instead of assuming npm scripts or a working bundle.
- Reuse React hooks and common components; preserve runtime Firebase configuration and user-scoped Firestore paths under `/artifacts/${appId}/users/${userId}/`.
- Inspect each geospatial script's imports and parameters before running it; the satellite script performs network work and creates output files at module scope.
- Verify affected behavior with focused tests or browser checks; report actual results and missing runtime requirements. Review `git diff --check` before finishing.
- Workflows run Python 3.12 tests on pull requests and pushes to `main`; Pages deployment also runs on pushes to `main`.
