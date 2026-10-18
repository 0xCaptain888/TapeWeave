#!/usr/bin/env python3
"""Synthetic release-consistency model, NOT a TapeOut client or RPC test.
Run: python3 research/tapespec/release_model.py
Only Python standard library; no network, signing, or filesystem writes.
"""
import hashlib
import json
import unittest


def digest(data):
    return hashlib.sha256(data.encode()).hexdigest()


def manifest(files):
    return {path: digest(body) for path, body in files.items()}


def observe(files, declaration, requested):
    """Experimental bounded-release policy. Does not implement TAP-10."""
    if not declaration:
        return "unsupported"
    if any(path not in files or digest(files[path]) != expected
           for path, expected in declaration.items()):
        return "release-mismatch"
    if any(path not in declaration for path in requested):
        return "unlisted-request"
    return "pass"


V1 = {"index.html": "<main>v1</main><script src='app.js'></script>",
      "app.js": "window.appVersion=1"}
V2 = {"index.html": "<main>v2</main><script src='app.js'></script>",
      "app.js": "window.appVersion=2"}
M1, M2 = manifest(V1), manifest(V2)
MIXED = {"index.html": V2["index.html"], "app.js": V1["app.js"]}


def ordinary_file_checks(files):
    # Synthetic current chain metadata generated from the *current* bytes.
    # Demonstrates why correct per-file integrity need not imply a release.
    current_metadata = manifest(files)
    return all(digest(body) == current_metadata[path]
               for path, body in files.items())


def run_cases():
    return [
        {"case": "complete-v1", "file_integrity": ordinary_file_checks(V1),
         "release_policy": observe(V1, M1, V1)},
        {"case": "mixed-current-state", "file_integrity": ordinary_file_checks(MIXED),
         "release_policy": observe(MIXED, M1, MIXED)},
        {"case": "v2-files-old-manifest", "file_integrity": ordinary_file_checks(V2),
         "release_policy": observe(V2, M1, V2)},
        {"case": "complete-v2", "file_integrity": ordinary_file_checks(V2),
         "release_policy": observe(V2, M2, V2)},
        {"case": "missing-manifest", "file_integrity": ordinary_file_checks(V1),
         "release_policy": observe(V1, None, V1)},
        {"case": "unlisted-import", "file_integrity": ordinary_file_checks(V1),
         "release_policy": observe(V1, M1, ["index.html", "extra.js"])},
    ]


class ReleaseModelTests(unittest.TestCase):
    def test_valid_files_can_form_mixed_release(self):
        self.assertTrue(ordinary_file_checks(MIXED))
        self.assertEqual(observe(MIXED, M1, MIXED), "release-mismatch")

    def test_complete_releases(self):
        for files, declaration in [(V1, M1), (V2, M2)]:
            self.assertEqual(observe(files, declaration, files), "pass")

    def test_manifest_last_can_have_unavailable_window(self):
        self.assertEqual(observe(V2, M1, V2), "release-mismatch")
        self.assertEqual(observe(V2, M2, V2), "pass")

    def test_missing_manifest_is_not_protocol_failure(self):
        self.assertEqual(observe(V1, None, V1), "unsupported")

    def test_missing_file(self):
        self.assertEqual(observe({"index.html": V1["index.html"]}, M1,
                                 ["index.html"]), "release-mismatch")

    def test_unlisted_dynamic_request(self):
        self.assertEqual(observe(V1, M1, ["extra.js"]), "unlisted-request")

    def test_hash_only_mutant_would_accept_mixed_release(self):
        # Positive mutation control: the weaker rule accepts a known bad fixture.
        # This is NOT a mutation of an actual client implementation.
        self.assertTrue(ordinary_file_checks(MIXED))
        self.assertNotEqual(observe(MIXED, M1, MIXED), "pass")

    def test_existing_document_can_keep_snapshot(self):
        retained = dict(V1)
        chain_now = dict(V2)
        self.assertEqual(observe(retained, M1, retained), "pass")
        self.assertEqual(observe(chain_now, M1, chain_now), "release-mismatch")

    def test_first_visit_cannot_detect_rollback(self):
        # A complete older release still passes. This model has no freshness oracle.
        self.assertEqual(observe(V1, M1, V1), "pass")


if __name__ == "__main__":
    print(json.dumps({"evidence": "synthetic-model-only", "cases": run_cases()},
                     ensure_ascii=False, indent=2), flush=True)
    unittest.main(verbosity=2)
