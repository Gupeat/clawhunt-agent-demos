#!/usr/bin/env python3
"""Synthetic four-module cross-border customs agent demo.

Modules:
  1. order/contract/product customs knowledge and contract checks
  2. ERP/DingTalk shipment backfill: BOM split, units, merged/partial declarations
  3. invoice/contract/declaration comparison + human-confirmed e-tax preview
  4. invoice backfill and remaining quantity; local-only reference flow

All data is synthetic. There is NO real ERP, DingTalk, e-tax bureau, or tax
submission call in this demo. The e-tax module only produces a preview and
refuses to "submit" without explicit human confirmation.
"""
from __future__ import annotations

import argparse
import csv
import json
import shutil
import sys
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "data"
CONFIG = ROOT / "config"
OUT = ROOT / "out"

REQUIRED_SHIPMENT = [
    "shipment_id", "order_id", "sku", "qty", "unit", "batch_no", "warehouse", "destination",
]
BACKFILL_FIELDS = [
    "shipment_id", "order_id", "source_sku", "source_qty", "source_unit", "batch_no",
    "warehouse", "destination", "component_sku", "declared_name", "hs_code",
    "declared_qty", "unit", "unit_price", "currency", "declaration_mode",
    "merge_group", "partial_seq", "partial_total", "merged_from",
]
EXCEPTION_FIELDS = ["shipment_id", "order_id", "source_sku", "reason", "missing_fields"]
VALIDATION_FIELDS = [
    "shipment_id", "order_id", "component_sku", "declared_name", "hs_code",
    "declared_qty", "unit", "unit_price", "batch_no", "warehouse", "destination",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def read_csv(path: Path) -> list:
    with Path(path).open("r", encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def write_csv(path: Path, rows: list, fields: list | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if fields is None:
        fields = list(rows[0].keys()) if rows else []
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow(row)


def write_json(path: Path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def read_json(path: Path):
    return json.loads(Path(path).read_text(encoding="utf-8"))


def num(value, default=0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def convert_qty(qty, unit: str, unit_table: dict) -> float:
    """Convert a quantity to pcs using the demo conversion table."""
    qty = num(qty)
    if unit == "pcs":
        return qty
    if unit not in unit_table or "pcs" not in unit_table[unit]:
        raise ValueError(f"unknown unit: {unit}")
    return qty * float(unit_table[unit]["pcs"])


def combo_sets(qty, unit: str, unit_table: dict) -> float:
    if unit == "set":
        return num(qty)
    if unit not in unit_table or "set" not in unit_table:
        raise ValueError(f"cannot convert combo unit: {unit}")
    return num(qty) * float(unit_table[unit]["pcs"]) / float(unit_table["set"]["pcs"])


def load_inputs(root: Path = ROOT) -> dict:
    data = Path(root) / "data"
    config = Path(root) / "config"
    products = {r["sku"]: r for r in read_csv(data / "products.csv")}
    orders = {r["order_id"]: r for r in read_csv(data / "orders.csv")}
    contracts = {r["contract_id"]: r for r in read_csv(data / "contracts.csv")}
    invoices = {r["invoice_id"]: r for r in read_csv(data / "invoices.csv")}
    invoice_lines = read_csv(data / "invoice_lines.csv")
    shipments = read_csv(data / "erp_shipments.csv")
    shipments_50 = read_csv(data / "erp_shipments_50.csv")
    bom = read_json(config / "bom.json")
    units = read_json(config / "unit_conversion.json")
    return {
        "products": products,
        "orders": orders,
        "contracts": contracts,
        "invoices": invoices,
        "invoice_lines": invoice_lines,
        "shipments": shipments,
        "shipments_50": shipments_50,
        "bom": bom,
        "units": units,
    }


def check_contracts(products: dict, orders: dict, contracts: dict, bom: dict) -> tuple:
    rows, new_products = [], []
    for order in orders.values():
        product = products.get(order["sku"])
        contract = contracts.get(order["contract_id"])
        issues = []
        if not product:
            issues.append("product_missing")
        if not contract:
            issues.append("contract_missing")
        elif contract.get("order_id") != order["order_id"]:
            issues.append("contract_order_mismatch")
        if product and order["sku"] not in bom:
            if product.get("status") == "new":
                issues.append("new_product_pending_confirmation")
            if not product.get("hs_code"):
                issues.append("hs_code_missing")
        if contract and abs(num(contract.get("total_amount")) - num(order["qty"]) * num(order["unit_price"])) > 0.01:
            issues.append("contract_amount_mismatch")
        rows.append({
            "order_id": order["order_id"],
            "contract_id": order["contract_id"],
            "sku": order["sku"],
            "product": product.get("name", "") if product else "",
            "hs_code": product.get("hs_code", "") if product else "",
            "status": "ok" if not issues else "needs_confirmation",
            "issues": ";".join(issues),
        })
    for product in products.values():
        if product["sku"] in bom:
            continue
        if product.get("status") == "new" or not product.get("hs_code"):
            new_products.append({
                "sku": product["sku"],
                "name": product["name"],
                "hs_code": product.get("hs_code", ""),
                "status": product.get("status", ""),
                "action": "wait_for_human_confirmation",
            })
    return rows, new_products


def build_backfill(shipments: list, products: dict, bom: dict, units: dict) -> dict:
    rows, exceptions = [], []
    for raw in shipments:
        missing = [k for k in REQUIRED_SHIPMENT if not str(raw.get(k, "")).strip()]
        if missing:
            exceptions.append({
                "shipment_id": raw.get("shipment_id", ""),
                "order_id": raw.get("order_id", ""),
                "source_sku": raw.get("sku", ""),
                "reason": "missing_required_field",
                "missing_fields": ",".join(missing),
            })
            continue

        sku = raw["sku"]
        product = products.get(sku)
        if not product:
            exceptions.append({
                "shipment_id": raw["shipment_id"],
                "order_id": raw["order_id"],
                "source_sku": sku,
                "reason": "product_missing",
                "missing_fields": "",
            })
            continue

        components = []
        try:
            if sku in bom:
                sets = combo_sets(raw["qty"], raw["unit"], units)
                for comp in bom[sku]:
                    cp = products.get(comp["sku"])
                    if not cp:
                        raise ValueError(f"component_missing:{comp['sku']}")
                    if cp.get("status") == "new" or not cp.get("hs_code"):
                        raise ValueError(f"component_pending_confirmation:{comp['sku']}")
                    components.append((cp, sets * num(comp["qty"]), "pcs"))
            else:
                if product.get("status") == "new" or not product.get("hs_code"):
                    raise ValueError("product_pending_confirmation")
                components.append((product, convert_qty(raw["qty"], raw["unit"], units), "pcs"))
        except ValueError as exc:
            exceptions.append({
                "shipment_id": raw["shipment_id"],
                "order_id": raw["order_id"],
                "source_sku": sku,
                "reason": str(exc),
                "missing_fields": "",
            })
            continue

        for cp, qty, unit in components:
            rows.append({
                "shipment_id": raw["shipment_id"],
                "order_id": raw["order_id"],
                "source_sku": sku,
                "source_qty": raw["qty"],
                "source_unit": raw["unit"],
                "batch_no": raw["batch_no"],
                "warehouse": raw["warehouse"],
                "destination": raw["destination"],
                "component_sku": cp["sku"],
                "declared_name": cp.get("declared_name") or cp["name"],
                "hs_code": cp["hs_code"],
                "declared_qty": qty,
                "unit": unit,
                "unit_price": cp.get("unit_price", ""),
                "currency": cp.get("currency", ""),
                "declaration_mode": raw.get("declaration_mode") or "normal",
                "merge_group": raw.get("merge_group", ""),
                "partial_seq": raw.get("partial_seq", ""),
                "partial_total": raw.get("partial_total", ""),
                "merged_from": "",
            })

    merged: dict = {}
    plain = []
    for row in rows:
        group = str(row.get("merge_group", "")).strip()
        if not group:
            plain.append(row)
            continue
        key = (group, row["component_sku"])
        if key not in merged:
            merged[key] = dict(row)
            merged[key]["merged_from"] = row["shipment_id"]
        else:
            merged[key]["declared_qty"] = num(merged[key]["declared_qty"]) + num(row["declared_qty"])
            merged[key]["source_qty"] = num(merged[key]["source_qty"]) + num(row["source_qty"])
            merged[key]["merged_from"] = merged[key]["merged_from"] + "+" + row["shipment_id"]
    plain.extend(merged.values())

    batch_groups = defaultdict(list)
    for row in plain:
        batch_groups[(row["order_id"], row["source_sku"], row["batch_no"])].append(row)
    return {
        "rows": plain,
        "exceptions": exceptions,
        "batch_groups": {f"{k[0]}|{k[1]}|{k[2]}": len(v) for k, v in batch_groups.items()},
    }


def validate_batches(rows: list, expected_batches: int = 50) -> dict:
    required = VALIDATION_FIELDS
    fields_checked = 0
    fields_ok = 0
    for row in rows:
        for field in required:
            fields_checked += 1
            value = row.get(field, "")
            if field in {"declared_qty"}:
                ok = str(value).strip() not in {"", "None"} and num(value) > 0
            else:
                ok = str(value).strip() not in {"", "None"}
            fields_ok += 1 if ok else 0
    consistency = (fields_ok / fields_checked) if fields_checked else 0.0
    batches = len({r.get("shipment_id") for r in rows})
    return {
        "batches_checked": batches,
        "expected_batches": expected_batches,
        "fields_checked": fields_checked,
        "field_consistency": round(consistency, 6),
        "pass": batches >= expected_batches and consistency >= 0.995,
    }


def compare_invoices(invoices: dict, invoice_lines: list, orders: dict, contracts: dict, products: dict) -> tuple:
    diffs, preview = [], []
    by_invoice = defaultdict(list)
    for line in invoice_lines:
        by_invoice[line["invoice_id"]].append(line)
    for invoice_id, lines in by_invoice.items():
        inv = invoices.get(invoice_id)
        if not inv:
            diffs.append({"invoice_id": invoice_id, "line_no": "", "status": "review", "differences": "invoice_missing"})
            continue
        order = orders.get(inv["order_id"])
        contract = contracts.get(order["contract_id"]) if order else None
        for line in lines:
            issues = []
            if not order:
                issues.append("order_missing")
            if not contract:
                issues.append("contract_missing")
            if contract:
                if inv.get("company") != contract.get("company"):
                    issues.append("company_mismatch")
                if inv.get("tax_id") != contract.get("tax_id"):
                    issues.append("tax_id_mismatch")
                if inv.get("currency") != contract.get("currency"):
                    issues.append("currency_mismatch")
            product = products.get(line["sku"])
            if not product:
                issues.append("product_missing")
            elif product.get("status") == "new" or (line["sku"] not in ("COMBO-A", "COMBO-B") and not product.get("hs_code")):
                issues.append("product_pending_confirmation")
            if order:
                if abs(num(line.get("unit_price")) - num(order.get("unit_price"))) > 0.01:
                    issues.append("unit_price_mismatch")
                if abs(num(line.get("amount")) - num(line.get("qty")) * num(line.get("unit_price"))) > 0.01:
                    issues.append("line_amount_mismatch")
            diffs.append({
                "invoice_id": invoice_id,
                "line_no": line["line_no"],
                "order_id": inv["order_id"],
                "sku": line["sku"],
                "status": "match" if not issues else "review",
                "differences": ";".join(issues),
            })
        invoice_issues = sorted({d["differences"] for d in diffs if d["invoice_id"] == invoice_id and d["differences"]})
        preview.append({
            "invoice_id": invoice_id,
            "invoice_no": inv.get("invoice_no", ""),
            "order_id": inv.get("order_id", ""),
            "status": "ready_pending_human" if not invoice_issues else "review_pending_human",
            "requires_human_confirmation": True,
            "auto_submit": False,
            "differences": invoice_issues,
        })
    return diffs, preview


def submit_etax(preview: list, confirmations: dict) -> dict:
    """Mock e-tax submission gate. No network, no real bureau call."""
    unconfirmed = [p["invoice_id"] for p in preview if not confirmations.get(p["invoice_id"])]
    if unconfirmed:
        return {
            "submitted": False,
            "mode": "mock",
            "reason": "human_confirmation_required",
            "unconfirmed": unconfirmed,
        }
    return {"submitted": True, "mode": "mock", "count": len(preview)}


def build_invoice_backfill(invoice_lines: list, invoices: dict, orders: dict, units: dict) -> tuple:
    rows = []
    totals = defaultdict(float)
    for line in invoice_lines:
        inv = invoices.get(line["invoice_id"])
        if not inv:
            continue
        order = orders.get(inv["order_id"])
        if not order:
            continue
        try:
            line_pcs = convert_qty(line["qty"], line["unit"], units)
            order_pcs = convert_qty(order["qty"], order["unit"], units)
        except ValueError:
            continue
        totals[order["order_id"]] += line_pcs
        rows.append({
            "invoice_id": line["invoice_id"],
            "line_no": line["line_no"],
            "order_id": order["order_id"],
            "sku": line["sku"],
            "invoiced_qty": line["qty"],
            "unit": line["unit"],
            "invoiced_pcs": line_pcs,
            "order_qty_pcs": order_pcs,
            "remaining_pcs": max(order_pcs - totals[order["order_id"]], 0.0),
            "status": "partial" if totals[order["order_id"]] < order_pcs else "fully_invoiced",
        })
    remaining = []
    for order in orders.values():
        order_pcs = convert_qty(order["qty"], order["unit"], units)
        rem = max(order_pcs - totals.get(order["order_id"], 0.0), 0.0)
        remaining.append({
            "order_id": order["order_id"],
            "sku": order["sku"],
            "order_qty": order["qty"],
            "unit": order["unit"],
            "order_qty_pcs": order_pcs,
            "invoiced_pcs": totals.get(order["order_id"], 0.0),
            "remaining_pcs": rem,
            "status": "open" if rem > 0 else "closed",
        })
    return rows, remaining


def dump_demo(root: Path = ROOT) -> dict:
    root = Path(root)
    out = root / "out"
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True, exist_ok=True)
    data = load_inputs(root)

    contract_rows, new_products = check_contracts(data["products"], data["orders"], data["contracts"], data["bom"])
    write_csv(out / "contract_check.csv", contract_rows)
    write_csv(out / "new_products.csv", new_products)

    backfill = build_backfill(data["shipments"], data["products"], data["bom"], data["units"])
    write_csv(out / "backfill.csv", backfill["rows"], BACKFILL_FIELDS)
    write_csv(out / "exceptions.csv", backfill["exceptions"], EXCEPTION_FIELDS)

    backfill_50 = build_backfill(data["shipments_50"], data["products"], data["bom"], data["units"])
    batch_validation = validate_batches(backfill_50["rows"], 50)
    write_csv(out / "backfill_50.csv", backfill_50["rows"], BACKFILL_FIELDS)

    diffs, preview = compare_invoices(data["invoices"], data["invoice_lines"], data["orders"], data["contracts"], data["products"])
    write_csv(out / "invoice_diff.csv", diffs)
    write_json(out / "etax_preview.json", preview)
    submission_blocked = submit_etax(preview, {})
    write_json(out / "etax_submission_blocked.json", submission_blocked)

    backfill_rows, remaining = build_invoice_backfill(data["invoice_lines"], data["invoices"], data["orders"], data["units"])
    write_csv(out / "invoice_backfill.csv", backfill_rows)
    write_csv(out / "remaining_qty.csv", remaining)

    checks = {
        "module1_contract_check": len(contract_rows) > 0 and any(r["status"] == "needs_confirmation" for r in contract_rows),
        "module1_new_product_gate": len(new_products) > 0,
        "module2_50_batches": batch_validation["pass"],
        "module2_missing_field_is_exception": any(e["shipment_id"] == "SHP-2011" for e in backfill["exceptions"]),
        "module2_merged_declaration": any("+" in r.get("merged_from", "") for r in backfill["rows"]),
        "module3_human_gate_blocks": submission_blocked["submitted"] is False,
        "module3_tax_diff_detected": any("tax_id_mismatch" in d["differences"] for d in diffs),
        "module4_partial_remaining": any(r["order_id"] == "ORD-1004" and abs(num(r["remaining_pcs"]) - 60) < 0.01 for r in remaining),
    }
    validation = {
        "demo": "customs-agent",
        "generated_at": now_iso(),
        "module2": batch_validation,
        "module3": {
            "invoices_checked": len(preview),
            "submission": submission_blocked,
            "human_confirmation_required": all(p["requires_human_confirmation"] for p in preview),
        },
        "module4": {"orders": len(remaining), "open_orders": sum(1 for r in remaining if r["status"] == "open")},
        "checks": checks,
    }
    write_json(out / "validation.json", validation)
    write_json(out / "ACCEPTANCE.json", {
        "demo": "customs-agent",
        "module1": "contract_check.csv + new_products.csv",
        "module2": "backfill.csv + exceptions.csv + backfill_50.csv + validation.json",
        "module3": "invoice_diff.csv + etax_preview.json + etax_submission_blocked.json",
        "module4": "invoice_backfill.csv + remaining_qty.csv",
        "human_gate": "etax_submit refuses without explicit confirmations; no network call exists",
    })
    (out / "validation.log").write_text(
        "\n".join([
            "customs-agent demo",
            "module2 batches=" + str(batch_validation["batches_checked"]),
            "module2 consistency=" + str(batch_validation["field_consistency"]),
            "module2 exceptions=" + str(len(backfill["exceptions"])),
            "module3 submission_blocked=" + str(submission_blocked["submitted"] is False),
            "module4 checks=" + json.dumps(checks, ensure_ascii=False),
        ]) + "\n",
        encoding="utf-8",
    )
    return validation


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Synthetic four-module customs agent demo")
    sub = p.add_subparsers(dest="command", required=True)
    sub.add_parser("demo", help="run all four modules on synthetic data")
    return p


def main(argv=None) -> int:
    args = build_parser().parse_args(argv)
    if args.command == "demo":
        validation = dump_demo(ROOT)
        print(json.dumps({"checks": validation["checks"], "module2": validation["module2"]}, ensure_ascii=False, indent=2))
        return 0 if all(validation["checks"].values()) else 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
