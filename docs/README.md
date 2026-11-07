# ClawHunt demo pages

Seven static, browser-only demos used as proposal evidence for ClawHunt tasks,
plus one extra regional-industry example. No API keys, no backend, no customer
data. Hosted with GitHub Pages so the pages keep running when the author's
computer is off.

## Pages

| Demo | Path | ClawHunt task | What is verified |
|---|---|---|---|
| Rider recruitment OS (5 modules) | [rider/](rider/) | #1804–#1808 | agent 7 slots + citations + de-id; H5 funnel; workbench state machine/concurrency/outbox; 7 KPIs + config review; vault/audit/RBAC/retention |
| GEO visibility monitor | [geo/](geo/) | #1365 | 6 platforms, 8 checks, evidence + variance |
| Recruiting Voice AI | [voice/](voice/) | #1639 | 3 scenarios, 12 QA rows, failure/fallback paths |
| AI shopping assistant | [shopping/](shopping/) | #1339 | 5 synthetic products, 7 checks, C/B API contract |
| Customs automation | [customs/](customs/) | #1364 | 4 modules, 10 checks, 50-batch replay at 99.57% |
| Spreadsheet cleanup | [sheet/](sheet/) | #1462 | 7 rules, 12 rows, exception list, CSV download, 10 checks |
| Social matrix | [social/](social/) | #1539 | 3 accounts, 21 drafts, approval gate, 429 recovery, 10 checks |
| Regional industry AI (extra) | [industry/](industry/) | #1724 | 5 modules, 8 checks, license/rules/C2M ledger |

Root hub: [index.html](index.html).

## Run locally

Open `index.html` directly, or serve the repository:

```bash
python -m http.server 8799
# http://127.0.0.1:8799/docs/
```

## Scope and honesty

- All brands, candidates, products, amounts and platform outputs are synthetic.
- These are deterministic, offline demonstrations, not client production data.
- Evidence URLs and account fingerprints are synthetic placeholders.
- A production build would add real API connectors, auth, persistence, and
  customer-specific validation.

## Verification

Browser checks were run through the Edge DevTools Protocol against the local
server. All eight pages load with no runtime/console errors and no horizontal
overflow at 1280 px:

- GEO: 8/8 assertions
- Voice: 12/12 QA rows
- Shopping: 7/7 assertions
- Customs: 10/10 assertions; fill -> 28/28 fields, $0.00 balance, 7/7 archive
- Sheet: 10/10 checks; 12 raw, 8 clean, 4 exceptions
- Social: 10/10 checks; 21 cards, approve/publish and 429 retry work
- Industry: 8/8 assertions
- Rider: all six views load; Agent 22/22 checks; H5 funnel + E2E 14/14; Workbench 50-concurrency/5 slots; Dashboard 7/7 KPIs; Security 21-step flow