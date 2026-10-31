from __future__ import annotations

import shutil
import sys
import tempfile
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO))

import customs_agent as ca  # noqa: E402


class CustomsAgentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.inp = ca.load_inputs(REPO)

    def _find(self, rows, shipment_id, component_sku):
        return next(
            r for r in rows
            if r["shipment_id"] == shipment_id and r["component_sku"] == component_sku
        )

    def test_bom_split_and_unit_conversion(self):
        result = ca.build_backfill(self.inp["shipments"], self.inp["products"], self.inp["bom"], self.inp["units"])
        self.assertEqual(self._find(result["rows"], "SHP-2001", "SKU-001")["declared_qty"], 20)
        self.assertEqual(self._find(result["rows"], "SHP-2001", "SKU-002")["declared_qty"], 10)
        self.assertEqual(self._find(result["rows"], "SHP-2003", "SKU-002")["declared_qty"], 1200)
        self.assertEqual(self._find(result["rows"], "SHP-2004", "SKU-001")["declared_qty"], 100)

    def test_missing_field_goes_to_exception(self):
        result = ca.build_backfill(self.inp["shipments"], self.inp["products"], self.inp["bom"], self.inp["units"])
        exception = next(e for e in result["exceptions"] if e["shipment_id"] == "SHP-2011")
        self.assertIn("destination", exception["missing_fields"])
        self.assertFalse(any(r["shipment_id"] == "SHP-2011" for r in result["rows"]))

    def test_merged_group_combines_components(self):
        result = ca.build_backfill(self.inp["shipments"], self.inp["products"], self.inp["bom"], self.inp["units"])
        merged = next(r for r in result["rows"] if r["merge_group"] == "M-1" and r["component_sku"] == "SKU-002")
        self.assertEqual(merged["declared_qty"], 5)
        self.assertIn("SHP-2007", merged["merged_from"])
        self.assertIn("SHP-2008", merged["merged_from"])

    def test_partial_declaration_preserves_sequence(self):
        result = ca.build_backfill(self.inp["shipments"], self.inp["products"], self.inp["bom"], self.inp["units"])
        partial = [r for r in result["rows"] if r["declaration_mode"] == "partial"]
        self.assertEqual({r["partial_seq"] for r in partial}, {"1", "2"})
        self.assertTrue(all(r["partial_total"] == "2" for r in partial))

    def test_50_batch_consistency(self):
        result = ca.build_backfill(self.inp["shipments_50"], self.inp["products"], self.inp["bom"], self.inp["units"])
        validation = ca.validate_batches(result["rows"], 50)
        self.assertTrue(validation["pass"], validation)
        self.assertEqual(validation["batches_checked"], 50)
        self.assertGreaterEqual(validation["field_consistency"], 0.995)

    def test_invoice_diff_and_tax_mismatch(self):
        diffs, preview = ca.compare_invoices(
            self.inp["invoices"], self.inp["invoice_lines"], self.inp["orders"],
            self.inp["contracts"], self.inp["products"],
        )
        inv3 = [d for d in diffs if d["invoice_id"] == "INV-003"]
        self.assertTrue(inv3)
        self.assertTrue(any("tax_id_mismatch" in d["differences"] for d in inv3))
        self.assertTrue(all(p["requires_human_confirmation"] for p in preview))

    def test_etax_requires_explicit_human_confirmation(self):
        _, preview = ca.compare_invoices(
            self.inp["invoices"], self.inp["invoice_lines"], self.inp["orders"],
            self.inp["contracts"], self.inp["products"],
        )
        blocked = ca.submit_etax(preview, {})
        self.assertFalse(blocked["submitted"])
        self.assertEqual(blocked["reason"], "human_confirmation_required")
        confirmed = {p["invoice_id"]: True for p in preview}
        submitted = ca.submit_etax(preview, confirmed)
        self.assertTrue(submitted["submitted"])
        self.assertEqual(submitted["mode"], "mock")

    def test_remaining_quantity(self):
        _, remaining = ca.build_invoice_backfill(
            self.inp["invoice_lines"], self.inp["invoices"], self.inp["orders"], self.inp["units"],
        )
        ord1004 = next(r for r in remaining if r["order_id"] == "ORD-1004")
        self.assertAlmostEqual(ord1004["remaining_pcs"], 60)
        self.assertEqual(ord1004["status"], "open")
        ord1001 = next(r for r in remaining if r["order_id"] == "ORD-1001")
        self.assertAlmostEqual(ord1001["remaining_pcs"], 0)

    def test_contract_and_new_product_gate(self):
        rows, new_products = ca.check_contracts(
            self.inp["products"], self.inp["orders"], self.inp["contracts"], self.inp["bom"],
        )
        self.assertTrue(any(r["status"] == "needs_confirmation" for r in rows))
        self.assertTrue(any(p["sku"] == "SKU-004" for p in new_products))

    def test_full_demo_runs(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            shutil.copytree(REPO / "data", root / "data")
            shutil.copytree(REPO / "config", root / "config")
            validation = ca.dump_demo(root)
            self.assertTrue(all(validation["checks"].values()), validation["checks"])
            self.assertTrue((root / "out" / "validation.json").exists())


if __name__ == "__main__":
    unittest.main()
