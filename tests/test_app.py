import os
from pathlib import Path

import pytest


def test_healthz(app_module):
    flask_app = app_module.create_app()
    client = flask_app.test_client()
    resp = client.get('/healthz')
    assert resp.status_code == 200
    assert resp.get_json() == {"ok": True}


def test_static_index_served(app_module):
    flask_app = app_module.create_app()
    static_folder = Path(flask_app.static_folder)
    static_folder.mkdir()
    (static_folder / 'index.html').write_text('index content', encoding='utf-8')
    client = flask_app.test_client()
    resp = client.get('/')
    assert resp.status_code == 200
    assert resp.get_data(as_text=True) == 'index content'


def test_db_dir_exists(app_module, tmp_path):
    flask_app = app_module.create_app()
    assert os.path.isdir(flask_app.config['DB_DIR'])
    assert Path(flask_app.config['DB_DIR']) == tmp_path / 'database'


@pytest.mark.parametrize('method,path', [('get', '/healthz'), ('post', '/api/alerts/generate')])
def test_data_manager_stops_after_request(app_module, monkeypatch, method, path):
    tracked = []
    OriginalDataManager = app_module.DataManager

    class TrackingDataManager(OriginalDataManager):
        def __init__(self):
            super().__init__()
            tracked.append(self)

    monkeypatch.setattr(app_module, "DataManager", TrackingDataManager)

    flask_app = app_module.create_app()
    assert tracked, "DataManager instance should be created"
    data_manager = tracked[0]
    assert data_manager.started is True

    client = flask_app.test_client()
    resp = getattr(client, method)(path)
    assert resp.status_code == (503 if method == 'post' else 200)
    assert data_manager.started is False


def test_unconfigured_alert_service_does_not_report_success(app_module):
    client = app_module.create_app().test_client()
    resp = client.post('/api/alerts/generate')
    assert resp.status_code == 503
    assert resp.get_json() == {
        'status': 'not_configured',
        'error': 'Alert generation and delivery are not configured.',
        'alerts_generated': 0,
        'alerts_sent': 0,
    }


def test_static_asset_served(app_module):
    flask_app = app_module.create_app()
    assets = Path(flask_app.static_folder) / 'assets'
    assets.mkdir(parents=True)
    (assets / 'site.css').write_text('body { color: green; }', encoding='utf-8')
    resp = flask_app.test_client().get('/assets/site.css')
    assert resp.status_code == 200
    assert resp.get_data(as_text=True) == 'body { color: green; }'


def test_client_route_serves_index(app_module):
    flask_app = app_module.create_app()
    static_folder = Path(flask_app.static_folder)
    static_folder.mkdir()
    (static_folder / 'index.html').write_text('app shell', encoding='utf-8')
    resp = flask_app.test_client().get('/plants/example')
    assert resp.status_code == 200
    assert resp.get_data(as_text=True) == 'app shell'


def test_missing_static_folder_returns_404(app_module):
    resp = app_module.create_app().test_client().get('/')
    assert resp.status_code == 404


def test_missing_index_returns_404(app_module):
    flask_app = app_module.create_app()
    Path(flask_app.static_folder).mkdir()
    resp = flask_app.test_client().get('/')
    assert resp.status_code == 404
