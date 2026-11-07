# Agent demos

Seven browser-only demos in [`docs/`](docs/) plus two offline Python references.
The static pages are the proposal evidence for the current ClawHunt briefs; the
Python references show the same control flow as runnable, test-backed code.

## Browser demos

| Demo | Brief | What it proves |
|---|---|---|
| [Rider recruitment OS](docs/rider/) | #1804–#1808 | five deliverables on one contract: agent slots/citations/de-id, H5 funnel, workbench state machine/concurrency, 7 KPIs/config review, vault/audit/RBAC |
| [GEO visibility](`docs/geo/`) | #1365 | 6-platform monitoring, citation evidence, variance and extraction checks |
| [Recruiting Voice AI](`docs/voice/`) | #1639 | state machine, silence/barge-in, API failure fallback, scorecard and 12 QA rows |
| [Shopping assistant](`docs/shopping/`) | #1339 | grounded C-end answers, compliance scanning, structured B-end response |
| [Customs automation](`docs/customs/`) | #1364 | HS/BOM split, missing-field gate, invoice diff, archive, 50-batch replay |
| [Spreadsheet cleanup](`docs/sheet/`) | #1462 | field rules, dedupe, CSV delivery, exception list, 10 checks |
| [Social matrix](`docs/social/`) | #1539 | approval gate, 429 recovery with idempotency, feedback, cost split |
| [Industry AI (extra)](`docs/industry/`) | #1724 | configurable rules, C2M ledger, IP/license pipeline |

Open [`docs/index.html`](docs/index.html) or the GitHub Pages hub. Everything in
`docs/` is pure HTML/CSS/JS: no backend, no API keys, synthetic data only.

## Python references

| Demo | Brief | What it proves |
|---|---|---|
| [`social-workflow/`](social-workflow/) | #1539 | same workflow as a standard-library Python reference |
| [`customs-agent/`](customs-agent/) | #1364 | same customs control flow as a standard-library Python reference |

Both Python demos run offline and use synthetic data. They are **evidence of
process and boundaries**, not production systems.

## Quick start

Browser demos: serve `docs/` and open the hub.

```bash
python -m http.server 8799
# http://127.0.0.1:8799/docs/
```

Python references require Python 3.10+; no third-party packages.

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

## What each Python demo outputs

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
docs/                       # seven static browser demos + hub
social-workflow/            # Python reference: social workflow
customs-agent/              # Python reference: customs automation
.gitignore
LICENSE
README.md
```

## Design boundaries

- No real Facebook accounts, ERP, DingTalk, e-tax endpoint, API key or customer data.
- No network calls in any demo.
- The e-tax path is preview-only and deliberately blocks unattended submission.
- The 50-batch result is synthetic. It is not evidence that a real 50-batch customer dataset has passed 99.5% acceptance.
- The browser demos are intentionally narrow: they show the control flow and artifacts the brief asks for, not a full production integration.
- Customs and social browser demos use synthetic rows/drafts; the Python references reuse the same synthetic scenarios.

## Test evidence

| Suite | Tests | Result |
|---|---:|---|
| `social-workflow/tests/test_workflow.py` | 6 | pass |
| `customs-agent/tests/test_customs_agent.py` | 10 | pass |

## License

MIT. See [LICENSE](LICENSE).