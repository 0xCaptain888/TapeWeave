"""Run a local challenge, not an on-chain host or a player study.
Usage: python3 research/tapeweave/play_challenge.py PACKAGE 0011 [--ordinary]
Returns a fresh result; never mutates the package or writes player state.
"""
import json
from pathlib import Path
import sys

from behavior_replacement_probe import step
from challenge_package import bit, validate
from strategy_sweep import ordinary


def play_package(pack, actions, use_ordinary=False):
    reference = validate(pack)
    if type(actions) is not list or len(actions) != 4:
        raise ValueError("expected four integer actions")
    for action in actions:
        bit(action)
    if type(use_ordinary) is not bool:
        raise ValueError("invalid execution mode")
    state, pending, total = 0, 0, 0
    trace = []
    mode = pack["card"]["mode"]
    blob = bytes.fromhex(pack["card"]["netlist_hex"])
    for turn, trigger in enumerate(actions):
        old, old_pending = state, pending
        recharge = int(turn in (0, 2))
        state, request = (ordinary(mode, old, trigger, recharge) if use_ordinary
                          else step(blob, old, trigger | (recharge << 1)))
        effect = request if pack["rules"]["world"] == "training" else old_pending
        window = pack["rules"]["windows"][turn]
        gained = effect * window
        total += gained
        trace.append(dict(turn=turn, old_state=old, trigger=trigger, recharge=recharge,
                          request=request, next_state=state, effect_due=effect,
                          window=window, gained=gained, cumulative_score=total))
        pending = request
    return dict(evidence="local-action-replay-not-player-study", execution="ordinary" if use_ordinary else "byte-circuit",
                chain_identity=None, actions=actions.copy(), score=total,
                system_reference_score=reference["score"], trace=trace,
                limitations=["no authentication or persistent state", "no independent implementation",
                             "garden final pending request does not mature within four turns"])


def reject_duplicates(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("duplicate JSON key")
        result[key] = value
    return result


def load_package(path):
    with Path(path).open("rb") as handle:
        data = handle.read(65537)
    if len(data) > 65536:
        raise ValueError("package exceeds local 64 KiB limit")
    return json.loads(data, object_pairs_hook=reject_duplicates)


def main():
    args = sys.argv[1:]
    if len(args) not in (2, 3) or (len(args) == 3 and args[2] != "--ordinary"):
        raise SystemExit("usage: play_challenge.py PACKAGE 0011 [--ordinary]")
    try:
        if len(args[1]) != 4 or any(c not in "01" for c in args[1]):
            raise ValueError("actions must be four characters 0 or 1")
        result = play_package(load_package(args[0]), [int(c) for c in args[1]], len(args) == 3)
    except (ValueError, OSError) as exc:
        raise SystemExit(f"challenge rejected: {exc}") from None
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
