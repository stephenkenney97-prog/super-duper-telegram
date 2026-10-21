# super-duper-telegram

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
