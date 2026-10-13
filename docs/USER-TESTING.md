# Voluntary comprehension pilot

**Status: ready to run; no participants recruited and no results collected.** This small formative pilot checks whether people understand the explanations and can control the interface. It does not establish clinical safety, diagnostic accuracy, accessibility conformance, or effectiveness for a population.

## Participants and consent

Start with 5–8 adult volunteers who read English and vary in familiarity with health terminology. Explain the task in plain language, offer a fixed thank-you if resources permit, and avoid recruitment that could feel compulsory. Ask only optional broad familiarity and preferred reading/accessibility settings; do not collect diagnoses, literacy labels, medical records, or demographics unnecessary for this pilot. Use participants' own assistive technology when feasible and record the setup only with permission.

Read this before starting:

> We are testing a reading tool, not you. The passages are invented examples, not health advice or your medical information. You may skip any question or stop whenever you want. We will record your answers and task times under a random participant code. We will not record audio or your screen unless you separately agree. Your answers will help us improve the wording and controls. Is it okay to begin?

Record consent as yes/no, with no name required in the response sheet. Keep any contact or compensation records separately. Do not run a session without affirmative consent. Set a deletion date before recruiting, tell participants that date, and delete raw session notes by then. Avoid public sharing of individual responses; report aggregated findings and de-identified examples only with permission.

## Setup and procedure (about 20 minutes)

Use a local test page containing the invented passages below. Do not open a participant's health portal or personal documents. Verify assistance is off initially. Show a neutral practice sentence first so the participant can learn how to toggle assistance and open an explanation without seeing a scored term.

Assign alternating participants to sequence A or B. Sequence A reads passages 1, 3, and 5 with assistance off and 2, 4, and 6 with it on; sequence B reverses those conditions. Rotate passage order between sessions. This balances each passage across conditions without showing the same participant the same answer twice. With a small sample, familiarity and passage difficulty remain confounders; report them rather than treating differences as proof.

For each passage, start timing when it appears and stop after the answer. Ask the question exactly as written and record the answer verbatim. Allow access to the page and tool, but do not explain the term, correct the answer, or coach until the scored tasks are finished. Record skipped questions separately from wrong answers. Ask confidence from 1 (“guessing”) to 5 (“very sure”) after each answer.

Finish with interface tasks: turn assistance off; turn it back on; open a highlighted term using the keyboard; close the explanation and find the original term again. Record independent completion, completion after a hint, or not completed. Finally ask: “What was unclear?”, “Did any wording change what you thought the passage meant?”, and “When would you want to turn this off?”

## Invented passages and scoring key

All passages below are authored fictional examples, available under the project's CC0 data dedication. They describe no real person. Keep the scoring key out of the participant view.

| # | Passage and question | 2 points: meaning preserved | 1 point: partly correct | 0 points / misconception flag |
|---|---|---|---|---|
| 1 | “An example report uses the word **gastritis**.” What part of the body does that word concern, and what is happening? | Inflammation/irritation of the stomach lining. | Stomach irritation/inflammation without identifying the lining. | A different organ or unrelated condition. Flag claims that the word alone identifies its cause. |
| 2 | “A fictional leaflet describes **dehydration**.” What does this mean in everyday words? | The body does not have enough water/fluids to work normally. | “Needs water” without describing a lack of fluid in the body. | Too much fluid or an unrelated condition. Flag a claim that thirst alone proves it. |
| 3 | “A sample report mentions **edema**.” What causes the swelling described by this word? | Fluid collecting in body tissue. | Swelling, without the role of fluid. | Infection/cancer presented as its necessary cause or an unrelated meaning. |
| 4 | “An example safety report records an **adverse event** after a treatment.” Does that sentence alone prove the treatment caused the event? Explain. | No; it happened afterward, but timing alone does not prove cause. | No, without an explanation. | Yes, it proves causation. Flag this as an important causal misunderstanding. |
| 5 | “A teaching example uses **acute illness**.” Does “acute” necessarily mean severe? Explain. | No; it can describe sudden onset or a short course. | No, without explaining the time-related meaning. | Yes, it always means severe. Flag this as a severity misunderstanding. |
| 6 | “A fictional article describes **hypertension**.” What does the term mean? | High blood pressure. | Blood pressure is outside the usual range, without direction. | Low blood pressure or a different meaning. Flag claims that this sentence diagnoses the reader. |

Score only the stated answer. Accept equivalent everyday wording and spelling errors; do not reward medical vocabulary for its own sake. If an answer fits none of the anchors, two reviewers should agree on a score and record why. Keep misconception flags in addition to numeric scores, even if another part of the answer was correct. Do not infer comprehension from confidence or task speed.

## Recording and interpretation

Use this blank record; each line is one task, with no direct identifiers:

```text
participant_code,sequence,passage,condition,answer,score_0_to_2,misconception_flag,seconds,confidence_1_to_5,skipped,observer_notes
```

Also record interface-task completion and optional broad prior familiarity. Summarize answer scores, skips, misconception counts, and observed control problems separately for assisted and unassisted passages. Show participant and passage counts, medians/ranges for time, and denominators for every fraction. With 5–8 volunteers, report descriptive findings; do not claim statistical significance, representativeness, improved medical outcomes, or validated safety.

Before a session begins, use these iteration rules: any new causal, severity, or diagnosis misconception triggers wording review; any participant unable to turn assistance off independently triggers a control review; recurring confusion about a term triggers source and wording review even if average scores look good. Re-test revised wording with fresh participants where possible and disclose repeat exposure. A good pilot result is useful evidence for the next iteration, not permission to label the product “clinically validated.”

Publish a short honest report with recruitment, consent process, test dates, tool version, passages, conditions, scoring method, counts, issues, changes, and limitations. Leave results explicitly “not run” until sessions actually happen.
