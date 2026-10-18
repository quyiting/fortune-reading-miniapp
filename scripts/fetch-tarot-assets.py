"""Fetch only Commons files explicitly marked public domain; keep provenance.
Run after npm install, then: python3 scripts/fetch-tarot-assets.py
"""
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlencode, quote
from concurrent.futures import ThreadPoolExecutor
import hashlib, html, json, re, subprocess, tempfile
ROOT = Path(__file__).resolve().parents[1]
USER_AGENT = 'DaKeBuBiSuan/0.2 (https://github.com/quyiting/da-ke-bu-bi-suan; asset provenance)'
def get(url):
    with urlopen(Request(url, headers={'User-Agent': USER_AGENT}), timeout=35) as response:
        return response.read()
def plain(text):
    return html.unescape(re.sub('<[^>]+>', '', text))
deck = json.loads(subprocess.check_output(['node','-e','console.log(JSON.stringify(require("./utils/tarot-data").deck))'], cwd=ROOT))
info = {}
for offset in range(0, len(deck), 40):
    titles = '|'.join('File:' + card['file'] for card in deck[offset:offset+40])
    url = 'https://commons.wikimedia.org/w/api.php?' + urlencode({'action':'query','format':'json','titles':titles,'prop':'imageinfo','iiprop':'url|extmetadata','iiurlwidth':250})
    payload = json.loads(get(url))
    for page in payload['query']['pages'].values():
        if 'missing' in page: raise RuntimeError('Missing Commons file: ' + page['title'])
        image = page['imageinfo'][0]
        metadata = image['extmetadata']
        license_name = metadata.get('LicenseShortName', {}).get('value','')
        if license_name != 'Public domain': raise RuntimeError('Unverified license: ' + page['title'] + ' ' + license_name)
        info[page['title'].replace('_',' ')] = image
output = ROOT/'packages/tarot/cards'
output.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix='dakb-tarot-') as directory:
    temporary = Path(directory)
    def download(card):
        image = info['File:' + card['file'].replace('_',' ')]
        raw = get(image.get('thumburl') or image['url'])
        source = temporary/(card['id'] + '.jpg')
        source.write_bytes(raw)
        subprocess.run(['node', str(ROOT/'scripts/resize-tarot.cjs'), str(source), str(output/(card['id']+'.webp'))], check=True)
        meta = image['extmetadata']
        return {'id':card['id'],'file':card['id']+'.webp','commonsTitle':'File:'+card['file'],
                'sourcePage':image['descriptionurl'],'sourceImage':image['url'],'license':'Public domain',
                'licenseUrl':meta.get('LicenseUrl',{}).get('value','https://creativecommons.org/publicdomain/mark/1.0/'),
                'artist':plain(meta.get('Artist',{}).get('value','Pamela Colman Smith / Arthur Edward Waite')),
                'sha256':hashlib.sha256((output/(card['id']+'.webp')).read_bytes()).hexdigest()}
    with ThreadPoolExecutor(max_workers=3) as executor:
        manifest = list(executor.map(download, deck))
(ROOT/'packages/tarot/ASSET_SOURCES.json').write_text(json.dumps({'retrieved':'2026-10-18','processing':'250px Commons preview, WebP quality 52, maximum width 200; no recoloring','cards':manifest},ensure_ascii=False,indent=2)+'\n')
print('Verified and bundled',len(manifest),'cards;',sum(p.stat().st_size for p in output.glob('*.webp')),'bytes')
