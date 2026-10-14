# Reviewing a health entry

This is a contributor checklist, not evidence that the current entries passed independent clinical or comprehension review. Every current entry remains `source-checked`, meaning **editorial source comparison; no independent clinical or user-comprehension review**. An automated link check never changes that status or its date.

Use an issue or pull request for one entry, or a small related group. Name the entry IDs, the exact proposed text, and the source passages supporting each change. Do not include patient records, screenshots of private portals, or personal health information.

## 1. Meaning and sources

A factual reviewer should read the original source in context and compare the term, every alias, the short explanation, the fuller explanation, and the context sentence. Record the source URL, page or section title, access date, and the particular claim it supports. The citation must support the explanation, rather than merely mention the same term.

Check these distinctions explicitly:

- Meaning versus diagnosis: an explanation must not conclude what condition the reader has, recommend a dose, or imply a result is safe.
- Association versus cause: for example, an adverse event after treatment does not alone establish that treatment caused it.
- Scope: a symptom, test, disease, body part, and treatment are different kinds of things. Do not replace one with another.
- Probability and exceptions: preserve “may,” “often,” and clinically important limitations; never turn them into “always.”
- Specificity: gastritis concerns the stomach lining; edema is fluid collecting in tissue; myocardial infarction involves injury to heart muscle from interrupted blood flow. Plain language must retain the distinction that matters.
- Numbers and denominators: rates require a population and a time period. Do not silently equate a rate with a count or a percentage.
- Ambiguity: reject a broad alias if ordinary web text can use it differently. Check medical and nonmedical sample sentences, acronyms, singular/plural forms, and overlapping terms. A familiar abbreviation is not automatically a safe match.

For an independent clinical review, a qualified reviewer must state their relevant professional expertise, the entries they actually assessed, the date, findings, and conflicts of interest. Keep this record separate from editorial source checking. The current schema supports only `source-checked`; do not invent a new status or imply all entries were reviewed because one was. A future schema change requires an explicit review policy and record format.

## 2. Reuse rights

Confirm the rights of the exact source text, not just the agency homepage. The current reviewed sources are CDC-authored text, NCI-authored dictionary text, MedlinePlus health-topic summaries and medical-test articles, and FDA-authored text. U.S. federal public-domain status can have third-party exceptions.

- Record the source's reuse-policy link and any exceptions in the review discussion. Check bylines, acknowledgments, and embedded third-party content.
- Write an original explanation. Do not copy a paragraph from a secondary glossary or an unclear-license repository.
- MedlinePlus encyclopedia (`/ency/`) and drug monograph (`/druginfo/`) content is outside this project's reviewed scope. Neither the site's presence on `.gov` nor its link to another page grants reuse rights.
- Do not copy logos, images, trademarks, or patient examples. Public-domain text does not imply endorsement.
- Contribute authored wording under the project's [CC0 data license](../data/LICENSE), only if you have the right to do so. Source material keeps its own terms.

