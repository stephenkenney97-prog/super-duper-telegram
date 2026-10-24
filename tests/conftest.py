import importlib.util
from pathlib import Path
import sys

import pytest


@pytest.fixture(params=["fallback", "flask"])
def app_module(request, monkeypatch, tmp_path):
    """Load each backend independently and keep generated files in a temp dir."""
    backend = request.param
    if backend == "flask":
        pytest.importorskip("flask")

    source = Path(__file__).resolve().parents[1] / "app.py"
    module_name = f"test_app_backend_{backend}"
    spec = importlib.util.spec_from_file_location(module_name, source)
    module = importlib.util.module_from_spec(spec)
    monkeypatch.setitem(sys.modules, module_name, module)

    with monkeypatch.context() as imports:
        if backend == "fallback":
            # Exercise the real missing-dependency branch even with Flask installed.
            imports.setitem(sys.modules, "flask", None)
        spec.loader.exec_module(module)

    assert module._USING_FLASK == (backend == "flask")
    monkeypatch.setattr(module, "__file__", str(tmp_path / "app.py"))
    return module
