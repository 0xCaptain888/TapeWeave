#!/usr/bin/env python3
"""Offline synchronization safety tests. Never contacts GitHub or reads tokens."""
import contextlib
import importlib.util
import io
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('sync_tapeweave', Path(__file__).with_name('sync-tapeweave-github.py'))
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class SafetyTests(unittest.TestCase):
    def run_sync(self, *, publish=False, remote_only=False, advanced=False,
                 mismatch=False, identity='0xCaptain888', content=b'hello', mode='100644', truncated=False):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'source.txt').write_bytes(content)
            calls = []
            reads = 0

            def api(path, data=None, method=None):
                nonlocal reads
                calls.append((path, data, method))
                if path == '/user':
                    return {'login': identity}
                if path.endswith('/git/ref/heads/main'):
                    reads += 1
                    return {'object': {'sha': 'advanced' if advanced and reads > 1 else 'old'}}
                if '/git/commits/' in path:
                    return {'tree': {'sha': 'tree'}}
                if '?recursive=1' in path:
                    # Initial tree intentionally differs, forcing a proposed change.
                    sha = sync.blob_sha(content) if any(c[2] == 'PATCH' for c in calls) else 'outdated'
                    if mismatch:
                        sha = 'wrong'
                    files = [{'path': 'source.txt', 'mode': '100644', 'type': 'blob', 'sha': sha}]
                    if remote_only:
                        files.append({'path': 'remote.txt', 'mode': '100644', 'type': 'blob', 'sha': 'other'})
                    return {'tree': files, 'truncated': truncated}
                if path.endswith('/git/trees'):
                    return {'sha': 'new-tree'}
                if path.endswith('/git/commits'):
                    return {'sha': 'new-commit'}
                if method == 'PATCH':
                    self.assertEqual(data, {'sha': 'new-commit', 'force': False})
                    return {}
                raise AssertionError('Unexpected API call: ' + path)

            self.calls = calls
            argv = ['sync'] + (['--publish'] if publish else [])
            with patch.object(sync, 'ROOT', root), patch.object(sync, 'api', side_effect=api), patch.object(sync.subprocess, 'check_output', return_value=f'{mode} hash 0\tsource.txt\0'.encode()), patch.object(sys, 'argv', argv), contextlib.redirect_stdout(io.StringIO()):
                sync.main()

    def assert_no_ref_write(self):
        self.assertFalse(any(c[2] == 'PATCH' for c in self.calls))

    def test_dry_run_never_writes(self):
        self.run_sync()
        self.assertTrue(all(data is None and method is None for _, data, method in self.calls))

    def test_remote_only_preserved(self):
        with self.assertRaisesRegex(ValueError, 'Remote-only'):
            self.run_sync(publish=True, remote_only=True)
        self.assert_no_ref_write()

    def test_head_change_stops_update(self):
        with self.assertRaisesRegex(ValueError, 'Remote advanced'):
            self.run_sync(publish=True, advanced=True)
        self.assert_no_ref_write()

    def test_post_publish_mismatch_not_success(self):
        with self.assertRaisesRegex(ValueError, 'Published blob or mode mismatch'):
            self.run_sync(publish=True, mismatch=True)
        # A verification failure after PATCH is NOT a rolled-back publication.
        self.assertTrue(any(c[2] == 'PATCH' for c in self.calls))

    def test_success_uses_non_force_update(self):
        self.run_sync(publish=True)
        self.assertEqual(sum(c[2] == 'PATCH' for c in self.calls), 1)

    def test_wrong_identity(self):
        with self.assertRaisesRegex(ValueError, 'identity'):
            self.run_sync(publish=True, identity='other')
        self.assert_no_ref_write()

    def test_incomplete_tree(self):
        with self.assertRaisesRegex(ValueError, 'truncated'):
            self.run_sync(publish=True, truncated=True)
        self.assert_no_ref_write()

    def test_untrusted_inputs(self):
        # Assemble a synthetic marker so this test source itself is publishable.
        marker = b'gh' + b'p_' + b'x' * 32
        for kwargs, error in [({'content': marker}, ValueError), ({'content': b'\xff'}, UnicodeDecodeError), ({'mode': '120000'}, ValueError)]:
            with self.subTest(kwargs=kwargs), self.assertRaises(error):
                self.run_sync(publish=True, **kwargs)
            self.assert_no_ref_write()


if __name__ == '__main__':
    unittest.main()
