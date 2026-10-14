# Reproducible vocabulary coverage

Version 0.5 adds 20 health entries and 16 explicit inline pairs after inspecting gaps in four common patient-reading tasks: reading a metabolic panel, interpreting a lab report, learning about A1C, and reading about cholesterol. These pages were deliberately selected; we have no traffic measurements proving their frequency and no representative sample of the web.

The frozen [health corpus](../data/coverage/health-reading.json) contains text from four MedlinePlus pages, captured on 2026-10-13. It records URLs, selected section titles, attribution, reuse-policy links, text hashes, and exact character spans for 35 selected technical concepts. There are 1,464 whitespace-separated tokens and 122 labeled occurrences. The labels include unresolved gaps; they are not an exhaustive annotation of every difficult word. A phrase's appearance does not prove that readers find it difficult.

## Snapshot result

| Measure | Historical v0.3 dictionary | Frozen v0.4 baseline | v0.5 dictionary |
| --- | ---: | ---: | ---: |
| Exact labeled occurrences covered | 39 / 122 (31.97%) | 80 / 122 (65.57%) | 104 / 122 (85.25%) |
| Selected concepts covered at least once | 6 / 35 | 18 / 35 | 34 / 35 |
| Literal matcher hits, including uncredited matches | 40 | 80 | 105 |
| Eligible inline substitutions in this text fixture | 12 | 12 | 16 |

Version 0.4’s 12 additions were annotation-only. Version 0.5 covers 24 more selected spans, and its hormone/hormones and lipoprotein/lipoproteins pairs create four additional in-place substitutions. The other new pairs are exercised by invented fixtures but do not occur in these four excerpts. Counts establish lexical behavior on this sample, not medical accuracy or improved comprehension. An old match of `hemoglobin` inside a complete A1C test name is not credited as covering that test: a covered label must match the same start, end, and concept ID. This accounts for the v0.3 difference between literal hits and covered labels. In v0.5, an additional kidney disease match is outside the selected gold labels and earns no gold credit.

Eighteen labeled occurrences remain uncovered: five uses of plaque and thirteen short HDL/LDL/VLDL labels. Bare plaque can refer to tooth deposits, artery deposits or an award, and acronyms can be ambiguous outside the selected article. These gaps remain in the denominator; no labels or source text were removed to raise a percentage. A future entry needs the source, ambiguity, and reuse review in [REVIEW.md](REVIEW.md).

## Source and selection boundaries

| Snapshot | Sections included | Source |
| --- | --- | --- |
| Metabolic panel | What is a comprehensive metabolic panel (CMP)? | [MedlinePlus CMP article](https://medlineplus.gov/lab-tests/comprehensive-metabolic-panel-cmp/) |
| Lab results | What is a reference range?; What are false positive and false negative results? | [MedlinePlus lab-results article](https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/) |
| A1C | What is a hemoglobin A1C (HbA1C) test?; What is it used for? | [MedlinePlus A1C article](https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/) |
| Cholesterol | What is cholesterol?; What are HDL, LDL, and VLDL? | [MedlinePlus cholesterol summary](https://medlineplus.gov/cholesterol.html) |

Source: MedlinePlus, National Library of Medicine. Medical-test information and health-topic summaries are within the [public-domain content scope](https://medlineplus.gov/about/using/usingcontent/). No encyclopedia, drug-monograph, bibliography, external article, photo, or logo is reproduced. HTML tags and headings were removed; whitespace within each top-level paragraph/list was collapsed; paragraph/list blocks are separated by two newlines. Names and acronym references are retained exactly, including forms not supported by the dictionary.

The corpus freezes v0.4 match strings and inline records as the v0.5 baseline, retaining the original v0.3 records in historicalBaselines. It does not read the latest Git branch as a moving baseline. These baseline records are measurement inputs, not another distributable lexicon. All versions are evaluated with the current matcher/helper so this comparison isolates dictionary coverage; it is not a replay of historical browser binaries. The v0.4 release report remains preserved separately. Gold spans were selected independently of the matcher and stored as literal offsets; the checker rejects altered text hashes, overlapping/out-of-range spans, or span text mismatches. Updating the corpus requires a new corpus ID and an explanation of selection changes. Keep the old corpus when comparing releases.

## Run offline

```sh
node scripts/check-coverage.mjs --output artifacts/coverage-v0.5.0.json
node --test tests/coverage.test.mjs
```

The checker requires no network, key, or new dependency. It uses the shipped matcher and inline presentation helper, records the raw lexicon and corpus SHA-256 hashes, and reports baseline/current counts for each document. It does not simulate DOM exclusions, split text nodes, browser permissions, or an installed extension. Runtime quote/name/compound guards can change which eligible substitutions are actually displayed in a webpage.

The separate [public-service fixtures](../data/coverage/public-service-reading.json) contain 14 positive sentence pairs and 8 negative examples for the opt-in pilot. These sentences are invented regression cases, not a natural-text corpus. Their natural-text coverage rate is deliberately `null`. The default health data does not enable these pairs. Health fixtures now total 60: the original 16 plus 16 new positive pair sentences, 16 preserved-boundary examples and 12 new definition-only examples.

Tests check all 82 invented health/pilot cases, frozen corpus integrity, exact-span credit, preserved unresolved gaps, and separation of the pilot from default health data. Passing is a regression result only. Expert review, reader comprehension, real-world frequency, and native extension installation each require their own evidence; none is inferred from this report.

## v0.5 evidence identity

- Health data SHA-256: `a13025d277a48cbd483b651ce9a9f5e1e0a1cb3f0dfa62c79d19cacad902ddf2`.
- Corpus file SHA-256: `07c7d1094fcc43f2dd0e21b79195e382fb53ef7f9fbc6b2e5ed918989703b1e7`.
- Frozen v0.4 data identity: `d285c6f3e09a57430d1d4962fdcde173aedfc633a42633d35175dbddba2db0aa`.
- Coverage report SHA-256: `794077869113bcb8ea9e3cea50e86aff5a11e9ce1b8e3fc05bcd8390e48e32c9`.

The original four text hashes and all 122 gold spans are unchanged. The corpus file hash changes because it now contains the v0.4 baseline and additional invented behavior cases. Neither added examples nor the separate public-service fixtures count as natural-text observations or participant evidence.
