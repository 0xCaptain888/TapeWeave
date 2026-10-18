"""Local byte-netlist experiment. No network, wallet, deployment or authentication.
Encoding follows the fixed TAP-02 Draft; not certification or X Layer execution.
Run: python3 research/tapeweave/behavior_replacement_probe.py
"""
import hashlib
import unittest
from dataclasses import dataclass


def nand(a, b):
    return b"\x00" + a.to_bytes(3, "big") + b.to_bytes(3, "big")


def compile_ability(mode):
    # signals: 0/1 constants, 2 trigger, 3 recharge, 4 old latch state.
    gates = []
    def gate(a, b):
        gates.append(nand(a, b))
        return 4 + len(gates)
    def inv(a):
        return gate(a, a)
    def both(a, b):
        return inv(gate(a, b))
    if mode == "pulse":
        retained = both(4, inv(2))
        next_state = gate(inv(3), inv(retained))
        fire = both(4, 2)
    elif mode == "alternating":
        # Toggled by trigger; recharge is intentionally ignored by this behavior.
        a = gate(4, 2)
        next_state = gate(gate(4, a), gate(2, a))
        fire = both(inv(4), 2)
    else:
        raise ValueError("unknown behavior")
    assert fire == 4 + len(gates)  # Last produced signal is the single output.
    return b"\x01" + next_state.to_bytes(3, "big") + b"".join(gates)


def step(netlist, state, inputs):
    if state not in (0, 1) or inputs not in range(4):
        raise ValueError("fixed profile range")
    signals, delayed, offset = [0, 1, inputs & 1, (inputs >> 1) & 1], [], 0
    while offset < len(netlist):
        opcode = netlist[offset]
        if opcode == 1 and offset == 0 and len(netlist) >= 4:
            delayed.append(int.from_bytes(netlist[offset+1:offset+4], "big"))
            signals.append(state)
            offset += 4
        elif opcode == 0 and offset + 7 <= len(netlist):
            a = int.from_bytes(netlist[offset+1:offset+4], "big")
            b = int.from_bytes(netlist[offset+4:offset+7], "big")
            if max(a, b) >= len(signals):
                raise ValueError("future NAND signal")
            signals.append(1 - (signals[a] & signals[b]))
            offset += 7
        else:
            raise ValueError("unsupported or truncated record")
    if len(delayed) != 1 or delayed[0] >= len(signals) or len(signals) < 6:
        raise ValueError("invalid fixed profile")
    return signals[delayed[0]], signals[-1]


@dataclass
class Host:
    world: str
    netlist: bytes
    state: int = 0
    nonce: int = 0
    turns: int = 0
    progress: int = 0

    def act(self, nonce, trigger=True):
        if nonce != self.nonce or self.turns >= 4:
            raise ValueError("replay or finished challenge")
        # Host-derived input: training recharges before any target is hit;
        # garden recharges while water stock remains. Caller cannot supply it.
        recharge = self.progress == 0 if self.world == "training" else self.progress < 2
        new_state, fire = step(self.netlist, self.state, int(trigger) | (int(recharge) << 1))
        if self.world not in ("training", "garden"):
            raise ValueError("unknown world")
        # All validation precedes mutation. Local atomicity only, no transaction.
        self.state, self.nonce, self.turns = new_state, self.nonce + 1, self.turns + 1
        if fire:
            # Training: damage to a 3-health target. Garden: irrigated plots / 2.
            self.progress = min(self.progress + 1, 3 if self.world == "training" else 2)
        return {"fire": fire, "state": self.state, "progress": self.progress,
                "remaining": (3 if self.world == "training" else 2) - self.progress}

    def replace(self, netlist):
        if self.turns:
            raise ValueError("no mid-challenge replacement")
        step(netlist, 0, 0)
        self.netlist, self.state = netlist, 0


class ReplacementTests(unittest.TestCase):
    def test_pulse_all_eight_transitions(self):
        for old in range(2):
            for inputs in range(4):
                trigger, recharge = inputs & 1, (inputs >> 1) & 1
                self.assertEqual(step(compile_ability("pulse"), old, inputs),
                                 (recharge | (old & (1-trigger)), old & trigger))

    def test_alternating_all_eight_transitions(self):
        for old in range(2):
            for inputs in range(4):
                trigger = inputs & 1
                self.assertEqual(step(compile_ability("alternating"), old, inputs),
                                 (old ^ trigger, (1-old) & trigger))

    def test_replacement_changes_both_hosts_without_consumer_change(self):
        for world in ("training", "garden"):
            pulse = Host(world, compile_ability("pulse"))
            alt = Host(world, compile_ability("pulse"))
            alt.replace(compile_ability("alternating"))
            p = [pulse.act(i)["fire"] for i in range(4)]
            a = [alt.act(i)["fire"] for i in range(4)]
            self.assertEqual(p, [0, 1, 1, 0] if world == "training" else [0, 1, 1, 1])
            self.assertEqual(a, [1, 0, 1, 0])
            self.assertEqual(pulse.progress, 2)
            self.assertEqual(alt.progress, 2)
            # Equal final score / capped garden progress: not proof of fun.
            # Garden may emit fire even after both plots are irrigated; the host
            # caps effects. Output pulses do not guarantee a useful action.

    def test_world_and_instance_isolation(self):
        blob = compile_ability("pulse")
        a, b, c = Host("training", blob), Host("garden", blob), Host("training", blob)
        a.act(0)
        self.assertEqual((b.state, c.state), (0, 0))
        self.assertEqual(a.netlist, b.netlist)

    def test_replay_and_mid_challenge_replacement_rejected(self):
        host = Host("training", compile_ability("pulse"))
        host.act(0)
        before = vars(host).copy()
        with self.assertRaises(ValueError):
            host.act(0)
        with self.assertRaises(ValueError):
            host.replace(compile_ability("alternating"))
        self.assertEqual(vars(host), before)

    def test_new_challenge_resets_state(self):
        old = Host("training", compile_ability("pulse"))
        old.act(0)
        new = Host("training", compile_ability("alternating"))
        self.assertEqual((new.state, new.nonce, new.progress), (0, 0, 0))
        self.assertEqual(old.state, 1)

    def test_failure_does_not_grant_effect(self):
        host = Host("garden", b"\x00")
        before = vars(host).copy()
        with self.assertRaises(ValueError):
            host.act(0)
        self.assertEqual(vars(host), before)

    def test_profile_rejects_future_signal_and_out_of_range(self):
        for blob in (b"\x01\x00\x00\xff" + nand(2, 3), b"\x01\x00\x00\x05" + nand(99, 3)):
            with self.assertRaises(ValueError):
                step(blob, 0, 0)
        with self.assertRaises(ValueError):
            step(compile_ability("pulse"), 2, 0)


if __name__ == "__main__":
    result = unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(ReplacementTests))
    for mode in ("pulse", "alternating"):
        blob = compile_ability(mode)
        print(mode, "bytes=", len(blob), "sha256=", hashlib.sha256(blob).hexdigest(), "hex=", blob.hex())
    print("evidence=local-byte-netlist-two-host-replacement-only; no chain identity, authentication or adoption")
    raise SystemExit(not result.wasSuccessful())
