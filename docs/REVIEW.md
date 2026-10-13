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
