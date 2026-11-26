# Smart Campus Room Availability Checker - Practice #12

**AI-Driven Software Engineering, Practice #12 - Comparing code-based and low-code solutions**
Student: Murat Mansur Nurbolatovich, ID 24B031905 (KBTU) · Class: Thursday, 13:00-16:00
AI tool: Claude (Anthropic), model Claude Opus 5.5 (`claude-opus-5-5`)

The same small feature - "is fictional Room B-204 free for the requested interval?" - is implemented twice
against one shared contract and tested with the same eight test cases.

| Track | Technology | Where |
|---|---|---|
| Code-based | HTML5 + CSS + vanilla JavaScript, Node.js built-in test runner | [`code-based/`](code-based/) |
| Low-code | Node-RED 4.1.18 + FlowFuse Dashboard 2.0 (`@flowfuse/node-red-dashboard` 1.37.0) | [`low-code/flows.json`](low-code/flows.json) (Node-RED export) |

**Live demo (code-based track):** https://lno-mier.github.io/smart-campus-practice12/code-based/
The low-code track needs a running Node-RED server, so it has no public demo (see "Run the low-code track").

## Results

| Criterion | Code-based | Low-code |
|---|---|---|
| Functional tests (T1-T8) | 8 / 8 (plus 10 / 10 unit tests) | 8 / 8 |
| Unresolved defects | 0 | 1 cosmetic (default duration 60 not pre-filled) |

Evidence: [`test-results/`](test-results/) (JSON log of the UI run, unit-test log, DAST checks) and
[`screenshots/`](screenshots/) (T1-T8 for both tracks plus a 390 px narrow-screen view).
Full report: [`report/`](report/).

## Shared contract

See [`docs/requirements.md`](docs/requirements.md) - user story, AC1-AC6, inputs/outputs and the eight test cases.

## Run the code-based track

Open `code-based/index.html` in a browser (no build, no dependencies).
The page uses the browser clock as "now". To repeat the tests after 2026-12-01, fix the clock with a query
parameter, for example `code-based/index.html?now=2026-11-26T15:00`.

```
node --test code-based/          # 10 unit tests, fixed clock
```

## Run the low-code track

```
npm install                      # node-red, dashboard 2.0, playwright-core (dev only)
npx node-red -u low-code         # uses low-code/settings.js and low-code/flows.json
```

Dashboard: http://127.0.0.1:1880/dashboard/checker · Editor: http://127.0.0.1:1880/
`low-code/settings.js` binds Node-RED to 127.0.0.1 only. The editor/admin API has **no password by default**
(security finding in the report) - uncomment `adminAuth` in `settings.js` before sharing the instance.

## Run the UI tests (both tracks)

With Node-RED running and Google Chrome installed:

```
node tests/ui-tests.js           # same T1-T8 through both user interfaces, writes test-results/ and screenshots/
node tests/dast-checks.js        # XSS probe (code-based) + unauthenticated admin API check (local Node-RED)
```

## Notes

* Fictional data only: one room, three fictional bookings; no login, payments, personal data or production database.
* Security checks were run only against the local instances created for this practice.
* The source in this repository was re-created from the report specification for publication (the original
  working copy was not preserved), then all tests were re-run on this exact version with the same results.
