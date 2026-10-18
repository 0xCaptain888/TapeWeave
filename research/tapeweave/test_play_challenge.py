import copy
from itertools import product
import json
from pathlib import Path
import tempfile
import unittest

from challenge_package import example
from export_reference_bundle import build
from play_challenge import load_package, play_package


class ReplayTests(unittest.TestCase):
    def test_all_1024_trajectories(self):
        ref = build()
        for card in ref["cards"]:
            for challenge in ref["challenges"]:
                pack = example()
                pack["card"] = {k: card[k] for k in pack["card"]}
                pack["rules"].update(world=challenge["world"], windows=list(challenge["windows"]))
                t = card["transitions"][0]
                pack["prediction"].update(old_state=t["old_state"], trigger=t["trigger"], recharge=t["recharge"],
                                           expected_request=t["request"], expected_next_state=t["next_state"])
                for actions in product((0, 1), repeat=4):
                    actual = play_package(pack, list(actions))
                    normal = play_package(pack, list(actions), True)
                    self.assertEqual(actual["trace"], normal["trace"])
                    self.assertEqual(actual["score"], normal["score"])
                    self.assertLessEqual(actual["score"], actual["system_reference_score"])
                optimal = challenge["optimal_reference"][card["mode"]]
                self.assertEqual(play_package(pack, list(optimal["actions"]))["trace"], optimal["trace"])

    def test_repeat_does_not_mutate(self):
        pack = example()
        original = copy.deepcopy(pack)
        result = play_package(pack, [0, 1, 0, 1])
        self.assertEqual(result, play_package(pack, [0, 1, 0, 1]))
        self.assertEqual(pack, original)
        self.assertEqual(play_package(pack, [1, 0, 0, 0])["trace"][0]["request"], 0)

    def test_invalid_actions(self):
        for actions in ([True, 0, 1, 1], [0, "1", 0, 1], [0, 1], [0, 1, 2, 0]):
            with self.assertRaises(ValueError):
                play_package(example(), actions)

    def test_file_limits_and_duplicates(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "package.json"
            for text in ('{"schema":1,"schema":2}', 'x' * 65537):
                path.write_text(text)
                with self.assertRaises(ValueError):
                    load_package(path)
            path.write_text(json.dumps(example()))
            self.assertEqual(load_package(path), example())


if __name__ == "__main__":
    unittest.main()
