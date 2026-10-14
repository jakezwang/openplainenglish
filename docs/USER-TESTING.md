# Three-condition voluntary comprehension pilot

**Status: runnable materials prepared; no participants recruited and no results collected by the project.** This formative pilot compares original text, dictionary-style explanations and in-place plain wording. The harness and software tests are not evidence of comprehension, clinical safety, accessibility conformance or population effectiveness.

## Open the materials

Run `npm run dev`, then open `/demo/study.html` on the printed local URL. The [study page](../demo/study.html) also ships with the public demo; `npm run preview:site` serves it beneath `/openplainenglish/demo/study.html`. It uses the actual shared reader and bundled glossary. Leave an installed extension reader off on this page so there is only one reader.

The study page provides six invented English passages, bilingual questions, three assigned conditions, practice, task timing, answers, confidence, explanation-open counts, facilitator interruption notes and explicit JSON export. Results live only in this page's memory; a reload clears them. There is no automatic upload or localStorage of study responses. A public deployment makes ordinary hosting requests for its page and dictionary files; use localhost for the local pilot. The export has no page address, browsing history, contact details, medical information fields or automatic scoring. Participants can still type personal information in free text: ask them not to, and remove it from notes before sharing.

## Recruitment, consent and retention

Start with six adult volunteers so each of the six sequences is used once. More volunteers can repeat that cycle; this remains a small descriptive pilot. Invite people who read English with different familiarity with health language, including people who prefer another interface language or use assistive technology. Do not describe individuals using deficit labels. Offer a fixed thank-you when resources permit, never conditional on answering correctly. Participation must not feel compulsory.

Ask only optional broad familiarity and preferred reading/accessibility settings. Do not collect diagnoses, records, or demographics unnecessary for the question. Use the participant's assistive technology where feasible and record the setup only with permission. Choose a raw-data deletion date before recruitment, disclose it, and keep any contact/payment details separately from coded responses.

Read this before practice:

> We are testing a reading tool, not you. Every passage is invented; none is medical advice or your health information. You can skip any question or stop whenever you want. We will keep your answers, task times, confidence, explanation-open counts and any facilitator interruption notes under a random code until [date], then delete the raw records. We will not record your screen or voice unless you separately agree. You may answer in either language. Do you agree to begin?

Record an affirmative answer before checking the consent box. Do not precheck it. The app does not verify spoken consent, schedule deletion or upload a consent record. The facilitator is responsible for those steps. Reports should be aggregated; do not publish individual answers without separate permission.

## Conditions and balanced assignment

| Code | UI / reader setting | What is shown |
| --- | --- | --- |
| O | Original text | No assistance, original wording. |
| D | Explain terms / `annotate` | Original words with optional dictionary-style explanations. |
| P | Plain reading / `plain` | Eligible words change in place; original comparison and explanations remain available. |

Each participant sees each passage once, two passages per condition. Assign sequences 1–6 consecutively, before seeing answers. Sequences 1–3 use passages 1→6 with condition rotations O/D/P, D/P/O, P/O/D repeated twice. Sequences 4–6 reverse the passage order and use those same rotations. Across six participants, each passage appears twice per condition and in both directions. Do not switch sequences to improve a result.

The conditions still differ in interaction cost, and passage difficulty, familiarity and learning can confound a small study. Record these limits. The exercise compares useful reading support, not dictionary vocabulary knowledge in isolation. Every scored passage has one eligible pair; this is deliberately a focused test, not a claim about arbitrary webpages or all 132 glossary entries.

## Session script (about 20–30 minutes)

