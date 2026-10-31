#!/usr/bin/env python3
"""Synthetic Facebook matrix workflow demo.

This is a local, no-network demonstration of:
  generate drafts -> human review -> mock publish -> failure recovery -> metrics.

It is deliberately not a real social-media autoposter. Accounts are placeholders,
assets are synthetic, and all publishing is written to a local mock ledger.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

import mock_publisher

ROOT = Path(__file__).resolve().parent
TZ = timezone(timedelta(hours=8))
DEFAULT_DATE = "2026-11-01"


def now_iso() -> str:
    return datetime.now(TZ).replace(microsecond=0).isoformat()


def load_json(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def append_jsonl(path: Path, row: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(row, ensure_ascii=False) + "\n")


class Workflow:
    def __init__(self, root: Path = ROOT):
        self.root = Path(root)
        self.state = self.root / "state"
        self.out = self.root / "out"
        self.assets_dir = self.root / "assets"
        self.drafts_path = self.state / "drafts.json"
        self.review_path = self.state / "review_queue.json"
        self.publish_log_path = self.state / "publish_log.jsonl"
        self.accounts = load_json(self.root / "accounts.json", [])
        self.assets = load_json(self.assets_dir / "asset_manifest.json", [])
        self.accounts_by_id = {a["account_id"]: a for a in self.accounts}
        self.assets_by_id = {a["asset_id"]: a for a in self.assets}

    def reset(self) -> None:
        for path in (self.state, self.out):
            if path.exists():
                shutil.rmtree(path)
        self.state.mkdir(parents=True, exist_ok=True)
        self.out.mkdir(parents=True, exist_ok=True)

    def load_drafts(self) -> list:
        return load_json(self.drafts_path, [])

    def save_drafts(self, drafts: list) -> None:
        save_json(self.drafts_path, drafts)
        self.rebuild_review_queue(drafts)

    def rebuild_review_queue(self, drafts: list) -> None:
        queue = [
            {
                "draft_id": d["draft_id"],
                "account_id": d["account_id"],
                "asset_id": d["asset_id"],
                "scheduled_at": d["scheduled_at"],
                "text": d["text"],
            }
            for d in drafts
            if d["status"] == "pending_review"
        ]
        save_json(self.review_path, queue)

    def generate(self, date: str = DEFAULT_DATE, per_account: int = 2) -> list:
        if not self.accounts or not self.assets:
            raise RuntimeError("accounts.json or assets/asset_manifest.json missing")
        if per_account < 1 or per_account > 3:
            raise ValueError("per_account must be 1..3 (daily cadence in the brief)")
        drafts = []
        seq = 1
        for ai, account in enumerate(self.accounts):
            for i in range(per_account):
                asset = self.assets[(ai * per_account + i) % len(self.assets)]
                scheduled = (
                    datetime.fromisoformat(date + "T09:00:00+08:00")
                    + timedelta(hours=ai * 2 + i)
                ).isoformat()
                idem = hashlib.sha256(
                    f"{account['account_id']}|{asset['asset_id']}|{scheduled}".encode("utf-8")
                ).hexdigest()[:16]
                drafts.append(
                    {
                        "draft_id": f"d-{seq:04d}",
                        "account_id": account["account_id"],
                        "account_name": account["name"],
                        "asset_id": asset["asset_id"],
                        "text": f"[{account['name']}] {asset['hook']}\n{asset['body']}\n#跨境 #供应链",
                        "scheduled_at": scheduled,
                        "status": "pending_review",
                        "idempotency_key": idem,
                        "attempts": 0,
                        "review": None,
                        "published_id": None,
                        "published_at": None,
                        "last_error": None,
                    }
                )
                seq += 1
        self.save_drafts(drafts)
        return drafts

    def review(self, draft_id: str, decision: str, note: str = "") -> dict:
        if decision not in {"approve", "reject", "edit"}:
            raise ValueError("decision must be approve, reject, or edit")
        drafts = self.load_drafts()
        draft = next((d for d in drafts if d["draft_id"] == draft_id), None)
        if not draft:
            raise KeyError(f"draft not found: {draft_id}")
        if draft["status"] != "pending_review":
            raise RuntimeError(f"draft {draft_id} is {draft['status']}, not pending_review")
        if decision == "approve":
            draft["status"] = "approved"
        elif decision == "reject":
            draft["status"] = "rejected"
        else:
            draft["status"] = "pending_review"
        draft["review"] = {"decision": decision, "note": note, "reviewed_at": now_iso()}
        self.save_drafts(drafts)
        return draft

    def publish(self) -> list:
        drafts = self.load_drafts()
        approved = [d for d in drafts if d["status"] == "approved"]
        results = []
        for draft in approved:
            draft["attempts"] += 1
            result = mock_publisher.publish(
                self.root,
                draft,
                self.accounts_by_id[draft["account_id"]],
                draft["attempts"],
            )
            draft["last_result"] = result
            if result["status"] == "success":
                draft["status"] = "published"
                draft["published_id"] = result["published_id"]
                draft["published_at"] = now_iso()
                draft["last_error"] = None
            else:
                draft["status"] = "failed"
                draft["last_error"] = result["error"]
            append_jsonl(
                self.publish_log_path,
                {
                    "logged_at": now_iso(),
                    "draft_id": draft["draft_id"],
                    "account_id": draft["account_id"],
                    "attempt": draft["attempts"],
                    "result": result,
                },
            )
            results.append((draft["draft_id"], result))
        self.save_drafts(drafts)
        return results

    def republish(self, max_attempts: int = 3) -> list:
        drafts = self.load_drafts()
        for draft in drafts:
            if draft["status"] == "failed" and draft["attempts"] < max_attempts:
                draft["status"] = "approved"
        self.save_drafts(drafts)
        return self.publish()

    def insights(self) -> dict:
        drafts = self.load_drafts()
        by_account = {}
        for draft in drafts:
            row = by_account.setdefault(
                draft["account_id"],
                {"drafts": 0, "published": 0, "failed": 0, "pending": 0, "rejected": 0},
            )
            row["drafts"] += 1
            key = {
                "published": "published",
                "failed": "failed",
                "pending_review": "pending",
                "approved": "pending",
                "rejected": "rejected",
            }.get(draft["status"], "pending")
            row[key] += 1
        published = sum(1 for d in drafts if d["status"] == "published")
        failed = sum(1 for d in drafts if d["status"] == "failed")
        pending = sum(1 for d in drafts if d["status"] in {"pending_review", "approved"})
        rejected = sum(1 for d in drafts if d["status"] == "rejected")
        metrics = {
            "generated_at": now_iso(),
            "published": published,
            "failed": failed,
            "pending": pending,
            "rejected": rejected,
            "total_drafts": len(drafts),
            "by_account": by_account,
            "rows": [
                {
                    "draft_id": d["draft_id"],
                    "account_id": d["account_id"],
                    "asset_id": d["asset_id"],
                    "status": d["status"],
                    "attempts": d["attempts"],
                    "published_id": d.get("published_id"),
                    "last_error": d.get("last_error"),
                }
                for d in drafts
            ],
        }
        save_json(self.out / "metrics_feedback.json", metrics)
        return metrics

    def demo(self, date: str = DEFAULT_DATE, per_account: int = 2) -> dict:
        self.reset()
        self.generate(date, per_account)
        for draft_id in ("d-0001", "d-0002", "d-0003", "d-0004"):
            self.review(draft_id, "approve", "demo: approved after human review")
        self.review("d-0005", "reject", "demo: off-brand angle rejected")
        first = self.publish()
        second = self.republish()
        metrics = self.insights()
        validation = {
            "demo": "social-workflow",
            "generated_at": now_iso(),
            "drafts": len(self.load_drafts()),
            "first_publish": first,
            "republish": second,
            "final": {
                "published": metrics["published"],
                "failed": metrics["failed"],
                "pending": metrics["pending"],
                "rejected": metrics["rejected"],
            },
            "checks": {
                "unreviewed_not_published": metrics["pending"] == 1,
                "rejected_not_published": metrics["rejected"] == 1,
                "rate_limit_recovered": any(
                    d["draft_id"] == "d-0004" and d["status"] == "published"
                    for d in self.load_drafts()
                ),
                "deleted_post_failed": any(
                    d["draft_id"] == "d-0002" and d["status"] == "failed"
                    for d in self.load_drafts()
                ),
                "no_duplicate_success": metrics["published"] == 3,
            },
        }
        save_json(self.out / "validation.json", validation)
        save_json(
            self.out / "ACCEPTANCE.json",
            {
                "demo": "social-workflow",
                "mapping": {
                    "draft generation": "workflow.py generate / state/drafts.json",
                    "human review gate": "workflow.py review / state/review_queue.json",
                    "mock publish": "mock_publisher.py / state/published.json",
                    "failure recovery": "workflow.py republish / state/publish_log.jsonl",
                    "metrics feedback": "out/metrics_feedback.json",
                    "cost basis": "RUN_COST.md",
                },
                "status": "demo passed" if all(validation["checks"].values()) else "demo FAILED",
            },
        )
        lines = [
            "social-workflow demo",
            "date=" + date,
            "drafts=" + str(len(self.load_drafts())),
            "published=" + str(metrics["published"]),
            "failed=" + str(metrics["failed"]),
            "pending=" + str(metrics["pending"]),
            "rejected=" + str(metrics["rejected"]),
        ]
        (self.out / "validation.log").write_text("\n".join(lines) + "\n", encoding="utf-8")
        return validation


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Synthetic social matrix workflow demo")
    sub = p.add_subparsers(dest="command", required=True)
    gen = sub.add_parser("generate", help="create drafts for human review")
    gen.add_argument("--date", default=DEFAULT_DATE)
    gen.add_argument("--per-account", type=int, default=2)
    rev = sub.add_parser("review", help="approve/reject a draft")
    rev.add_argument("draft_id")
    rev.add_argument("decision", choices=["approve", "reject", "edit"])
    rev.add_argument("--note", default="")
    sub.add_parser("publish", help="publish approved drafts")
    sub.add_parser("republish", help="retry retryable failed drafts")
    sub.add_parser("insights", help="write out/metrics_feedback.json")
    demo = sub.add_parser("demo", help="run the complete synthetic demo")
    demo.add_argument("--date", default=DEFAULT_DATE)
    demo.add_argument("--per-account", type=int, default=2)
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    wf = Workflow(ROOT)
    if args.command == "generate":
        drafts = wf.generate(args.date, args.per_account)
        print(f"generated {len(drafts)} drafts; review with: python workflow.py review <id> approve")
    elif args.command == "review":
        d = wf.review(args.draft_id, args.decision, args.note)
        print(f"{d['draft_id']} -> {d['status']}")
    elif args.command == "publish":
        for draft_id, result in wf.publish():
            print(draft_id, result["status"], result.get("error", ""))
    elif args.command == "republish":
        for draft_id, result in wf.republish():
            print(draft_id, result["status"], result.get("error", ""))
    elif args.command == "insights":
        m = wf.insights()
        print(json.dumps({k: m[k] for k in ("published", "failed", "pending", "rejected")}, indent=2))
    elif args.command == "demo":
        v = wf.demo(args.date, args.per_account)
        print(json.dumps({"checks": v["checks"], "final": v["final"]}, indent=2))
        return 0 if all(v["checks"].values()) else 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
