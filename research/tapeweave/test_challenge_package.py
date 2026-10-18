"""Author tests only; no independent consumer or UI validation."""
import copy
import json
import unittest

from challenge_package import example, validate
from export_reference_bundle import build


class PackageTests(unittest.TestCase):
    def test_round_trip(self):
        pack = example()
        self.assertEqual(validate(json.loads(json.dumps(pack)))["score"], 2)

    def test_all_cards_worlds_windows(self):
        ref = build()
        for card in ref["cards"]:
            for challenge in ref["challenges"]:
                pack = example()
                pack["card"] = {k: card[k] for k in pack["card"]}
                pack["rules"]["world"] = challenge["world"]
                pack["rules"]["windows"] = list(challenge["windows"])
                t = card["transitions"][0]
                pack["prediction"] = dict(question="预测此转换", old_state=t["old_state"],
                    trigger=t["trigger"], recharge=t["recharge"], expected_request=t["request"],
                    expected_next_state=t["next_state"])
                self.assertEqual(validate(pack), challenge["optimal_reference"][card["mode"]])

    def test_reject_changes(self):
        mutations = [
            lambda p: p["card"].update(sha256="0" * 64),
            lambda p: p["card"].update(netlist_hex="00"),
            lambda p: p["card"].update(chain_identity={"id": 1}),
            lambda p: p["card"].update(mode="unknown"),
            lambda p: p["rules"].update(profile="unknown"),
            lambda p: p["rules"].update(initial_state=True),
            lambda p: p["rules"].update(windows=[0, 0, 1, "1"]),
            lambda p: p["rules"].update(windows=[0, 1]),
            lambda p: p["prediction"].update(expected_request=1),
            lambda p: p["prediction"].update(trigger=True),
            lambda p: p.update(title=""),
            lambda p: p.update(unrecognized="field"),
        ]
        for mutate in mutations:
            pack = copy.deepcopy(example())
            mutate(pack)
            with self.subTest(pack=pack), self.assertRaises(ValueError):
                validate(pack)


if __name__ == "__main__":
    unittest.main()
