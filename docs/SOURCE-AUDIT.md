# Source URL audit

The latest v0.5 health audit checked **all 125 unique URLs cited by 132 entries** on 2026-10-14. All 125 were available; 94 CDC/NCI API probes returned term evidence. No missing, blocked, timeout or network-error result was observed. The separate v0.5 public-service audit checked both unchanged pilot sources at 2026-10-14T09:22:03.675Z; both were available.

This establishes reachability and selected term presence at that time. It is not a finding that every sentence is accurate, that every page is licensed for every use, or that the lexicon has passed independent clinical or comprehension review. A URL audit never upgrades review status or changes a review date. Unchanged definition reviews retain 2026-10-13; new v0.5 definition and inline comparisons are dated 2026-10-14 and remain source-checked with the same limitations.

## Reproduce and inspect

Requires Node.js 22 or later; no additional dependency or API key. From the repository root:

```sh
node scripts/check-sources.mjs --output artifacts/source-audit-v0.5.0.json
node scripts/check-sources.mjs --input data/pilots/public-service.json --output artifacts/source-audit-public-service-v0.5.0.json
node --test tests/source-checker.test.mjs
```

The JSON file is a generated local artifact in the ignored `artifacts/` directory; attach it to a review or release when useful. Omitting `--output` writes JSON to stdout. Optional `--input`, `--concurrency` (1–8, default 4), and `--timeout-ms` (100–60000, default 12000) control the run. The recorded run used concurrency 6.

The checker performs GET requests only. It never edits the lexicon, changes review status, or sends page content from a user's browsing session. It follows redirects, records the final URL, limits response bodies to 2 MiB, and retries a transient network failure, timeout, HTTP 429, or server failure once. Review unexpected redirect destinations manually. Known challenge-page titles count as blocked even when HTTP status is 200; unrecognized challenge pages and soft-404 pages can still escape that heuristic.

A completed audit exits successfully even if some sources are unavailable; inspect the report's status counts and individual records. CLI/configuration failures exit nonzero. Live network availability is deliberately separate from offline tests and should not be a blocking CI assertion.

## v0.5 health result

- Checked at UTC: `2026-10-14T09:15:23.851Z`.
- Lexicon: 0.5.0, 132 entries, 125 unique cited URLs.
- Reachability: 125 available; no unavailable category.
- Official API term evidence: 94 found.
- Input SHA-256: `a13025d277a48cbd483b651ce9a9f5e1e0a1cb3f0dfa62c79d19cacad902ddf2`.
- Artifact: `artifacts/source-audit-v0.5.0.json`.

