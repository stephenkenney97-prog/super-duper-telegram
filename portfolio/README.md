# Stephen’s Project Lab

Build from the super-duper-telegram repository:

```bash
python build_portfolio.py --iron-beam ../gggggg/index.html
python -m http.server 8000 --bind 127.0.0.1 --directory dist/portfolio
```

Open http://127.0.0.1:8000/. The bundle includes both standalone HTML demos,
source downloads, setup notes, and a filterable catalog. It can be hosted as a
static directory. Local building does not publish it.
Pass `--output /path/to/bundle` to choose another destination. The Iron Beam
source must be available locally; use `--iron-beam` when its checkout is elsewhere.

The React projects are source downloads, not runnable builds. CDN libraries need
internet access. The market demo labels live and simulated feeds. Python maps
run separately and require their documented dependencies.

For the earthquake map, install `source/requirements-maps.txt` and run
`python source/earthquake_map.py --output japan-earthquakes.png`. It queries USGS
for the last 24 hours in the rectangular Japan-region extent and displays the
UTC interval. USGS coverage is not a comprehensive JMA earthquake catalog.
Cartopy may download Natural Earth basemap files on first use.

The alert service is not a working delivery integration. `POST /api/alerts/generate`
returns HTTP 503 with `status: not_configured` until a real source and delivery
workflow are implemented. No messages are sent by this portfolio.

## Publishing and checks

The live catalog is https://stephenkenney97-prog.github.io/super-duper-telegram/.
GitHub Pages uses **GitHub Actions** as its build source; keep branch publishing
disabled to avoid competing deployments. The `Deploy project portfolio` workflow
checks out the Iron Beam repository, builds this bundle, checks its local links
and ZIP download, and uploads `dist/portfolio` directly without Jekyll processing.
Pull requests run the same build checks but do not deploy. Pushes to `main` and
manual runs on `main` deploy after a successful build.

To validate locally after building:

```bash
python verify_portfolio.py dist/portfolio
```

If publishing fails, inspect that workflow's build and deploy jobs. After fixing
the failure, rerun the workflow on `main`; do not enable branch publishing.
Source-only React projects and the unconfigured alert service remain explicitly
labeled until their real runtime integrations have been verified.
