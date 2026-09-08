"""Create/update the 13 docs topics as DRAFTS in Contentful (never publishes).

Usage: python3 push.py [--dry]
Idempotent: ids.json maps slug -> entry id; known slugs update in place.
"""
import glob
import json
import os
import sys
import urllib.request
import urllib.error

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from md2rich import load_topic

SPACE = '2x238mu87414'
ENV = 'master'
BASE = f'https://api.contentful.com/spaces/{SPACE}/environments/{ENV}'
IDS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ids.json')
DRY = '--dry' in sys.argv

# Existing entries whose slug already matches the map (updated in place).
SEED_IDS = {
    'components': '3pvkWBNGuv6HhngbDNiUA0',
    'activities': '14uDT8Sk68nZEBOPOpr43Y',
    'routing': '56b7cFQQAmg0oZUagl8N1r'
}


def load_token():
    config = json.load(open(os.path.expanduser('~/.claude-personal/.claude.json')))
    return config['mcpServers']['contentful']['env']['CONTENTFUL_MANAGEMENT_ACCESS_TOKEN']


TOKEN = load_token()


def request(method, path, body=None, headers=None):
    import subprocess
    import tempfile
    header_lines = [f'header = "Authorization: Bearer {TOKEN}"',
                    'header = "Content-Type: application/vnd.contentful.management.v1+json"']
    for key, value in (headers or {}).items():
        header_lines.append(f'header = "{key}: {value}"')
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as body_file:
        if body is not None:
            json.dump(body, body_file)
        body_path = body_file.name
    args = ['curl', '-sS', '-K', '-', '-X', method, BASE + path, '-w', '\n%{http_code}']
    if body is not None:
        args += ['--data-binary', f'@{body_path}']
    result = subprocess.run(args, input='\n'.join(header_lines), capture_output=True, text=True)
    os.unlink(body_path)
    if result.returncode:
        raise SystemExit(f'curl failed: {result.stderr}')
    payload, _, status = result.stdout.rpartition('\n')
    if not status.startswith('2'):
        raise SystemExit(f'{method} {path} -> {status}\n{payload[:2000]}')
    return json.loads(payload)


def main():
    ids = {**SEED_IDS, **(json.load(open(IDS_PATH)) if os.path.exists(IDS_PATH) else {})}
    for path in sorted(glob.glob(os.path.join(os.path.dirname(IDS_PATH), 'topics', '*.md'))):
        meta, document = load_topic(path)
        slug, title = meta['slug'], meta['title']
        fields = {
            'entryTitle': {'en-US': title},
            'slug': {'en-US': slug},
            'title': {'en-US': title},
            'description': {'en-US': document}
        }
        size = len(json.dumps(document))
        if slug in ids:
            entry_id = ids[slug]
            if DRY:
                print(f'UPDATE {slug} -> {entry_id} ({size} bytes)')
                continue
            current = request('GET', f'/entries/{entry_id}')
            merged = {**current['fields'], **fields}
            updated = request('PUT', f'/entries/{entry_id}', {'fields': merged},
                              {'X-Contentful-Version': str(current['sys']['version'])})
            print(f'updated {slug} -> {entry_id} v{updated["sys"]["version"]}')
        else:
            if DRY:
                print(f'CREATE {slug} "{title}" ({size} bytes)')
                continue
            created = request('POST', '/entries', {'fields': fields},
                              {'X-Contentful-Content-Type': 'content'})
            ids[slug] = created['sys']['id']
            print(f'created {slug} -> {created["sys"]["id"]}')
            json.dump(ids, open(IDS_PATH, 'w'), indent=2)
    json.dump(ids, open(IDS_PATH, 'w'), indent=2)


if __name__ == '__main__':
    main()
