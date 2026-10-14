# Reproducible vocabulary coverage

Version 0.4 adds 12 health entries after inspecting gaps in four common patient-reading tasks: reading a metabolic panel, interpreting a lab report, learning about A1C, and reading about cholesterol. These pages were deliberately selected; we have no traffic measurements proving their frequency and no representative sample of the web.

The frozen [health corpus](../data/coverage/health-reading.json) contains text from four MedlinePlus pages, captured on 2026-10-13. It records URLs, selected section titles, attribution, reuse-policy links, text hashes, and exact character spans for 35 selected technical concepts. There are 1,464 whitespace-separated tokens and 122 labeled occurrences. The labels include unresolved gaps; they are not an exhaustive annotation of every difficult word. A phrase's appearance does not prove that readers find it difficult.

## Snapshot result

| Measure | Frozen v0.3 dictionary | v0.4 dictionary |
| --- | ---: | ---: |
| Exact labeled occurrences covered | 39 / 122 (31.97%) | 80 / 122 (65.57%) |
| Selected concepts covered at least once | 6 / 35 | 18 / 35 |
| Literal matcher hits, including partial concepts | 40 | 80 |
| Eligible inline substitutions in this text fixture | 12 | 12 |

All 12 new health entries are annotation-only. The increased count means the reader can obtain an explanation for more selected phrases; it does not establish that the explanations are accurate in every context or improve comprehension. An old match of `hemoglobin` inside a complete A1C test name is not credited as covering that test: a covered label must match the same start, end, and concept ID. This accounts for the difference between baseline literal hits and covered labels.

Forty-two labeled occurrences remain uncovered, including electrolytes named individually, enzymes, proteins, lipoprotein types, prediabetes, metabolism, hormones, and plaque. This is an explicit backlog, not a request to add every ordinary chemistry word as a standalone alias. A future entry needs the source, ambiguity, and reuse review in [REVIEW.md](REVIEW.md).

## Source and selection boundaries

| Snapshot | Sections included | Source |
| --- | --- | --- |
| Metabolic panel | What is a comprehensive metabolic panel (CMP)? | [MedlinePlus CMP article](https://medlineplus.gov/lab-tests/comprehensive-metabolic-panel-cmp/) |
| Lab results | What is a reference range?; What are false positive and false negative results? | [MedlinePlus lab-results article](https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/) |
| A1C | What is a hemoglobin A1C (HbA1C) test?; What is it used for? | [MedlinePlus A1C article](https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/) |
| Cholesterol | What is cholesterol?; What are HDL, LDL, and VLDL? | [MedlinePlus cholesterol summary](https://medlineplus.gov/cholesterol.html) |

Source: MedlinePlus, National Library of Medicine. Medical-test information and health-topic summaries are within the [public-domain content scope](https://medlineplus.gov/about/using/usingcontent/). No encyclopedia, drug-monograph, bibliography, external article, photo, or logo is reproduced. HTML tags and headings were removed; whitespace within each top-level paragraph/list was collapsed; paragraph/list blocks are separated by two newlines. Names and acronym references are retained exactly, including forms not supported by the dictionary.

The corpus freezes the original v0.3 match strings and inline records, rather than reading the latest Git branch as a moving baseline. These baseline records are measurement inputs, not another distributable lexicon. Gold spans were selected independently of the matcher and stored as literal offsets; the checker rejects altered text hashes, overlapping/out-of-range spans, or span text mismatches. Updating the corpus requires a new corpus ID and an explanation of selection changes. Keep the old corpus when comparing releases.

## Run offline

```sh
node scripts/check-coverage.mjs --output artifacts/coverage-v0.4.0.json
node --test tests/coverage.test.mjs
```

The checker requires no network, key, or new dependency. It uses the shipped matcher and inline presentation helper, records the raw lexicon and corpus SHA-256 hashes, and reports baseline/current counts for each document. It does not simulate DOM exclusions, split text nodes, browser permissions, or an installed extension. Runtime quote/name/compound guards can change which eligible substitutions are actually displayed in a webpage.

The separate [public-service fixtures](../data/coverage/public-service-reading.json) contain 14 positive sentence pairs and 8 negative examples for the opt-in pilot. These sentences are invented regression cases, not a natural-text corpus. Their natural-text coverage rate is deliberately `null`. The default health data does not enable these pairs. Health fixtures add 12 annotation-only examples and four excluded-word/alias examples.

Tests check all 38 invented cases, frozen corpus integrity, exact-span credit, preserved unresolved gaps, and separation of the pilot from default health data. Passing is a regression result only. Expert review, reader comprehension, real-world frequency, and native extension installation each require their own evidence; none is inferred from this report.
