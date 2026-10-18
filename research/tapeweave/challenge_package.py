"""Local challenge package prototype. No network, wallet, or deployment.
Run: python3 research/tapeweave/challenge_package.py [--check]
"""
import json
from pathlib import Path
import sys

from export_reference_bundle import build

DEST = Path(__file__).with_name("challenge-package-v1.json")


def exact_keys(value, keys):
    if type(value) is not dict or set(value) != set(keys):
        raise ValueError("unexpected fields")


def bit(value):
    if type(value) is not int or value not in (0, 1):
        raise ValueError("expected integer bit, not bool or string")


def validate(pack):
    """Validate fixed allowlist only; not an arbitrary-netlist security checker."""
    exact_keys(pack, ("schema", "evidence", "title", "description", "card", "rules", "prediction"))
    if pack["schema"] != "tapeweave-challenge-v1" or pack["evidence"] != "local-synthetic-only":
        raise ValueError("unsupported schema or evidence")
    for name, bound in (("title", 120), ("description", 2000)):
        if type(pack[name]) is not str or not pack[name].strip() or len(pack[name]) > bound:
            raise ValueError("invalid text")
    reference = build()
    card = pack["card"]
    exact_keys(card, ("mode", "netlist_hex", "sha256", "chain_identity"))
    allowed = next((c for c in reference["cards"] if c["mode"] == card["mode"]), None)
    if allowed is None or any(card[k] != allowed[k] for k in card):
        raise ValueError("unknown or altered card; chain identity must remain null")
    rules = pack["rules"]
    exact_keys(rules, ("profile", "world", "windows", "initial_state"))
    if rules["profile"] != "four-turn-fixed-recharge-v1" or rules["world"] not in ("training", "garden"):
        raise ValueError("unsupported host rules")
    bit(rules["initial_state"])
    if rules["initial_state"] != 0:
        raise ValueError("challenge must start from zero")
    if type(rules["windows"]) is not list or len(rules["windows"]) != 4:
        raise ValueError("expected four windows")
    for value in rules["windows"]:
        bit(value)
    prediction = pack["prediction"]
    exact_keys(prediction, ("question", "old_state", "trigger", "recharge", "expected_request", "expected_next_state"))
    if type(prediction["question"]) is not str or not prediction["question"].strip() or len(prediction["question"]) > 500:
        raise ValueError("invalid question")
    for name in set(prediction) - {"question"}:
        bit(prediction[name])
    transition = next(t for t in allowed["transitions"] if all(
        t[k] == prediction[k] for k in ("old_state", "trigger", "recharge")))
    if (prediction["expected_request"], prediction["expected_next_state"]) != (transition["request"], transition["next_state"]):
        raise ValueError("prediction answer disagrees with circuit")
    return next(c["optimal_reference"][card["mode"]] for c in reference["challenges"]
                if c["world"] == rules["world"] and list(c["windows"]) == rules["windows"])


def example():
    card = build()["cards"][0]
    return dict(schema="tapeweave-challenge-v1", evidence="local-synthetic-only",
                title="同拍补能会立即输出吗？",
                description="先预测，再尝试四回合。输出只是请求，得分由窗口与宿主规则决定。",
                card={k: card[k] for k in ("mode", "netlist_hex", "sha256", "chain_identity")},
                rules=dict(profile="four-turn-fixed-recharge-v1", world="training", windows=[0, 0, 1, 1], initial_state=0),
                prediction=dict(question="旧状态为0，同时触发并补能，本拍会输出吗？",
                                old_state=0, trigger=1, recharge=1, expected_request=0, expected_next_state=1))


def main():
    pack = example()
    validate(pack)
    text = json.dumps(pack, ensure_ascii=False, indent=2) + "\n"
    if sys.argv[1:] == ["--check"]:
        loaded = json.loads(DEST.read_text())
        replay = validate(loaded)
        if loaded != pack or DEST.read_text() != text:
            raise SystemExit("example differs; regenerate")
        print(f"package round-trip passed; reference score={replay['score']} (not a player result)")
    elif not sys.argv[1:]:
        DEST.write_text(text)
        print(DEST)
    else:
        raise SystemExit("usage: challenge_package.py [--check]")


if __name__ == "__main__":
    main()
