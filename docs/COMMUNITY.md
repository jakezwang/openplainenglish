# Contributing and maintaining language data

The project welcomes corrections, examples of confusing public text, source updates, and narrowly scoped lexicon proposals. No independent expert review or participant comprehension study has been completed for the current data. The procedures below organize future contributions; they are not a record of approvals already obtained.

## A small contribution that can be reviewed

Start with one entry or a related group of at most five. Give a public source URL, the exact confusing phrase, its surrounding sentence, and the meaning you think a reader needs. Invented examples are welcome if labeled as invented. Do not post patient records, private portal text, account numbers, workplace secrets, or other people's messages. A screenshot or popularity vote is not a source or a reuse license.

An issue can propose a gap without supplying code. A data pull request should include:

1. The stable entry IDs and a before/after wording diff, including aliases and every inline pair.
2. The primary source, section, access date, supporting passage or concise claim comparison, and exact reuse policy.
3. A public or invented positive sentence and a counterexample for each new alias or pair. Preserve word type, number, tense, articles, negation, and uncertainty.
4. A reason the entry belongs in the default health vocabulary or a named opt-in pilot. A separate domain does not automatically belong in the default extension.
5. Structural checks, the offline coverage report, remaining gaps, and any source-check failures. Explain changes to the fixed benchmark separately from changes to the dictionary.
6. A statement that you can contribute your original wording under [CC0](../data/LICENSE), plus any AI assistance used. Source text retains its own rights and attribution.

Use the [review rubric and independent review package](REVIEW.md). Keep `source-checked` honest. Neither a second AI pass nor a link checker qualifies as an independent human expert or comprehension review.

## Two-person review for community changes

An author prepares the proposal; a distinct human reviewer checks its final diff and evidence. The reviewer must record what they actually reviewed, relevant expertise, conflicts, uncertainty, and a decision. A maintainer may serve as the reviewer if they did not author the wording. If they substantially rewrite it, another person must review that final version. Automated checks support this process and cannot supply the second person.

The minimum editorial decision checks factual support, alias ambiguity, reuse rights, and plain wording. For a health meaning dispute or material clinical distinction, obtain a reviewer with relevant clinical expertise or keep the change out of the default data. A general editorial approval is not clinical certification. A clinician's scoped review is not a user-comprehension study. Human review records remain separate from the current schema, which only represents source comparison.

When no independent person is available, keep the proposal explicitly pending. Do not invent a name, credential, approval, test session, or successful outcome. The current seed and v0.4 additions remain an AI-assisted, source-compared preview awaiting this review process.

## Disagreements and corrections

Record the disputed claim and competing source passages, not just preferred wording. Consider whether the sources describe different populations, senses, tests, or dates. Do not resolve a factual disagreement by averaging meanings or voting on a diagnosis.

Prefer the smallest supported correction. Remove a disputed inline pair and keep a supported annotation when possible; remove the match if the explanation or alias itself is uncertain. For credible reports of meaning-changing substitutions, a maintainer can disable the pair promptly while the substantive revision awaits review. Link that temporary action to the unresolved review record. Preserve the original text and access to the source.

Close a dispute with the supported wording, evidence, named decision-maker, date, and remaining limits. Reopen it when new evidence changes the basis. Do not delete inconvenient counterexamples from a benchmark to improve a percentage.

## Source rechecks and releases

Before a data release, run the source audit for each included lexicon and inspect missing, blocked, redirected, or unexpected-title results. An HTTP 200 or nonempty API query does not prove a definition is right. Compare changed source text with the entry and its inline pairs; reread the exact reuse policy when ownership or page type changes. A blocked URL remains unverified until a reviewer can inspect it. Do not replace it with a guessed definition or an unclear-license copy.

Keep an entry's original review date when only a URL was fetched. Change that date only after a substantive editorial comparison and record what was compared. Preserve stable IDs, bump the data version, and keep separate dates and scopes for independent expert reviews and participant studies.

The release changelog should identify added/changed/removed IDs, changed pairs, citation/rights changes, known exclusions, benchmark corpus version and hashes, before/after coverage, audit artifacts, and human-review status. Mark retired aliases and removed pairs explicitly because consumers may depend on them. A behavior or schema change needs its own compatibility note. Attach generated JSON reports to the release when publishing; `artifacts/` is intentionally ignored by Git.

## Review queue template

```text
Proposal / issue:
Domain and entry IDs:
Author / AI assistance disclosed:
Public reading need and supporting example:
Proposed wording, aliases, and exact pairs:
Primary sources / sections / access dates:
Reuse policy / exceptions / contributor CC0 statement:
Positive examples / negative examples / unresolved ambiguity:
Checks and report links, with corpus/data hashes:
Independent reviewer / expertise / conflicts / scope:
Decision: pending / revise / accept / exclude
Temporary exclusions or pair removals:
Final diff or commit reviewed:
Date / maintainer disposition / changelog entry:
```

This template is blank on purpose. Submitting it or running a script does not complete a review.
