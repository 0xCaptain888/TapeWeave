"""Public JSON-RPC reads only; no wallet, signing, state overrides or broadcast.
Run: python3 research/tapeweave/xlayer_readonly_probe.py
Prints raw responses for a bounded sample. Does not establish source equivalence.
"""
import json
import subprocess
from datetime import datetime, timezone

ENDPOINTS = ("https://rpc.xlayer.tech", "https://xlayerrpc.okx.com")
# Observed in the official frontend bundle on 2026-10-17; not an audit.
FACTORY = "0x1f09daefa827f02cbb40967cc91b259763760761"
ALLOWED = {"eth_chainId", "eth_blockNumber", "eth_getCode", "eth_call"}
records = []


def rpc(url, method, params):
    if method not in ALLOWED:
        raise ValueError("read-only method required")
    payload = json.dumps({"jsonrpc": "2.0", "id": len(records) + 1,
                          "method": method, "params": params})
    try:
        response = subprocess.run([
            "curl", "--fail-with-body", "--silent", "--show-error", "--max-time", "25",
            "-H", "Content-Type: application/json", "--data", payload, url,
        ], check=True, capture_output=True, text=True)
        body = json.loads(response.stdout)
    except Exception as error:
        body = {"transport_error": str(error)}
    records.append({"endpoint": url, "method": method, "params": params,
                    "response": body})
    return body.get("result")


def call(url, address, data, block):
    return rpc(url, "eth_call", [{"to": address, "data": data}, block])


def word(number):
    return format(number, "064x")


def main():
    chains = [rpc(url, "eth_chainId", []) for url in ENDPOINTS]
    if chains != ["0xc4", "0xc4"]:
        raise RuntimeError("chain identity unavailable or unexpected")
    heights = [rpc(url, "eth_blockNumber", []) for url in ENDPOINTS]
    block = hex(min(int(height, 16) for height in heights))
    for url in ENDPOINTS:
        rpc(url, "eth_getCode", [FACTORY, block])
        count = call(url, FACTORY, "0xa94da8a7", block)
        if not count:
            continue
        # First three processors only; first six circuits each. Not a census.
        for index in range(min(3, int(count, 16))):
            encoded = call(url, FACTORY, "0x4bc7cbbd" + word(index), block)
            if not encoded or len(encoded) != 66:
                continue
            cpu = "0x" + encoded[-40:]
            rpc(url, "eth_getCode", [cpu, block])
            next_id = call(url, cpu, "0x61b8ce8c", block)
            if not next_id:
                continue
            for circuit in range(1, min(7, int(next_id, 16))):
                info = call(url, cpu, "0x084d60f1" + word(circuit), block)
                call(url, cpu, "0x3fc4be56" + word(circuit), block)
                if not info or len(info) != 258:
                    continue
                n_in, _, n_state, _ = [int(info[2+i:2+i+64], 16)
                                      for i in range(0, 256, 64)]
                if n_in > 256 or n_state > 256:
                    continue
                # ABI: id, state offset, input offset, then dynamic byte arrays.
                for state in (0, 1):
                    for inputs in range(4):
                        state_bytes = state.to_bytes((n_state+7)//8, "little") if n_state else b""
                        input_bytes = inputs.to_bytes(max(1, (n_in+7)//8), "little")[:(n_in+7)//8]
                        def dynamic(value):
                            return word(len(value)) + value.hex().ljust(((len(value)+31)//32)*64, "0")
                        tail = dynamic(state_bytes)
                        data = ("0xe8281a1a" + word(circuit) + word(96)
                                + word(96 + len(tail)//2) + tail + dynamic(input_bytes))
                        call(url, cpu, data, block)
    # Explicit REF target observed in this bounded sample; no recursive crawl.
    target = "0xf044d395c91e77459e6b2155015e14f0dd9b349f"
    for url in ENDPOINTS:
        for selector in ("0x084d60f1", "0x3fc4be56"):
            call(url, target, selector + word(102), block)
    print(json.dumps({"evidence": "public-xlayer-readonly-bounded-sample",
                      "observed_at_utc": datetime.now(timezone.utc).isoformat(),
                      "block": block, "records": records}, indent=2))


if __name__ == "__main__":
    main()
