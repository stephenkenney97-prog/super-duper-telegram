"""Check a built portfolio's local links and downloadable source archive."""
import argparse
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
from zipfile import ZipFile


class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.targets = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('href', 'src') and value:
                self.targets.append(value)


def verify(directory):
    root = Path(directory).resolve()
    if not (root / 'index.html').is_file():
        raise ValueError('Portfolio index.html is missing')
    count = 0
    for page in root.rglob('*.html'):
        links = Links()
        links.feed(page.read_text())
        for target in links.targets:
            url = urlsplit(target)
            if url.scheme or url.netloc or not url.path:
                continue
            if url.path.startswith('/'):
                raise ValueError(f'{page.name}: root-relative link breaks project Pages: {target}')
            resolved = (page.parent / unquote(url.path)).resolve()
            if not resolved.is_relative_to(root) or not resolved.is_file():
                raise ValueError(f'{page.name}: missing or out-of-bundle link: {target}')
            count += 1
    with ZipFile(root / 'source/plant-tracker.zip') as archive:
        if not archive.namelist() or archive.testzip() is not None:
            raise ValueError('Plant tracker download is empty or corrupt')
    print(f'Portfolio verified: {count} local links and source ZIP')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    verify(parser.parse_args().directory)
