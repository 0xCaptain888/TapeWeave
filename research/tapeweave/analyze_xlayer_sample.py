"""Offline analysis of the saved public RPC sample, not a complete TAP-02 VM."""
import json
from pathlib import Path


def dynamic(raw, index):
    data = bytes.fromhex(raw[2:])
    offset = int.from_bytes(data[index*32:(index+1)*32], "big")
    size = int.from_bytes(data[offset:offset+32], "big")
    value = data[offset+32:offset+32+size]
    assert len(value) == size
    return value


def latch_beat(netlist, state):
    """Only the observed zero-input NAND/LATCH target, not arbitrary REF graphs."""
    records, offset = [], 0
    while offset < len(netlist):
        opcode = netlist[offset]
        size = {0: 7, 1: 4}[opcode]
        args = [int.from_bytes(netlist[i:i+3], "big")
                for i in range(offset+1, offset+size, 3)]
        records.append((opcode, args))
        offset += size
    assert offset == len(netlist)
    signals, latch_index, delayed = [0, 1], 0, []
    for opcode, args in records:
        if opcode == 1:
            signals.append((state >> latch_index) & 1)
            delayed.append(args[0])
            latch_index += 1
        else:
            a, b = args
            assert a < len(signals) and b < len(signals)
            signals.append(1 - (signals[a] & signals[b]))
    assert latch_index == 2
    new_state = sum(signals[d] << i for i, d in enumerate(delayed))
    return bytes([new_state]), bytes([signals[-1]])


def main():
    sample = json.loads(Path(__file__).with_name("xlayer-readonly-2026-10-17.json").read_text())
    records = sample["records"]
    endpoints = sorted({r["endpoint"] for r in records})
    normalized = [[(r["method"], r["params"], r["response"].get("result"))
                   for r in records if r["endpoint"] == endpoint
                   and r["method"] not in ("eth_chainId", "eth_blockNumber")]
                  for endpoint in endpoints]
    assert normalized[0] == normalized[1]
    netlists = {}
    for r in records:
        if r["endpoint"] != endpoints[0] or r["method"] != "eth_call":
            continue
        tx = r["params"][0]
        if tx["data"].startswith("0x3fc4be56"):
            key = (tx["to"], int(tx["data"][10:], 16))
            netlists[key] = dynamic(r["response"]["result"], 0)
    target = json.loads(Path(__file__).with_name("xlayer-ref-target-2026-10-17.json").read_text())
    assert target["block"] == sample["block"]
    target_netlist = dynamic(target["netlist"], 0)
    checked = 0
    latch_checked = 0
    tables = {}
    references = {}
    for r in records:
        if r["endpoint"] != endpoints[0] or r["method"] != "eth_call":
            continue
        tx = r["params"][0]
        if not tx["data"].startswith("0xe8281a1a"):
            continue
        key = (tx["to"], int(tx["data"][10:74], 16))
        nl = netlists[key]
        if nl[0] == 2:
            # All reference-only sample netlists have exactly one zero-input REF.
            assert len(nl) == 31 and nl[29] == 0 and nl[30] == 1
            reference = {"cpu": "0x"+nl[1:21].hex(),
                         "id": int.from_bytes(nl[21:29], "big")}
            references[str(key)] = reference
            assert reference == {"cpu": target["target"], "id": target["circuit_id"]}
            state = dynamic("0x" + tx["data"][10:], 1)
            expected = latch_beat(target_netlist, int.from_bytes(state, "little"))
            raw = r["response"]["result"]
            assert (dynamic(raw, 0), dynamic(raw, 1)) == expected
            latch_checked += 1
            continue
        # Restrict the local evaluator to the observed 2-input NAND-only subset.
        assert len(nl) % 7 == 0
        inputs = dynamic("0x" + tx["data"][10:], 2)
        assert len(inputs) == 1
        signals = [0, 1, inputs[0] & 1, (inputs[0] >> 1) & 1]
        for offset in range(0, len(nl), 7):
            assert nl[offset] == 0
            a = int.from_bytes(nl[offset+1:offset+4], "big")
            b = int.from_bytes(nl[offset+4:offset+7], "big")
            assert a < len(signals) and b < len(signals)
            signals.append(1 - (signals[a] & signals[b]))
        raw = r["response"]["result"]
        assert dynamic(raw, 0) == b""
        assert dynamic(raw, 1) == bytes([signals[-1]])
        tables.setdefault(str(key), {})[inputs[0]] = signals[-1]
        checked += 1
    print(json.dumps({"block": sample["block"], "paired_reads_equal": len(normalized[0]),
                      "nand_only_step_responses_checked": checked,
                      "nand_only_tables": tables,
                      "ref_latch_step_responses_checked": latch_checked,
                      "ref_latch_coverage": "state 0 and 1 only; zero inputs; not exhaustive",
                      "reference_targets_checked": references}, indent=2))


if __name__ == "__main__":
    main()
