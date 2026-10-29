"""Bundle the catalog, standalone demos, and source downloads for static hosting."""
import argparse
from pathlib import Path
import shutil
from zipfile import ZipFile, ZIP_DEFLATED

ROOT = Path(__file__).resolve().parent


def build(output, iron_beam):
    output, iron_beam = Path(output).resolve(), Path(iron_beam).resolve()
    if not iron_beam.is_file():
        raise FileNotFoundError(f'Iron Beam entry point not found: {iron_beam}')
    # Restrict destination overlap so a build cannot overwrite source files.
    if output == ROOT or ROOT.is_relative_to(output) or output.is_relative_to(ROOT / 'frontend') or output.is_relative_to(ROOT / 'portfolio'):
        raise ValueError('Choose a separate build directory, such as dist/portfolio')
    (output / 'demos').mkdir(parents=True, exist_ok=True)
    (output / 'source').mkdir(exist_ok=True)
    shutil.copy2(ROOT / 'portfolio/index.html', output / 'index.html')
    shutil.copy2(ROOT / 'portfolio/README.md', output / 'README.md')
    shutil.copy2(ROOT / 'market-seismograph.html', output / 'demos/market-seismograph.html')
    shutil.copy2(iron_beam, output / 'demos/iron-beam.html')
    for name in ('earthquake_map.py', 'requirements-maps.txt', 'gaza_satboard_make_images.py'):
        shutil.copy2(ROOT / name, output / 'source' / name)
    shutil.copy2(ROOT / 'frontend/components/dashboard/KiloSimulation.jsx', output / 'source/KiloSimulation.jsx')
    with ZipFile(output / 'source/plant-tracker.zip', 'w', ZIP_DEFLATED) as archive:
        for path in sorted((ROOT / 'frontend').rglob('*')):
            if path.is_file():
                archive.write(path, path.relative_to(ROOT))
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist/portfolio')
    parser.add_argument('--iron-beam', type=Path, default=ROOT.parent / 'gggggg/index.html')
    args = parser.parse_args()
    print(build(args.output, args.iron_beam))
