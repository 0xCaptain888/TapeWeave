"""Bounded public RPC reads at the existing sample block; no storage writes.
Run: python3 research/tapeweave/implementation_context_probe.py
The embedded address is extracted from an exact observed runtime prefix,
not a generic proxy detector or a proof of implementation source identity.
"""
import json
from pathlib import Path
from datetime import datetime, timezone
from xlayer_readonly_probe import ENDPOINTS, rpc, call, records

PREFIX = "60806040819052635c60da1b60e01b81526020816004817f"
MASK_SUFFIX = "6001600160a01b03165afa"


def extract_candidate(code):
    raw = bytes.fromhex(code.removeprefix("0x"))
    prefix = bytes.fromhex(PREFIX)
    if not raw.startswith(prefix):
        raise ValueError("unknown runtime prefix; no inferred beacon")
    word = raw[len(prefix):len(prefix)+32]
    suffix = bytes.fromhex(MASK_SUFFIX)
    if word[:12] != bytes(12) or raw[len(prefix)+32:len(prefix)+32+len(suffix)] != suffix:
        raise ValueError("unexpected address word or STATICCALL sequence")
    return "0x" + word[12:].hex()


def main():
    sample = json.loads(Path(__file__).with_name("xlayer-readonly-2026-10-17.json").read_text())
    code_records = [r for r in sample["records"] if r["method"] == "eth_getCode"
                    and r["endpoint"] == ENDPOINTS[0]][1:]
    candidates = {r["params"][0]: extract_candidate(r["response"]["result"])
                  for r in code_records}
    assert len(candidates) == 3 and len(set(candidates.values())) == 1
    beacon = next(iter(candidates.values()))
    observed = []
    for url in ENDPOINTS:
        assert rpc(url, "eth_chainId", []) == "0xc4"
        beacon_code = rpc(url, "eth_getCode", [beacon, sample["block"]])
        result = call(url, beacon, "0x5c60da1b", sample["block"])
        if not result or len(result) != 66 or result[2:26] != "0"*24:
            raise ValueError("implementation() unavailable or malformed")
        implementation = "0x" + result[-40:]
        implementation_code = rpc(url, "eth_getCode", [implementation, sample["block"]])
        if not beacon_code or beacon_code == "0x" or not implementation_code or implementation_code == "0x":
            raise ValueError("empty or unavailable code")
        observed.append({"endpoint": url, "beacon_candidate": beacon,
                         "implementation_returned": implementation})
    print(json.dumps({"evidence": "bounded-runtime-and-implementation-read-not-source-verification",
                      "observed_at_utc": datetime.now(timezone.utc).isoformat(),
                      "block": sample["block"], "processor_candidates": candidates,
                      "observations": observed, "records": records}, indent=2))


if __name__ == "__main__":
    main()
