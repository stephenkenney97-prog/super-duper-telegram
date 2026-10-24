# super-duper-telegram

See [AGENTS.md](AGENTS.md) for project boundaries, development commands, and
verification guidance, and [DESIGN.md](DESIGN.md) for UI conventions.

## Python tests

Use Python 3.12 and create a local test environment:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/python -m pytest tests/
```

GitHub Actions runs these tests on pull requests and pushes to `main`.
The suite checks health and alert responses, static files, client-side route
fallback, missing files, and request cleanup against both Flask and the
lightweight fallback. Tests simulate a missing Flask dependency for fallback
coverage and store generated files in temporary directories.

## market-seismograph.html

Live crypto price volatility rendered as P-wave / S-wave / Rayleigh-wave seismic
motion propagating across a deforming 3D terrain (Three.js), with a Richter-styled
synthetic magnitude index and a scrolling seismograph readout. Data comes from the
Coinbase Exchange public API with automatic fallback to CoinGecko's keyless API,
and to a simulated feed if both are unreachable — the panel always says which mode
it's in. No build step, no API key: serve the file with any static server (e.g.
`python3 -m http.server`) and open it in a browser. Purely an artistic data
visualization — not a real seismometer and not financial advice (see the in-app
disclaimer).
