"""Plot USGS earthquakes in the Japan region during the preceding 24 hours."""
import argparse
from datetime import datetime, timedelta, timezone
import json
import textwrap
from urllib.parse import urlencode
from urllib.request import urlopen

USGS_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query'


def fetch_quakes(now=None, opener=urlopen):
    """Return feed records and the exact UTC window; never substitute sample data."""
    end = now or datetime.now(timezone.utc)
    if end.tzinfo is None:
        raise ValueError('now must be timezone-aware')
    end = end.astimezone(timezone.utc)
    start = end - timedelta(hours=24)
    params = dict(format='geojson', starttime=start.isoformat(),
                  endtime=end.isoformat(), minlatitude=24, maxlatitude=46,
                  minlongitude=127, maxlongitude=146, orderby='time-asc', limit=20000)
    with opener(USGS_URL + '?' + urlencode(params), timeout=30) as response:
        payload = json.load(response)
    if payload.get('type') != 'FeatureCollection' or not isinstance(payload.get('features'), list):
        raise ValueError('USGS returned an invalid GeoJSON feature collection')
    if len(payload['features']) >= 20000:
        raise ValueError('USGS result limit reached; refusing to display a partial feed')
    quakes = []
    for feature in payload['features']:
        properties = feature['properties']
        coordinates = feature['geometry']['coordinates']
        if properties.get('mag') is None:
            continue
        quakes.append(dict(region=properties.get('place') or 'Unnamed location',
                           magnitude=properties['mag'], lon=coordinates[0],
                           lat=coordinates[1], depth=coordinates[2],
                           time=properties['time']))
    return quakes, start, end


def plot_quakes(output=None):
    quakes, start, end = fetch_quakes()
    import matplotlib.pyplot as plt
    import cartopy.crs as ccrs
    import cartopy.feature as cfeature

    fig = plt.figure(figsize=(10, 12))
    ax = plt.axes(projection=ccrs.PlateCarree())
    ax.set_extent([127, 146, 24, 46], crs=ccrs.PlateCarree())
    ax.add_feature(cfeature.LAND, facecolor='lightgray')
    ax.add_feature(cfeature.COASTLINE)
    ax.add_feature(cfeature.BORDERS, linestyle=':')
    ax.add_feature(cfeature.OCEAN, facecolor='lightblue')
    ax.gridlines(draw_labels=True)
    legend_lines = []
    coordinate_counts = {}
    for number, quake in enumerate(quakes, start=1):
        ax.scatter(quake['lon'], quake['lat'], s=max(1, quake['magnitude']) * 60,
                   color='red', alpha=0.6, edgecolor='black', transform=ccrs.PlateCarree())
        coordinate = (round(quake['lon'], 2), round(quake['lat'], 2))
        offset = coordinate_counts.get(coordinate, 0) * 12
        coordinate_counts[coordinate] = coordinate_counts.get(coordinate, 0) + 1
        ax.annotate(str(number), (quake['lon'], quake['lat']), xytext=(0, offset),
                    textcoords='offset points', color='white', weight='bold',
                    ha='center', va='center', fontsize=7,
                    transform=ccrs.PlateCarree())
        label = f"{number}. M{quake['magnitude']} · {quake['region']} · depth {quake['depth']:.1f} km"
        legend_lines.append(textwrap.fill(label, width=54, subsequent_indent='   '))
    if not quakes:
        ax.text(0.5, 0.5, 'No USGS events with reported magnitudes in this window',
                ha='center', transform=ax.transAxes)
    ax.set_title('Japan-region earthquakes · USGS\n'
                 f'{start:%Y-%m-%d %H:%M} – {end:%Y-%m-%d %H:%M} UTC\n'
                 'Bubble area scales with magnitude; neighboring waters included')
    if legend_lines:
        fig.text(0.5, 0.015, '\n'.join(legend_lines), ha='center', va='bottom', fontsize=8)
        fig.subplots_adjust(bottom=min(0.3, 0.08 + len(legend_lines) * 0.025))
    if output:
        fig.savefig(output, bbox_inches='tight', dpi=150)
        plt.close(fig)
    else:
        plt.show()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', help='Save a map image instead of opening a window')
    args = parser.parse_args()
    try:
        plot_quakes(args.output)
    except Exception as exc:
        parser.exit(1, f'Earthquake map unavailable: {exc}\n')


if __name__ == '__main__':
    main()