Policy references: [CDC agency materials](https://www.cdc.gov/other/agencymaterials.html), [NCI copyright and reuse](https://www.cancer.gov/policies/copyright-reuse), [MedlinePlus using content](https://medlineplus.gov/about/using/usingcontent/), and [FDA website policies](https://www.fda.gov/about-fda/about-website/website-policies). These links are evidence to inspect, not a blanket permission for everything an agency hosts.

## 3. Plain language and interaction

Ask a reviewer unfamiliar with the draft to explain it back in their own words. Follow the [voluntary comprehension protocol](USER-TESTING.md) for actual participant sessions; do not count a readability score or an author's own reading as user evidence.

Check that the short explanation stands alone, uses common words where accuracy permits, and fits the 96-character limit. Define any necessary medical word in the fuller explanation. Prefer one main idea per sentence. Remove unnecessary detail, circular definitions, alarming language, and promises of certainty.

Check the context sentence for a useful boundary, not a generic disclaimer. Test the entry in a complete sentence. The original word must remain available, and assistance must not change links, form values, editable text, or the author's claim. Check keyboard focus and reading order when reviewing the interface.

## 4. Decision and record

Use this small record in the pull request:

```text
Entry IDs:
Proposed meaning and wording change:
Primary source / section / supporting claim / access date:
Exact reuse policy and exceptions checked:
Alias ambiguity examples checked:
Factual reviewer and relevant expertise (or “not independently reviewed”):
Plain-language reviewer / participant evidence (or “not tested”):
Remaining uncertainty:
Decision: accept / revise / exclude
```

Accept only when the sources support all substantive claims, the rights fit the project, aliases avoid a known harmful mismatch, and the text meets the structural checks. If reviewers disagree about a medical meaning, keep the prior supported wording or exclude the match until resolved. Do not average competing diagnoses or replace uncertainty with a simpler but inaccurate claim.

Run `node scripts/validate-lexicon.mjs` and `node --test tests/lexicon.test.mjs` after an edit. Run the source audit separately when citations change. Structural validation, source reachability, editorial review, clinical review, and participant comprehension are distinct pieces of evidence; report each honestly.

## Inline and pilot review

An inline replacement has a higher burden than an annotation: it must fit the original sentence without turning a substance into a test, a noun into an adjective, or a possible outcome into a certainty. Review the complete `from`/`to` pair, its number and tense, surrounding articles, negation, modifiers, quoted uses, and proper names. An explanation being correct does not establish interchangeability. Check an ordinary use and a plausible counterexample for every new pair; do not generate unspecified inflections.

The [public-service pilot](../data/pilots/public-service.json) uses **editorial source comparison; no independent domain-expert or user-comprehension review**. Its nonclinical scope does not justify altering legal force, interpreting eligibility, or changing a deadline. CPSC and Digital.gov authored text are the two additional reviewed sources, with their precise rights boundaries recorded in [LEXICON.md](LEXICON.md#separate-public-service-pilot). A source's plain-writing recommendation is not permission to apply that alternative in every grammatical construction.

For v0.4, the twelve added health entries were compared with the seven cited MedlinePlus articles/summaries on 2026-10-13. Editorial checks distinguished a full metabolic panel from a basic panel, the A1C test from hemoglobin and a single blood-sugar reading, substances from disease names, reference ranges from a guarantee of health, and false results from all positive/negative results. The two public-service source tables were compared with all fourteen explicit pairs and their grammar. Inflected forms are editorial applications of the listed base verbs, not quotations claimed to appear in the source. These checks were AI-assisted and do not fulfill the independent human-review process.

## Independent review package

A maintainer can prepare this package for a willing reviewer. Do not recruit or send it on another person's behalf without authorization. Share public or invented passages only. Attach a stable data file/diff, corpus fixture, relevant audit JSON, source/right links, and the fields below. The package is ready to fill in; **no reviewer has completed it for this release**.

```text
REVIEW IDENTIFICATION
Package ID / date:
Data version / SHA-256 / exact diff or commit:
Domain / entry IDs / from-to pairs in scope:
Author / AI assistance used:
Reviewer name or agreed public identifier:
Relevant expertise and limitations:
Relationship to author / conflicts of interest:

FOR EACH ENTRY / PAIR
Entry ID:
Primary source / section / access date:
Source claim compared with short / explanation / context:
Alias-by-alias meaning and ambiguity findings:
Inline pair / positive sentence / unchanged counterexample:
Word type / number / tense / article / negation / uncertainty checks:
Quotes / names / broader or narrower senses checked:
Reuse policy / third-party exceptions / attribution checked:
Correction needed (exact wording):
Decision: supported / revise / exclude / unable to assess
Remaining uncertainty:

SEPARATE EVIDENCE
Structural validation and fixture results / artifact hashes:
URL availability (not factual approval):
Independent factual review completed by / scope / date:
Independent clinical or domain review completed by / scope / date:
Participant comprehension evidence / protocol / sample / date:
For any missing item, write not completed; do not leave implied approval.

DISPOSITION
Final diff rechecked by someone other than its author:
Reviewer decision and date:
Maintainer action / unresolved issue / excluded pairs:
Changelog and follow-up source-review trigger:
```

The [community process](COMMUNITY.md) requires an author and a distinct human reviewer for community data changes. Store this completed record with the proposal, separate from the entry's `source-checked` metadata. Do not change the schema status to expert-verified or mark the whole lexicon reviewed based on a subset. If material revisions follow review, the revised wording and pairs need another review of the final diff.

## v0.5 package ready for independent review

Status: **prepared, no independent human review completed**. Data version 0.5.0; health SHA-256 `a13025d277a48cbd483b651ce9a9f5e1e0a1cb3f0dfa62c79d19cacad902ddf2`. Scope: 20 new entries (see [source-comparison ledger](LEXICON.md#v05-additions-and-source-comparison)), 16 added pairs across 10 entries, and the new chronic illnesses alias. The 10 pair-bearing entries are carcinogen, chronic-disease, end-stage-renal-disease, hematuria, hormone, lipoprotein, renal-disease, renal-failure, renal-function, ultrasound. New inline comparisons are dated 2026-10-14; unchanged definition dates remain intact.

Attach these exact materials to a future review request: `data/health.json`, the v0.4→v0.5 diff, `data/coverage/health-reading.json`, `artifacts/source-audit-v0.5.0.json`, and `artifacts/coverage-v0.5.0.json`. The [inline ledger](INLINE-LEXICON.md#v05-pair-additions-and-rejected-candidates) records sources, retained cases and rejected alternatives. The four source texts and all 122 gold spans are unchanged; a frozen v0.4 baseline and the v0.3 historical baseline are included.

Review priority: (1) particle versus cholesterol and protection of named lipoprotein subtypes; (2) hormone versus the broader chemical-messenger paraphrase in compounds; (3) renal disease/failure/function distinctions; (4) hematuria without an inferred cause; (5) preserving end-stage, number and uncertainty; (6) annotation-only laboratory quantities and substances. Inspect the actual sources, not just the audit’s available status. A finding that a pair loses specificity is a reason to remove the pair while keeping its annotation.

Fill the independent package form above with actual reviewer identity/role, conflicts, checked IDs, source claims, counterexamples and final disposition. Leave factual, clinical/domain and user-comprehension review marked not completed until corresponding evidence exists. The new analysis CLI prepares blinded scoring material from actual sessions; it does not establish any of those reviews. No recruitment message was sent.
