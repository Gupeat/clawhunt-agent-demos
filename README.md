# Agent workflow demos

Two small, self-contained reference implementations for recent ClawHunt briefs:

| Demo | Brief | What it proves |
|---|---|---|
| [`social-workflow/`](social-workflow/) | #1539, overseas social-media lead-gen workflow | Draft -> human review -> mock publish -> failure recovery -> metrics feedback, with idempotency and a hard review gate |
| [`customs-agent/`](customs-agent/) | #1364, cross-border customs automation | BOM split, unit conversion, 50-batch consistency, invoice/tax comparison, e-tax human gate, remaining quantity |

Both are standard-library Python, run offline, and use synthetic data. They are **evidence of process and boundaries**, not production systems.

## Quick start

Requires Python 3.10+; no third-party packages.

```bash
# social workflow
cd social-workflow
python workflow.py demo
python -m unittest discover -s tests -v

# customs agent
cd ../customs-agent
python customs_agent.py demo
python -m unittest discover -s tests -v
```

## What each demo outputs

### Social workflow

`out/validation.json` checks the important invariants:

```json
{
  "unreviewed_not_published": true,
  "rejected_not_published": true,
  "rate_limit_recovered": true,
  "deleted_post_failed": true,
  "no_duplicate_success": true
}
```

The run ends with 3 published posts, 1 permanent failure, 1 pending review and 1 rejected item. `fb-beta` hits a simulated rate limit and recovers; `asset-006` is deleted on the platform and is not retried forever. The mock publisher keeps an idempotency ledger so a successful publish is never duplicated.

### Customs agent

`out/validation.json` checks module 1 (contract/new-product gate), module 2 (50-batch backfill, missing-field exception, merged declaration), module 3 (tax difference + human gate) and module 4 (remaining invoice quantity):

- 50 batches, 550 fields, field consistency 1.0 in the synthetic set (acceptance target: >= 99.5%);
- combo products split by BOM into component declarations;
- set/box/pcs conversion handled by config;
- missing fields go to an exception table, not a guessed declaration;
- e-tax submission returns `human_confirmation_required` until every preview is explicitly confirmed;
- invoice backfill leaves ORD-1004 with 60 pcs remaining.

## Repository layout

```text
.github/workflows/ci.yml   # offline test matrix
social-workflow/            # demo 1
customs-agent/              # demo 2
.gitignore
LICENSE
README.md
```

## Design boundaries

- No real Facebook accounts, ERP, DingTalk, e-tax endpoint, API key or customer data.
- No network calls in either demo.
- The e-tax path is preview-only and deliberately blocks unattended submission.
- The 50-batch result is synthetic. It is not evidence that a real 50-batch customer dataset has passed 99.5% acceptance.
- Both demos are intentionally narrow: they show the control flow and artifacts the brief asks for, not a full production integration.

## Test evidence

| Suite | Tests | Result |
|---|---:|---|
| `social-workflow/tests/test_workflow.py` | 6 | pass |
| `customs-agent/tests/test_customs_agent.py` | 10 | pass |

## License

MIT. See [LICENSE](LICENSE).