1. Explain consent and retention; assign a random code and the next sequence. Keep default comfortable density and subtle highlighting across the three conditions unless an accessibility need requires a change. Record any change without penalizing the participant.
2. Use the page's **unscored practice** sentence about `tachycardia` and `biopsy`. Practise Plain, Explain, opening a term, Escape and Restore. These words are absent from the scored passages. Do not practise on the homepage article, which contains scored words.
3. Obtain consent and choose **Begin**. The harness applies each assigned condition automatically. Read the same bilingual question shown on screen; do not explain a word, hint at an answer or correct it during scored tasks.
4. Ask the participant to answer in their own words and choose confidence from 1 (guessing) to 5 (very sure), or skip. Timing starts when the passage appears and ends on Next/Finish. Record interruptions separately; the timer does not infer active reading time.
5. Participants may use **View original** and return to the assigned mode at any time. The record retains the assigned condition and `originalConsulted`; do not relabel a task after seeing its outcome. The harness counts explanations opened, without logging page text or a click history. Tool restoration and other observations belong in the optional facilitator notes. Mark interruptions before moving on; raw time still includes them.
6. After six passages, review the JSON together, remove anything private before sharing outside the session, and download only with permission. **Stop** preserves completed tasks; the current unsubmitted answer is excluded. Keep files in the agreed location and delete raw records by the disclosed date.
7. Separately observe: return to original wording, open/close an explanation with keyboard, identify original vs replacement, restore a single occurrence and ignore a term for this page if those controls are available in the tested version. Record independent / after hint / incomplete. Test annotation-only `biopsy` in practice to ensure the user understands why it stays unchanged.
8. Ask: “What helped you understand?”, “Did any replacement change the meaning for you?”, “Could you control what changed?”, “Did the wording feel respectful?”, and “When would you prefer original wording or explanations?” Do not treat faster reading as automatically better.

## Exact scored material and facilitator key

The [passages in study.js](../demo/study.js) are authored fictional examples under the project's CC0 dedication. The questions are visible; keep the scoring key below away from participant view. Accept equivalent everyday wording and spelling variation, including Chinese answers. Score 0–2 without rewarding medical jargon.

| # | Original passage | Question focus | 2 points | 1 point | 0 / misconception flag |
| --- | --- | --- | --- | --- | --- |
| 1 | A fictional leaflet mentions hypertension. It gives no measurements for any reader. | Meaning and whether this diagnoses the reader. | High blood pressure; does not establish the reader has it. | Correct meaning or correct limitation only. | Wrong direction/meaning; flag claiming the passage diagnoses the reader. |
| 2 | A teaching example discusses blood glucose. No test result is included. | Substance in the blood. | Blood sugar / glucose in blood. | Sugar without connecting it to blood. | Confuses it with blood pressure or unrelated substance. |
| 3 | An invented article calls a condition a chronic disease. It does not describe how severe it is. | Duration versus severity. | Long duration; does not itself establish severity. | Duration without describing long-term, or correct limitation only. | Says chronic necessarily means severe or incurable; flag either inference. |
| 4 | A fictional note mentions dyspnea. It gives no explanation of what caused the symptom. | Everyday symptom and known cause. | Shortness of breath/breathing difficulty; cause not supplied. | Correct symptom or correct limitation only. | Incorrect symptom or invented cause; flag causal inference. |
| 5 | A teaching report describes a benign tumor. It includes no advice about treatment. | Cancerousness versus harmlessness/treatment. | Noncancerous growth; no guarantee of harmlessness or no treatment. | Correct cancer distinction without addressing limitation. | Calls it cancerous or guarantees harmlessness/no treatment; flag the latter. |
| 6 | An invented chart compares the mortality rate in two fictional groups over one year. | Death rate versus raw count. | Death rate, not simply number of deaths; group/time context matters. | Deaths mentioned, without distinguishing rate/count. | Unrelated rate or equates rate with raw count. |

Expected eligible substitutions are hypertension→high blood pressure; blood glucose→blood sugar; chronic disease→long-term disease; dyspnea→shortness of breath; benign tumor→noncancerous growth; mortality rate→death rate. Source-checking and these answer anchors do not prove suitability in every clinical context. Review disputed answers with two scorers, record the reason and retain misconception flags even when part of an answer is correct.

## Recording sheet and interpretation

The JSON captures passage, assigned condition, answer, skipped status, seconds, confidence, original consultation, explanation-open count, interruption flag and optional facilitator notes, plus protocol/glossary versions, code and sequence. It deliberately leaves interpretation to a facilitator. Add these fields in a separate local analysis sheet:

```csv
participant_code,sequence,passage,condition,score_0_to_2,misconception_flag,seconds,confidence_1_to_5,skipped,original_consulted,explanation_opens,interruption,observer_notes
```

For interface tasks use:

```csv
participant_code,task,independent_or_hint_or_incomplete,accessibility_setup_with_permission,notes
```

