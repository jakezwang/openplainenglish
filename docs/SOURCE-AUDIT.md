# Source URL audit

The 2026-10-13 audit checked **all 105 unique URLs cited by the 100 health entries**. All 105 returned available HTTP responses. Separate official API requests returned term evidence for all 91 CDC Everyday Words and NCI dictionary URLs. No missing, blocked, timeout, or network-error result was observed in this run.

This establishes reachability and selected term presence at that time. It is not a finding that every sentence is accurate, that every page is licensed for every use, or that the lexicon has passed independent clinical or comprehension review. Review metadata remains unchanged: `source-checked`, dated `2026-10-13`, with the existing editorial method and limitations.

## Reproduce and inspect

Requires Node.js 22 or later; no additional dependency or API key. From the repository root:

```sh
node scripts/check-sources.mjs --output artifacts/source-audit-2026-10-13.json
node --test tests/source-checker.test.mjs
```

The JSON file is a generated local artifact in the ignored `artifacts/` directory; attach it to a review or release when useful. Omitting `--output` writes JSON to stdout. Optional `--input`, `--concurrency` (1–8, default 4), and `--timeout-ms` (100–60000, default 12000) control the run. The recorded run used concurrency 6.

The checker performs GET requests only. It never edits the lexicon, changes review status, or sends page content from a user's browsing session. It follows redirects, records the final URL, limits response bodies to 2 MiB, and retries a transient network failure, timeout, HTTP 429, or server failure once. Review unexpected redirect destinations manually. Known challenge-page titles count as blocked even when HTTP status is 200; unrecognized challenge pages and soft-404 pages can still escape that heuristic.

A completed audit exits successfully even if some sources are unavailable; inspect the report's status counts and individual records. CLI/configuration failures exit nonzero. Live network availability is deliberately separate from offline tests and should not be a blocking CI assertion.

## Recorded result

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
