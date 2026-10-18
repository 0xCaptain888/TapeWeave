"""Exhaustive synthetic four-turn opportunity sweep; no network or human evidence.
Run: python3 research/tapeweave/strategy_sweep.py
"""
import json
from itertools import product
from behavior_replacement_probe import compile_ability, step


def ordinary(mode, old, trigger, recharge):
    if mode == "pulse":
        return recharge | (old & (1-trigger)), old & trigger
    return old ^ trigger, (1-old) & trigger


def play(world, mode, windows, actions, bytecode=True):
    state, pending, score, wasted = 0, 0, 0, 0
    trace = []
    for turn, trigger in enumerate(actions):
        # Synthetic replenishment schedule, fixed before either behavior runs.
        recharge = int(turn in (0, 2))
        if bytecode:
            state, fire = step(compile_ability(mode), state, trigger | (recharge << 1))
        else:
            state, fire = ordinary(mode, state, trigger, recharge)
        # Training hits an exposed target now. Garden waters now, matures next
        # turn; last-turn watering has no time to mature in this short horizon.
        effect = fire if world == "training" else pending
        score += effect * windows[turn]
        wasted += effect * (1-windows[turn])
        pending = fire
        trace.append([state, fire, score])
    return score, wasted, trace


def main():
    vectors = list(product((0, 1), repeat=4))
    results, comparisons = {}, 0
    for world in ("training", "garden"):
        outcomes, witnesses = {"pulse_wins": 0, "alternating_wins": 0, "tie": 0}, {}
        for windows in vectors:
            best = {}
            for mode in ("pulse", "alternating"):
                candidates = []
                for actions in vectors:
                    actual = play(world, mode, windows, actions)
                    assert actual == play(world, mode, windows, actions, False)
                    comparisons += 1
                    candidates.append((actual[0], -actual[1], actions))
                best[mode] = max(candidates)
            p, a = best["pulse"][0], best["alternating"][0]
            winner = "pulse_wins" if p > a else "alternating_wins" if a > p else "tie"
            outcomes[winner] += 1
            witnesses.setdefault(winner, {"windows": windows, "best": best})
        results[world] = {"optimal_score_comparison": outcomes, "first_witnesses": witnesses}
    print(json.dumps({"evidence": "synthetic-exhaustive-four-turn-only",
                      "assumptions": "known windows; free binary trigger; recharge turns 0,2; no costs or rewards",
                      "bytecode_vs_ordinary_trace_comparisons": comparisons,
                      "results": results}, indent=2))


if __name__ == "__main__":
    main()