The 13 additional citation URLs are verified MedlinePlus medical-test/health-topic pages and NCI definitions. The [v0.5 editorial ledger](LEXICON.md#v05-additions-and-source-comparison) separately documents comparison of changed meanings and pairs, including candidates rejected for ambiguous or narrowed meaning. Two exploratory NCI API slugs (lipoprotein and arrhythmia) returned no definition; neither guessed URL was added. Existing MedlinePlus sources were used instead, and arrhythmia remained annotation-only. The current audit measures only URLs actually cited in the final data. No original entry citation required repair.

### v0.5 public-service result

The unchanged eight-entry / fourteen-pair pilot was audited separately at `2026-10-14T09:22:03.675Z` after its release-version update. Both cited URLs were available. Input SHA-256: `daf0fa17c2f4630ae8eae5055927974a3174103ac36512cc346caa895713732c`. Artifact: `artifacts/source-audit-public-service-v0.5.0.json`. This availability check does not change the original 2026-10-13 editorial comparison dates.

## v0.4 recorded result

| Input | Health default | Public-service opt-in pilot |
| --- | --- | --- |
| Version | 0.4.0 | 0.4.0 |
| Checked at (UTC) | 2026-10-14T01:18:31.046Z | 2026-10-14T01:18:48.377Z |
| Source URLs available | 112 / 112 | 2 / 2 |
| Official API term evidence | 91 found | Not applicable |
| Input SHA-256 | `d285c6f3e09a57430d1d4962fdcde173aedfc633a42633d35175dbddba2db0aa` | `895f0a0e09ec13696596b467565135951d5282f1c25f178d2065e4fea100c7d0` |
| Artifact | `artifacts/source-audit-v0.4.0.json` | `artifacts/source-audit-public-service-v0.4.0.json` |

The seven new MedlinePlus URLs were read for the twelve new health definitions, including the complete laboratory-results context. The CPSC and Digital.gov plain-language tables were read for the eight pilot entries and fourteen pairs. Their titles and source-rights boundaries were inspected; none was a dead or mismatched citation requiring replacement. Supplemental API probes remain relevant only to the older CDC/NCI entries. Original entry review dates were preserved. No audit result upgrades data to independent expert or comprehension review. See [the source-comparison ledger](LEXICON.md#v04-additions-and-source-comparison), [pilot boundaries](INLINE-LEXICON.md#public-service-opt-in-pilot), and the separate [offline coverage report](COVERAGE.md).

## v0.3 repeat audit

The same 105 cited URLs were checked again for lexicon **0.3.0** at `2026-10-13T23:58:30.826Z`, using default concurrency 4. All 105 were available and all 91 supplemental probes returned term evidence; no retry was needed. Input SHA-256: `69cdd086f57ae441512e597e2c4c8f8342b9b412ae2aa5705cb35370241dcfae`. The release attachment is `source-audit-v0.3.0.json`. The separate [inline editorial comparison](INLINE-LEXICON.md) records the new replacement pairs; URL availability alone did not approve them.

## v0.2 recorded result

- Completed at `2026-10-13T13:57:19.109Z`.
- Lexicon version: `0.2.0`.
- Input SHA-256: `8f152811801ddaaa7e50b60c66e973c83d322c388ba415a14115b6c0c8b74dfb`.
- Source URLs: 105 available; 0 missing; 0 blocked; 0 other failures. No retry was needed.
- Supplemental API probes: 91 with term evidence (54 NCI, 37 CDC).

| Source family | Unique cited URLs | HTTP available | Supplemental evidence |
|---|---:|---:|---|
| NCI Dictionary of Cancer Terms | 54 | 54 | 54 nonempty official definitions |
| CDC Everyday Words | 37 | 37 | 37 nonempty official term-query results |
| MedlinePlus health topics and medical tests | 12 | 12 | Titles inspected; no automated semantic approval |
| CDC archived epidemiology glossary | 1 | 1 | Glossary title and incidence-rate passage inspected |
| FDA postmarket safety explanation | 1 | 1 | Article title inspected; no automated semantic approval |

Each JSON result lists the affected entry IDs, citation labels, HTTP status, attempts, final URL, title where present, and supplemental evidence where supported. Statuses distinguish `available`, `missing` (404/410), `blocked` (401/403/429 or a recognized challenge), `http-error`, `timeout`, and `network-error`. API content evidence distinguishes `found`, `not-found`, `unreadable`, and the same request-failure statuses. A body-limit failure is reported as a network-error with an explicit body-limit message.

## Shell pages and source inspection

[NCI dictionary pages](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/dehydration) serve a JavaScript application shell. Their successful HTML response does not establish that a requested term exists. The checker also reads the term's [official NCI glossary API](https://webapis.cancer.gov/glossary/v1/Terms/Cancer.gov/Patient/en/dehydration). Title extraction is restricted to document metadata rather than the SVG titles used for social icons. The [official API specification](https://webapis.cancer.gov/glossary/v1/swagger/v1/swagger.json) documents the term endpoint.

[CDC Everyday Words](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Hypertension) is also dynamic. The checker queries its [official entry API](https://tools.cdc.gov/ewapi/everydaywords.svc/entries?term=Hypertension). Some queries return related terms as well as the requested term: “Glucose,” “Public health,” and “Vaccine” are examples in this run. The report retains returned names so a reviewer can inspect them. A nonempty query result does not itself establish an exact semantic match.

No dead or mismatched citation requiring replacement was found in this run. Two narrow editorial improvements were made after comparing primary sources:

- **Dehydration:** the fuller explanation now includes insufficient fluid intake, rather than describing only losses that the body cannot replace. This follows the existing [NCI definition](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/dehydration), which includes not drinking enough among possible causes. It adds no diagnosis or treatment recommendation.
- **Incidence rate:** the explanation now explicitly compares new cases with the population at risk over time, and the context notes units and accumulated time at risk. The [CDC epidemiology glossary, “incidence rate”](https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/glossary.html) was added as a supporting citation. That URL was already used elsewhere, so the unique-source count remains 105.

The source-rights scope remains the one documented in [LEXICON.md](LEXICON.md). This network audit does not relicense source material or elevate editorial review. Use the [review rubric](REVIEW.md) for factual, rights, alias, and wording decisions, and the [participant protocol](USER-TESTING.md) for future comprehension evidence. The participant protocol has not yet been run.
