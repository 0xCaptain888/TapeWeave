#!/usr/bin/env python3
"""Publish tracked UTF-8 sources to the authorized repository; dry-run by default."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import urllib.request

REPO = '/repos/0xCaptain888/TapeWeave'
ROOT = Path(__file__).resolve().parents[1]


def api(path, data=None, method=None):
    request = urllib.request.Request(
        'https://api.github.com' + path,
        data=None if data is None else json.dumps(data).encode(),
        headers={'Authorization': 'Bearer ' + os.environ['GITHUB_TOKEN'],
                 'Accept': 'application/vnd.github+json',
                 'X-GitHub-Api-Version': '2022-11-28'}, method=method)
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def blob_sha(content):
    return hashlib.sha1(b'blob ' + str(len(content)).encode() + b'\0' + content).hexdigest()


def remote_files(commit):
    tree = api(REPO + '/git/trees/' + commit['tree']['sha'] + '?recursive=1')
    if tree.get('truncated'):
        raise ValueError('Remote tree truncated; refusing incomplete comparison')
    return {x['path']: x for x in tree['tree'] if x['type'] == 'blob'}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish', action='store_true')
    parser.add_argument('--message', default='chore(tapeweave): sync completed development snapshot')
    args = parser.parse_args()
    if not re.fullmatch(r'(feat|fix|refactor|perf|docs|test|build|ci|chore|style|revert)(\([^\n]+\))?: [^\n]{1,100}', args.message):
        raise ValueError('Use a conventional single-line commit message')
    assert api('/user')['login'].lower() == '0xcaptain888', 'Unexpected GitHub identity'
    head = api(REPO + '/git/ref/heads/main')['object']['sha']
    commit = api(REPO + '/git/commits/' + head)
    remote = remote_files(commit)
    entries = subprocess.check_output(['git', 'ls-files', '--stage', '-z'], cwd=ROOT).decode().split('\0')
    local = {}
    for entry in filter(None, entries):
        metadata, path = entry.split('\t', 1)
        mode, _, stage = metadata.split()
        if '__pycache__/' in path or path.endswith('.pyc'):
            continue
        if mode not in ('100644', '100755') or stage != '0':
            raise ValueError('Unsupported tracked entry: ' + path)
        source = ROOT / path
        if source.is_symlink():
            raise ValueError('Symlink refused: ' + path)
        content = source.read_bytes()
        content.decode('utf-8')  # No binary or cache uploads.
        if re.search(rb'(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----)', content):
            raise ValueError('Potential credential marker: ' + path)
        if path.endswith(('.sqlite', '.sqlite-wal', '.sqlite-shm', '.db')) or Path(path).name.startswith('.env'):
            raise ValueError('Private runtime file refused: ' + path)
        local[path] = (mode, content)
    if set(remote) - set(local):
        raise ValueError('Remote-only files require reconciliation; no deletions performed')
    changes = [{'path': p, 'mode': mode, 'type': 'blob', 'content': content.decode()}
               for p, (mode, content) in local.items()
               if p not in remote or remote[p]['sha'] != blob_sha(content) or remote[p]['mode'] != mode]
    print(json.dumps({'parent': head, 'files': len(local), 'changes': [c['path'] for c in changes],
                      'publish': args.publish}, ensure_ascii=False))
    if not args.publish:
        return
    if changes:
        tree = api(REPO + '/git/trees', {'base_tree': commit['tree']['sha'], 'tree': changes})
        created = api(REPO + '/git/commits', {'message': args.message, 'tree': tree['sha'], 'parents': [head]})
        if api(REPO + '/git/ref/heads/main')['object']['sha'] != head:
            raise ValueError('Remote advanced; rerun comparison')
        api(REPO + '/git/refs/heads/main', {'sha': created['sha'], 'force': False}, 'PATCH')
        head = created['sha']
    verified = remote_files(api(REPO + '/git/commits/' + head))
    assert set(verified) == set(local), 'Published file set mismatch'
    for p, (mode, content) in local.items():
        assert verified[p]['sha'] == blob_sha(content) and verified[p]['mode'] == mode, p
    print('Verified published snapshot:', head)


if __name__ == '__main__':
    main()
