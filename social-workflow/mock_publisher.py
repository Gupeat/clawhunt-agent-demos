"""Deterministic mock publisher for the social workflow demo.

No network calls. Failure modes are intentionally reproducible:
- asset-006 is treated as deleted by the platform;
- fb-beta is rate-limited on its first publish attempt.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path


def _load(path: Path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def _save(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def publish(root: Path, draft: dict, account: dict, attempt: int) -> dict:
    """Publish one draft, idempotently, into a local JSON ledger."""
    root = Path(root)
    ledger_path = root / "state" / "published.json"
    ledger = _load(ledger_path, {})
    key = draft["idempotency_key"]

    if key in ledger:
        return {
            "status": "success",
            "published_id": ledger[key]["published_id"],
            "idempotent": True,
        }

    if draft.get("asset_id") == "asset-006":
        return {
            "status": "failed",
            "error": "platform_deleted_post",
            "retryable": False,
        }

    if account.get("account_id") == "fb-beta" and attempt == 1:
        return {
            "status": "failed",
            "error": "rate_limited",
            "retryable": True,
        }

    published_id = "mock-" + hashlib.sha256(key.encode("utf-8")).hexdigest()[:10]
    ledger[key] = {
        "published_id": published_id,
        "draft_id": draft["draft_id"],
        "account_id": draft["account_id"],
        "asset_id": draft["asset_id"],
        "published_at": draft.get("scheduled_at"),
    }
    _save(ledger_path, ledger)
    return {"status": "success", "published_id": published_id, "idempotent": False}
