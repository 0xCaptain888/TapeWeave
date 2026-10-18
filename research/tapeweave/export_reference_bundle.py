"""Export local reference cards; no network, wallet or deployment.
Run: python3 research/tapeweave/export_reference_bundle.py [--check]
"""
import hashlib
import json
from itertools import product
from pathlib import Path
import sys

from behavior_replacement_probe import compile_ability, step
from strategy_sweep import ordinary, play

DEST = Path(__file__).with_name("reference-bundle-v1.json")


def build():
    cards = []
    for mode in ("pulse", "alternating"):
        blob = compile_ability(mode)
        transitions = []
        for old, recharge, trigger in product((0, 1), repeat=3):
            new, fire = step(blob, old, trigger | (recharge << 1))
            if (new, fire) != ordinary(mode, old, trigger, recharge):
                raise ValueError("ordinary comparison failed")
            transitions.append(dict(old_state=old, trigger=trigger, recharge=recharge,
                                    next_state=new, request=fire))
        cards.append(dict(mode=mode, netlist_hex=blob.hex(), byte_length=len(blob),
                          sha256=hashlib.sha256(blob).hexdigest(), transitions=transitions,
                          chain_identity=None))
    vectors = list(product((0, 1), repeat=4))
    challenges = []
    for world in ("training", "garden"):
        for windows in vectors:
            best = {}
            for mode in ("pulse", "alternating"):
                candidates = []
                for actions in vectors:
                    actual = play(world, mode, windows, actions)
                    if actual != play(world, mode, windows, actions, False):
                        raise ValueError("trace comparison failed")
                    candidates.append((actual[0], -actual[1], actions))
                score, neg_wasted, actions = max(candidates)
                state, pending, total = 0, 0, 0
                trace = []
                for turn, trigger in enumerate(actions):
                    old = state
                    recharge = int(turn in (0, 2))
                    state, fire = step(compile_ability(mode), old, trigger | (recharge << 1))
                    effect = fire if world == "training" else pending
                    gained = effect * windows[turn]
                    total += gained
                    trace.append(dict(turn=turn, old_state=old, trigger=trigger,
                                      recharge=recharge, request=fire, next_state=state,
                                      effect_due=effect, window=windows[turn],
                                      gained=gained, cumulative_score=total))
                    pending = fire
                if total != score:
                    raise ValueError("replay score mismatch")
                best[mode] = dict(actions=actions, score=score, wasted=-neg_wasted, trace=trace)
            challenges.append(dict(world=world, windows=windows, optimal_reference=best))
    return dict(schema="tapeweave-local-reference-v1", evidence="local-synthetic-only",
                limitations=["not deployed", "not independent adoption", "not a security certificate",
                             "no ownership or authentication", "not the original Host progress model"],
                profile=dict(inputs=["trigger(bit0)", "recharge(bit1)"], outputs=["request"],
                             state_bits=1, initial_state=0, ref_allowed=False,
                             allowed_modes=["pulse", "alternating"]),
                challenge_rules=dict(turns=4, recharge_turns=[0, 2], known_windows=True,
                                     trigger_cost=0, garden_effect="previous turn request",
                                     tie_break="max score, min wasted, lexicographically largest actions",
                                     trace_kind="system optimal reference, not player result"),
                cards=cards, challenges=challenges)


def main():
    text = json.dumps(build(), ensure_ascii=False, indent=2) + "\n"
    if sys.argv[1:] == ["--check"]:
        if DEST.read_text() != text:
            raise SystemExit("reference bundle differs; regenerate")
        print("reference bundle matches: 2 cards, 16 transitions, 64 optimal replays")
    elif sys.argv[1:]:
        raise SystemExit("usage: export_reference_bundle.py [--check]")
    else:
        DEST.write_text(text)
        print(DEST)


if __name__ == "__main__":
    main()
