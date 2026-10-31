from __future__ import annotations

import json
import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))

import mock_publisher  # noqa: E402
from workflow import Workflow  # noqa: E402


class WorkflowTests(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        self.root = Path(self.tmpdir.name)
        shutil.copy2(REPO / "accounts.json", self.root / "accounts.json")
        shutil.copytree(REPO / "assets", self.root / "assets")
        self.wf = Workflow(self.root)

    def tearDown(self):
        self.tmpdir.cleanup()

    def test_generate_requires_human_review(self):
        drafts = self.wf.generate("2026-11-01", 2)
        self.assertEqual(len(drafts), 6)
        self.assertTrue(all(d["status"] == "pending_review" for d in drafts))
        self.assertEqual(self.wf.publish(), [])
        self.assertEqual(self.wf.insights()["published"], 0)

    def test_reject_is_not_published(self):
        self.wf.generate("2026-11-01", 2)
        self.wf.review("d-0001", "approve")
        self.wf.review("d-0002", "reject")
        results = dict(self.wf.publish())
        self.assertEqual(results["d-0001"]["status"], "success")
        self.assertNotIn("d-0002", results)
        drafts = {d["draft_id"]: d for d in self.wf.load_drafts()}
        self.assertEqual(drafts["d-0001"]["status"], "published")
        self.assertEqual(drafts["d-0002"]["status"], "rejected")

    def test_rate_limit_retry_and_idempotency(self):
        self.wf.generate("2026-11-01", 2)
        self.wf.review("d-0004", "approve")
        first = dict(self.wf.publish())["d-0004"]
        self.assertEqual(first["status"], "failed")
        self.assertEqual(first["error"], "rate_limited")
        second = dict(self.wf.republish())["d-0004"]
        self.assertEqual(second["status"], "success")
        ledger = json.loads((self.root / "state" / "published.json").read_text(encoding="utf-8"))
        key = next(iter(ledger))
        draft = next(d for d in self.wf.load_drafts() if d["draft_id"] == "d-0004")
        again = mock_publisher.publish(self.root, draft, self.wf.accounts_by_id["fb-beta"], 2)
        self.assertTrue(again["idempotent"])
        self.assertEqual(again["published_id"], ledger[key]["published_id"])
        self.assertEqual(len(ledger), 1)

    def test_deleted_post_fails_permanently(self):
        self.wf.generate("2026-11-01", 2)
        self.wf.review("d-0002", "approve")
        first = dict(self.wf.publish())["d-0002"]
        self.assertEqual(first["status"], "failed")
        self.assertEqual(first["error"], "platform_deleted_post")
        second = dict(self.wf.republish())["d-0002"]
        self.assertEqual(second["status"], "failed")
        self.assertFalse(second["retryable"])

    def test_insights_counts_by_account(self):
        self.wf.generate("2026-11-01", 2)
        for draft_id in ("d-0001", "d-0005"):
            self.wf.review(draft_id, "approve")
        self.wf.publish()
        metrics = self.wf.insights()
        self.assertEqual(metrics["published"], 2)
        self.assertEqual(metrics["by_account"]["fb-alpha"]["published"], 1)
        self.assertEqual(metrics["by_account"]["fb-gamma"]["published"], 1)
        self.assertEqual(metrics["total_drafts"], 6)

    def test_full_demo_checks(self):
        validation = self.wf.demo("2026-11-01", 2)
        self.assertTrue(all(validation["checks"].values()), validation["checks"])
        self.assertEqual(validation["final"]["published"], 3)
        self.assertEqual(validation["final"]["failed"], 1)
        self.assertTrue((self.root / "out" / "metrics_feedback.json").exists())
        self.assertTrue((self.root / "out" / "ACCEPTANCE.json").exists())


if __name__ == "__main__":
    unittest.main()
