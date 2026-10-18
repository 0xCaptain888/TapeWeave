"""Synthetic portability model, not TAP-02 serialization or a chain client.
Run: python3 research/tapeweave/portable_ability_model.py
No dependencies, network, wallet, or persistent application state.
"""
import hashlib
import itertools
import json
import unittest

# Indices 0 and 1 are trigger/recharge; 2 is the previous charge (LATCH).
# NAND operands refer backwards. The latch D refers forward to signal 10.
# These JSON records are OUR MODEL FORMAT, not a TapeOut payload.
ARTIFACT = {
    "profile": "synthetic-charge-v1",
    "inputs": ["trigger", "recharge"],
    "records": [
        ["LATCH", 10],
        ["NAND", 2, 0],  # 3: not fire
        ["NAND", 3, 3],  # 4: fire
        ["NAND", 0, 0],  # 5: not trigger
        ["NAND", 2, 5],  # 6: not retained charge
        ["NAND", 1, 1],  # 7: not recharge
        ["NAND", 6, 7],  # 8: next charge
        ["NAND", 8, 8],  # 9: not next charge
        ["NAND", 9, 9],  # 10: next charge
    ],
    "output": 4,
}


def digest(artifact):
    canonical = json.dumps(artifact, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(canonical.encode()).hexdigest()


def step(artifact, state, trigger, recharge):
    if any(type(v) is not int or v not in (0, 1) for v in (state, trigger, recharge)):
        raise ValueError("all values must be integer bits")
    signals = [trigger, recharge]
    latch_targets = []
    for record in artifact["records"]:
        if record[0] == "LATCH":
            signals.append(state)
            latch_targets.append(record[1])
        elif record[0] == "NAND":
            a, b = record[1:]
            if not (0 <= a < len(signals) and 0 <= b < len(signals)):
                raise ValueError("invalid NAND reference")
            signals.append(1 - (signals[a] & signals[b]))
        else:
            raise ValueError("unknown model opcode")
    if len(latch_targets) != 1:
        raise ValueError("this model requires exactly one latch")
    return signals[latch_targets[0]], signals[artifact["output"]]


class Host:
    """Independent application state, with a deliberately tiny host policy.

    This is not authentication: owner/world are caller-provided strings. Real
    applications must derive and authorize them at their own execution boundary.
    """

    def __init__(self, world, effect):
        self.world = world
        self.effect = effect
        self.states = {}
        self.sequences = {}

    def act(self, owner, sequence, trigger, recharge):
        if type(sequence) is not int or sequence != self.sequences.get(owner, 0):
            raise ValueError("stale/out-of-order sequence")
        old = self.states.get(owner, 0)
        new, fire = step(ARTIFACT, old, trigger, recharge)
        self.states[owner] = new
        self.sequences[owner] = sequence + 1
        return {
            "world": self.world,
            "owner": owner,
            "artifact": digest(ARTIFACT),
            "sequence": sequence,
            "state": [old, new],
            "inputs": [trigger, recharge],
            "output": fire,
            "effect": self.effect if fire else "none",
        }


class PortabilityTests(unittest.TestCase):
    def test_all_eight_transitions_match_specification(self):
        for old, trigger, recharge in itertools.product((0, 1), repeat=3):
            with self.subTest(old=old, trigger=trigger, recharge=recharge):
                self.assertEqual(step(ARTIFACT, old, trigger, recharge),
                                 (recharge | (old & (1 - trigger)), old & trigger))

    def test_same_artifact_different_host_effects(self):
        a, b = Host("dojo", "break-training-target"), Host("garden", "open-water-channel")
        for host in (a, b):
            host.act("alice", 0, 0, 1)
        ra, rb = a.act("alice", 1, 1, 0), b.act("alice", 1, 1, 0)
        self.assertEqual(ra["artifact"], rb["artifact"])
        self.assertEqual(ra["output"], rb["output"])
        self.assertNotEqual(ra["effect"], rb["effect"])

    def test_world_state_does_not_leak(self):
        a, b = Host("dojo", "hit"), Host("garden", "water")
        a.act("alice", 0, 0, 1)
        self.assertEqual(a.act("alice", 1, 1, 0)["output"], 1)
        self.assertEqual(b.act("alice", 0, 1, 0)["output"], 0)

    def test_users_do_not_share_state(self):
        host = Host("dojo", "hit")
        host.act("alice", 0, 0, 1)
        self.assertEqual(host.act("bob", 0, 1, 0)["output"], 0)

    def test_host_rejects_duplicate_sequence(self):
        host = Host("dojo", "hit")
        host.act("alice", 0, 0, 1)
        with self.assertRaises(ValueError):
            host.act("alice", 0, 1, 0)

    def test_recharge_changes_next_state_not_old_state_output(self):
        self.assertEqual(step(ARTIFACT, 0, 1, 1), (1, 0))
        self.assertEqual(step(ARTIFACT, 1, 1, 1), (1, 1))


if __name__ == "__main__":
    print(json.dumps({"evidence": "synthetic-portable-ability-model-only",
                      "model_sha256": digest(ARTIFACT),
                      "warning": "not TAP-02 bytes, chain identity, authentication, or adoption"}))
    unittest.main(verbosity=2)
