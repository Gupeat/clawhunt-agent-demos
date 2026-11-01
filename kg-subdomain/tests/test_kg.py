import copy
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

import kg


class KnowledgeGraphTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.graph = kg.load_json(ROOT / "data" / "sample_graph.json")
        cls.schema = kg.load_json(ROOT / "schema.json")

    def test_01_sample_graph_is_valid(self):
        self.assertEqual(kg.validate_graph(self.graph, self.schema), [])
        self.assertEqual(len(self.graph["entities"]), 6)
        self.assertEqual(len(self.graph["relations"]), 10)

    def test_02_missing_evidence_is_rejected(self):
        broken = copy.deepcopy(self.graph)
        broken["relations"][0]["evidence"] = []
        errors = kg.validate_graph(broken, self.schema)
        self.assertTrue(any("evidence" in error for error in errors), errors)

    def test_03_dangling_relation_is_rejected(self):
        broken = copy.deepcopy(self.graph)
        broken["relations"][0]["to"] = "E-MISSING-999"
        errors = kg.validate_graph(broken, self.schema)
        self.assertTrue(any("dangling" in error for error in errors), errors)

    def test_04_entity_query_returns_incident_relations_with_evidence(self):
        result = kg.entity_view(self.graph, "E-SUP-001")
        self.assertIsNotNone(result)
        self.assertGreaterEqual(result["relation_count"], 3)
        for relation in result["relations"]:
            self.assertTrue(relation["evidence"])
            self.assertTrue(relation["evidence"][0]["source_id"])
            self.assertIn("://", relation["evidence"][0]["locator"])

    def test_05_multi_hop_path_query_is_traceable(self):
        result = kg.find_path(self.graph, "E-MAT-002", "E-DEP-001")
        self.assertTrue(result["found"])
        self.assertGreaterEqual(len(result["nodes"]), 3)
        self.assertEqual(result["nodes"][0], "E-MAT-002")
        self.assertEqual(result["nodes"][-1], "E-DEP-001")
        self.assertTrue(result["relations"])


if __name__ == "__main__":
    unittest.main()
