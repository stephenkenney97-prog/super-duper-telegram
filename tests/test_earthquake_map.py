from datetime import datetime, timedelta, timezone
import importlib.util
from io import BytesIO
import json
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.error import URLError

import pytest

spec = importlib.util.spec_from_file_location('earthquake_map', Path(__file__).resolve().parents[1] / 'earthquake_map.py')
quakes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(quakes)


def test_usgs_window_coordinates_and_missing_magnitude():
    now = datetime(2026, 10, 26, 12, tzinfo=timezone.utc)
    captured = {}

    def opener(url, timeout):
        captured.update(url=url, timeout=timeout)
        return BytesIO(json.dumps({'type': 'FeatureCollection', 'features': [
            {'properties': {'mag': 4.2, 'place': 'Japan', 'time': 123},
             'geometry': {'coordinates': [140, 36, 20]}},
            {'properties': {'mag': None}, 'geometry': {'coordinates': [140, 36, 20]}}
        ]}).encode())

    records, start, end = quakes.fetch_quakes(now, opener)
    query = parse_qs(urlparse(captured['url']).query)
    assert end == now and start == now - timedelta(hours=24)
    assert query['starttime'] == [start.isoformat()]
    assert query['endtime'] == [end.isoformat()]
    assert query['minlatitude'] == ['24']
    assert query['maxlongitude'] == ['146']
    assert captured['timeout'] == 30
    assert records == [dict(region='Japan', magnitude=4.2, lon=140, lat=36, depth=20, time=123)]


def test_empty_window_is_not_replaced_by_samples():
    result, _, _ = quakes.fetch_quakes(opener=lambda *a, **kw: BytesIO(b'{"type":"FeatureCollection","features":[]}'))
    assert result == []


def test_network_failure_propagates():
    def unavailable(*args, **kwargs):
        raise URLError('offline')
    with pytest.raises(URLError):
        quakes.fetch_quakes(opener=unavailable)


def test_invalid_feed_rejected():
    with pytest.raises(ValueError, match='invalid GeoJSON'):
        quakes.fetch_quakes(opener=lambda *a, **kw: BytesIO(b'{}'))


def test_naive_datetime_rejected():
    with pytest.raises(ValueError, match='timezone-aware'):
        quakes.fetch_quakes(datetime(2026, 10, 26))
