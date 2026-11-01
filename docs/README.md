# ClawHunt demo pages

Four static, browser-only demos used as proposal evidence for ClawHunt tasks.
No API keys, no backend, no customer data. Hosted with GitHub Pages so the
pages keep running when the author's computer is off.

## Pages

| Demo | Path | ClawHunt task | What is verified |
|---|---|---|---|
| GEO visibility monitor | [geo/](geo/) | #1365 | 6 platforms, 8 checks, evidence + variance |
| Recruiting Voice AI | [voice/](voice/) | #1639 | 3 scenarios, 12 QA rows, failure/fallback paths |
| AI shopping assistant | [shopping/](shopping/) | #1339 | 5 synthetic products, 7 checks, C/B API contract |
| Regional industry AI | [industry/](industry/) | #1724 | 5 modules, 8 checks, license/rules/C2M ledger |

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
server. All four pages load with no runtime/console errors:

- GEO: 8/8 assertions
- Voice: 12/12 QA rows
- Shopping: 7/7 assertions
- Industry: 8/8 assertions