Report comprehension scores and misconceptions by condition, with participant/passage denominators and skips separate from wrong answers. Report median/range of times and confidence; specifically count incorrect answers with confidence 4–5 rather than rewarding confidence alone. Describe reading control, distraction, perceived respect and accessibility barriers alongside speed. A suggested success direction is better understanding without more confident misunderstandings, with independent control of substitutions. Set any numeric target before collecting data; do not invent a passing threshold afterward.

Any new diagnosis, severity, causation or harmlessness misconception triggers wording review. A participant unable to restore the original independently triggers a control review. Repeated confusion warrants review even if mean scores improve. Re-test revisions with new participants where possible and disclose repeat exposure. Six volunteers support iteration, not statistical significance, representativeness, improved health outcomes or clinical validation.

Publish a dated report only after actual sessions, naming version, recruitment, consent/retention process, conditions, scoring, sample sizes, deviations, results, changes and limitations. Until then, **participant results: not run**.

## v0.5 offline analysis and blinded scoring preparation

The [analysis CLI](../scripts/analyze-study.mjs) operates only on files explicitly supplied. It does not recruit participants, collect answers, infer scores from wording, call a model, or upload anything. The software fixtures in tests are synthetic and are never loaded as participant data. With no input, run `npm run analyze:study`: it returns `no-participant-data`, zero sessions and no effect estimate. **The project still has zero actual participant results.**

After real consented sessions, keep exports in the agreed private directory and run:

```sh
npm run analyze:study -- --input /private/path/P01.json --input /private/path/P02.json --output /private/path/unscored-summary.json --scoring-packet /private/path/private-scoring-packet.json
```

The packet contains actual answers, question/passage IDs and stable response hashes. It omits participant codes, condition, sequence, timing and facilitator notes; answer wording can still reveal the condition. Give each independent human scorer a separate copy with the 0–2 rubric above before comparing decisions. Do not send these materials or recruit on someone else’s behalf without authorization. Retain raw-data deletion and disclosure commitments.

Copy the packet’s `scoringTemplate` into a separate scoring JSON file. Replace placeholder reviewer codes with agreed pseudonyms and fill `score` (0, 1, 2) and `misconception` (true/false). Null fields remain unscored. Two distinct reviewer codes must agree on both fields; disagreements stay excluded from score summaries until a third reviewer’s adjudication records `responseKey`, `reviewerCode`, `score`, `misconception` and a nonempty `reason`. A changed answer changes its response key, preventing old scores from attaching silently. Software cannot verify that codes represent different people or that consent, blinding or expertise were genuine.

```sh
npm run analyze:study -- --input /private/path/P01.json --input /private/path/P02.json --scores /private/path/ratings.json --output /private/path/analysis.json
```

Predeclared analysis rules for this pilot:

- Report submitted, skipped, interrupted, eligible and scored denominators separately. Skip is not a wrong answer. Interrupted tasks remain counted but are excluded from the primary descriptive score/time/confidence summaries. Preserve raw records and describe reasons; do not mark hard tasks interrupted after inspecting outcomes.
- No automatic scoring: an answer without two agreed or adjudicated ratings has no comprehension score. Report unresolved disagreements and any misconception flagged by either reviewer, including flags later adjudicated differently.
- Summarize conditions separately with mean, median and range; report misconception and confidence-4/5 misunderstanding counts against the scored denominator. Time includes reading, controls and answering, not pure reading speed.
- Keep glossary versions separate and report sequence counts. Reject repeated participant codes rather than silently pooling duplicate exports or repeat exposure. If repeat-session research is intended, specify a new protocol first.
- The plain-minus-annotation paired comparison uses only complete six-task sessions without skips or interruptions. Score comparisons additionally require all six scores. These are within-participant descriptive differences; no p-value, causal effect, clinical benefit or passing threshold is produced. A condition uses different passages, so balanced assignment and passage difficulty remain relevant.
- The aggregate report omits answers, codes and free-text notes but includes source-file hashes for reproducibility. The optional scoring packet contains private answers and must not be published as a release asset. Inspect any output before sharing.

Run `node --test tests/study-analysis.test.mjs` for validation, missing-data, disagreement, privacy-boundary and CLI regression checks. These checks establish software behavior only. A dated results report remains impossible until actual sessions and independent scoring occur.
