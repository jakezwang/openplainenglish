# Inline replacement lexicons v0.5

The 132-entry default health glossary includes **30 entries with 56 explicit inline replacement pairs**. Every other entry or alias remains available for annotation without an inline rewrite. The `short` definition is never an automatic replacement: it can be a sentence fragment, begin with an article, or explain a broader concept than the original word.

This is local lexical replacement, not sentence rewriting or full-context understanding. The pairs are AI-assisted editorial choices compared with primary sources. No independent clinician or human reader has reviewed these new pairs, and no participant comprehension study has been run. `source-checked` is not a clinical approval or a promise that a substitution will fit every sentence.

## v0.3 health selection and source comparison

On **2026-10-13**, 25 unique primary citations for 23 candidate entries were fetched and read: official CDC Everyday Words term responses, official NCI glossary definitions, and MedlinePlus health-topic summaries. Twenty-one entries were retained. Health disparities stays annotation-only to retain the explicit comparison between groups; diabetes mellitus keeps its existing explanation without another shortening in this set. The retained entries use **23 unique existing citations**: 11 NCI, 9 CDC Everyday Words, and 3 MedlinePlus URLs. No source URL, original definition, original review date, or source-rights assertion was changed for this addition.

CDC comparisons used the official service behind its page, `https://tools.cdc.gov/ewapi/everydaywords.svc/entries?term=...`. NCI comparisons used the [official glossary API](https://webapis.cancer.gov/glossary/v1/swagger/v1/swagger.json), retrieving each existing definition slug. A successful HTML shell alone was not treated as a definition. For MedlinePlus, only its authored health-topic summary was compared; linked outside articles were not reused. Existing [rights and attribution boundaries](LEXICON.md#rights-and-attribution-evidence) still apply.

These choices preserve noun number and established meanings. They avoid adding diagnoses, numerical thresholds, treatment advice, cause, or certainty. Already plain aliases are not inline sources. No inflection, synonym, plural, acronym expansion, or article change is generated automatically.

## v0.3 replacement ledger (retained)

Each row inherits its entry's citations and has a dedicated editorial boundary note and inline review record. Spelling variants are explicit. These are eligible source strings, not permission to replace every alias of an entry.

| Entry | Explicit pairs | Primary sources compared |
| --- | --- | --- |
| benign-tumor | `benign tumor` → `noncancerous growth`<br>`benign tumour` → `noncancerous growth`<br>`benign tumors` → `noncancerous growths`<br>`benign tumours` → `noncancerous growths` | [National Cancer Institute: benign tumor](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/benign-tumor) |
| blood-glucose | `blood glucose` → `blood sugar` | [CDC Everyday Words: Glucose](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Glucose) |
| bradycardia | `bradycardia` → `slow heart rate` | [MedlinePlus, National Library of Medicine: arrhythmia](https://medlineplus.gov/arrhythmia.html) |
| chronic-disease | `chronic disease` → `long-term disease`<br>`chronic illness` → `long-term illness`<br>`chronic condition` → `long-term condition`<br>`chronic diseases` → `long-term diseases`<br>`chronic conditions` → `long-term conditions` | [CDC Everyday Words: Chronic disease](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Chronic%20disease) |
| dysphagia | `dysphagia` → `swallowing difficulty` | [National Cancer Institute: dysphagia](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/dysphagia) |
| dyspnea | `dyspnea` → `shortness of breath`<br>`dyspnoea` → `shortness of breath` | [National Cancer Institute: dyspnea](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/dyspnea) |
| hyperglycemia | `hyperglycemia` → `high blood sugar`<br>`hyperglycaemia` → `high blood sugar` | [CDC Everyday Words: Hyperglycemia](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Hyperglycemia) |
| hypertension | `hypertension` → `high blood pressure` | [CDC Everyday Words: Hypertension](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Hypertension); [MedlinePlus, National Library of Medicine: highbloodpressure](https://medlineplus.gov/highbloodpressure.html) |
| hypoglycemia | `hypoglycemia` → `low blood sugar`<br>`hypoglycaemia` → `low blood sugar` | [CDC Everyday Words: Hypoglycemia](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Hypoglycemia) |
| hypotension | `hypotension` → `low blood pressure` | [CDC Everyday Words: Hypotension](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Hypotension); [National Cancer Institute: hypotension](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hypotension) |
| hypoxemia | `hypoxemia` → `low blood oxygen`<br>`hypoxaemia` → `low blood oxygen` | [National Cancer Institute: hypoxemia](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hypoxemia); [National Cancer Institute: hypoxia](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hypoxia) |
| hypoxia | `hypoxia` → `low tissue oxygen` | [National Cancer Institute: hypoxia](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hypoxia); [National Cancer Institute: hypoxemia](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hypoxemia) |
| infection-transmission | `infection transmission` → `infection spread`<br>`disease transmission` → `disease spread` | [CDC Everyday Words: Transmit, transmission](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Transmit); [CDC Everyday Words: Infectious diseases](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Infectious%20diseases) |
| malignant-tumor | `malignant tumor` → `cancerous growth`<br>`malignant tumour` → `cancerous growth`<br>`malignant tumors` → `cancerous growths`<br>`malignant tumours` → `cancerous growths` | [National Cancer Institute: malignant](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/malignant) |
| mortality-rate | `mortality rate` → `death rate` | [CDC Everyday Words: Mortality rate](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Mortality%20rate) |
| myocardial-infarction | `myocardial infarction` → `heart attack`<br>`myocardial infarctions` → `heart attacks` | [MedlinePlus, National Library of Medicine: heartattack](https://medlineplus.gov/heartattack.html) |
| platelet | `thrombocyte` → `platelet`<br>`thrombocytes` → `platelets` | [National Cancer Institute: platelet](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/platelet) |
| radiation-therapy | `radiation therapy` → `radiation treatment`<br>`radiotherapy` → `radiation treatment` | [National Cancer Institute: radiation therapy](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/radiation-therapy) |
| red-blood-cell | `erythrocytes` → `red blood cells` | [National Cancer Institute: red blood cell](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/red-blood-cell) |
| tachycardia | `tachycardia` → `fast heart rate` | [MedlinePlus, National Library of Medicine: arrhythmia](https://medlineplus.gov/arrhythmia.html) |
| white-blood-cell | `leukocyte` → `white blood cell`<br>`leukocytes` → `white blood cells` | [National Cancer Institute: white blood cell](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/white-blood-cell) |

## Sentence-pair regression examples

The invented examples below are data-level fixtures in [lexicon.test.mjs](../tests/lexicon.test.mjs), not results from participant sessions or proof of contextual reasoning.

| Before | After | Boundary preserved |
| --- | --- | --- |
| The example describes a myocardial infarction. | The example describes a heart attack. | Singular noun and preceding article. |
| No myocardial infarctions were recorded. | No heart attacks were recorded. | Plural and the existing negation; the matcher does not interpret the negation. |
| The example mentions a benign tumor. | The example mentions a noncancerous growth. | Noncancerous does not become harmless. |
| Two malignant tumours were described. | Two cancerous growths were described. | Plural without asserting spread or a stage. |
| The diagram labels a leukocyte. | The diagram labels a white blood cell. | Singular noun and article. |
| The sample contains erythrocytes. | The sample contains red blood cells. | Only the plural technical synonym is eligible. |
| The report mentions low thrombocytes. | The report mentions low platelets. | The modifier low still modifies a cell count, not a cell's definition. |
| The example does not mention hypertension. | The example does not mention high blood pressure. | Existing wording outside the match is retained. |
| Some chronic conditions need ongoing care. | Some long-term conditions need ongoing care. | Same noun, number, and duration meaning. |
| The mortality rate was measured over one year. | The death rate was measured over one year. | A rate remains a rate with its original time period. |

Hypoxemia and hypoxia additionally have distinct fixtures: blood oxygen and tissue oxygen must not be merged. These examples exercise selected sentence frames; they do not establish grammar or clinical accuracy in all surrounding text.

## Deliberately annotation-only

| Text | Reason no inline source is approved |
| --- | --- |
| biopsy / biopsies | Can name a sampling procedure or refer to the sample/result. A procedure-shaped definition can break the sentence or change the referent. |
| low platelets | Platelets is already the plainer term. Expanding it to a cell-fragment definition would damage the meaning of low. The technical plural thrombocytes has its own safe-number pair. |
| renal / respiratory | Standalone adjectives need their surrounding noun and grammatical role; a generic noun replacement is unsafe. |
| an erythrocyte | The tempting replacement would produce an red blood cell. Only the plural erythrocytes is eligible. |
| esophagus / edema | The tempting food-pipe or swelling paraphrases can change the required a/an article; no article rewriting is implemented by this data. |
| anemia / hemoglobin / biopsy / gastritis | Their useful definitions require explanation or material distinctions, not an approved short interchangeable phrase in this release. |
| ECG / EKG / COPD / MRI / UTI | Acronym interpretation and article pronunciation are too context-dependent for this set. |
| high blood pressure / low blood pressure / blood sugar / heart attack / death rate / shortness of breath | Already plain aliases remain unchanged. |
| chronic-illnesses | This joined spelling is not an approved alias. The spaced plural chronic illnesses was explicitly added in v0.5. |

Quoted terminology, names, technical compound phrases, subtypes, and unusual grammatical frames can still make an apparently useful replacement undesirable. The small allowlist cannot identify every such situation. The original phrase must remain recoverable, and readers must be able to choose annotation mode or turn assistance off. Inline metadata does not authorize changing forms, code, links, editable areas, or other excluded surfaces.

## Schema and validation

An entry may omit `inline` entirely. When present, its shape is:

```json
{
  "replacements": [{ "from": "hypertension", "to": "high blood pressure" }],
  "note": "Use the established plain term only for hypertension. The already plain alias stays unchanged; this does not diagnose a reader from one measurement.",
  "review": {
    "status": "source-checked",
    "date": "2026-10-13",
    "method": "editorial source comparison; no independent clinical or user-comprehension review"
  }
}
```

The structural validator requires 1–64 explicit pairs, a boundary note, existing valid entry sources, and a separate honest review record. Each `from` belongs to the entry's term or aliases after Unicode compatibility, case, and whitespace normalization. Each `to` is nonempty plain text of at most 96 Unicode characters. Identity replacements, duplicate normalized source strings, unknown inline fields, unsupported review claims, invalid dates, markup, control characters, and hidden formatting characters are rejected. Source licenses and URLs retain the existing provenance validation.

Run `node scripts/validate-lexicon.mjs` and `node --test tests/lexicon.test.mjs`. These checks protect the data contract and regression examples. They cannot determine whether a new medical substitution is suitable: use the [review rubric](REVIEW.md), read the actual primary source, try representative sentence frames, and leave the entry annotation-only when meaning or grammar is uncertain.

## Public-service opt-in pilot

The separate [pilot](../data/pilots/public-service.json) adds **8 entries / 14 explicit pairs**, checked against government-authored plain-language guidance on 2026-10-13. It is disabled unless selected and is not merged into the health lexicon. Sources: [CPSC Wordy vs. Clear](https://www.cpsc.gov/About-CPSC/Policies-Statements-and-Directives/plain-language-principles) for the first six rows, and [Digital.gov Familiar terms](https://digital.gov/guides/writing-understanding/familiar-terms) for the last two. [Rights and attribution](LEXICON.md#separate-public-service-pilot) apply.

The review method is `editorial source comparison; no independent domain-expert or user-comprehension review`. The source tables recommend base-word alternatives. Explicit verb inflections are editorial applications of those alternatives; the source is not claimed to contain every inflected example. The v0.4 health additions were annotation-only; the v0.5 health changes below are separate from this pilot.

| Explicit pair(s) | Invented positive sentence: before → after | Negative boundary checked |
| --- | --- | --- |
| at a later date → later | We will reply at a later date. → We will reply later. | No particular date or permission to miss a deadline is added. |
| at the present time → now | At the present time, the office is open. → Now, the office is open. | Now refers to the statement’s time; it is not evidence of current opening hours. |
| for the purpose of → for | Use this form for the purpose of requesting a copy. → Use this form for requesting a copy. | Do not use to before requesting; an intervening sole is not an approved match. |
| in the event that → if | In the event that the office closes, keep the receipt. → If the office closes, keep the receipt. | In the event of rain stays unchanged: if rain would damage grammar. |
| so as to → to | Keep a copy so as to track the request. → Keep a copy to track the request. | The display is so bright as to hurt my eyes stays unchanged. |
| with regard to → about | Write to us with regard to the appointment. → Write to us about the appointment. | In high regard is a different construction and stays unchanged. |
| commence / commences / commenced / commencing → start / starts / started / starting | Work may commence next week. → Work may start next week. | May stays may; commencement is not an inferred noun alias. |
| utilize / utilizes / utilized / utilizing → use / uses / used / using | The office utilized this form. → The office used this form. | The noun utilization stays unchanged; no tense is inferred. |

The executable [pilot fixtures](../data/coverage/public-service-reading.json) contain one positive sentence for every one of the 14 pairs and 8 intentionally unchanged examples. This is an editorial regression set, not observed user behavior. In particular, shall is not replaced: it can express obligation or prediction. In order to is excluded because a sentence such as “Put these pages in order to help the next reader” has an ordering interpretation. Titles, quotations, official names, nested clauses and unusual uses can still need the exact original text. Local guards do not provide general sentence understanding.

## v0.5 pair additions and rejected candidates

The 16 added pairs were compared with official primary text on **2026-10-14**. The two general hormone/lipoprotein entries account for the fixed corpus’s increase from 12 to 16 eligible substitutions; other pairs are useful explicit phrases outside those four excerpts. Inflections are editorial applications of the source meaning, not claims that each exact sentence appears in the source.

| Entry | Added source → display pair(s) | Boundary and source comparison |
| --- | --- | --- |
| carcinogen | `carcinogen` → `cancer-causing substance`<br>`carcinogens` → `cancer-causing substances` | Keep number and any existing uncertainty or exposure wording. This names a cancer-causing substance without asserting that a given exposure will cause cancer. [Source](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Carcinogen) |
| chronic-disease | `chronic illnesses` → `long-term illnesses` | Each complete phrase keeps its noun and number. Long-term describes duration, not severity, permanence, or hopelessness; standalone chronic is excluded. [Source](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Chronic%20disease) |
| end-stage-renal-disease | `end-stage renal disease` → `end-stage kidney disease`<br>`end stage renal disease` → `end stage kidney disease` | Change only renal to kidney in the complete phrase. Keep end-stage and its spelling; neither generic kidney disease nor the ESRD abbreviation is an inline source. [Source](https://www.cdc.gov/ccindex/everydaywords/index.html?word=End-stage%20renal%20disease) [Source](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/renal-failure) |
| hematuria | `hematuria` → `blood in urine`<br>`haematuria` → `blood in urine` | Both spellings name blood in urine, not a specific cause. Keep modifiers such as visible or microscopic; do not infer severity. [Source](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hematuria) |
| hormone | `hormone` → `chemical messenger`<br>`hormones` → `chemical messengers` | Keep singular and plural messenger forms. This general term does not identify a hormone, its level, or the cause of a symptom; named compounds may still need the original wording. [Source](https://medlineplus.gov/hormones.html) [Source](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hormone) |
| lipoprotein | `lipoprotein` → `fat-and-protein particle`<br>`lipoproteins` → `fat-and-protein particles` | Keep particle number and the distinction from cholesterol itself. Full density subtype names and lipoprotein (a) have separate annotation-only entries that take precedence. [Source](https://medlineplus.gov/cholesterol.html) [Source](https://medlineplus.gov/lab-tests/lipoprotein-a-blood-test/) |
| renal-disease | `renal disease` → `kidney disease`<br>`renal diseases` → `kidney diseases` | Only these complete noun phrases are replaced, preserving singular or plural. Disease is not changed to failure; standalone renal and already plain aliases stay unchanged. [Source](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Renal) [Source](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/renal-failure) |
| renal-failure | `renal failure` → `kidney failure` | Keep the complete failure phrase and any surrounding acute or chronic modifier. Do not reduce kidney disease generally to failure or infer a stage. [Source](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/renal-failure) [Source](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Renal) |
| renal-function | `renal function` → `kidney function` | Keep the noun function and any modifier or number. The complete phrase describes kidney performance without interpreting a laboratory value. [Source](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Renal) [Source](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/renal-failure) |
| ultrasound | `ultrasonography` → `ultrasound` | Use the established alternative name for the imaging procedure. The already plain word ultrasound stays unchanged; this does not interpret an image. [Source](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/ultrasound) |

The [health fixtures](../data/coverage/health-reading.json) include a complete positive sentence for every added pair, 16 preserved-boundary examples, and 12 additional definition-only examples. Examples include **No renal failure was recorded. → No kidney failure was recorded.**, **The note reports microscopic haematuria. → The note reports microscopic blood in urine.**, and **These lipoproteins carry fats. → These fat-and-protein particles carry fats.** Negation, modifiers, articles and number stay in place. Full density subtype names and both lipoprotein(a) spacing forms take precedence and remain annotation-only. Already plain kidney disease/failure/function and ultrasound aliases are unchanged.

After inspecting [MedlinePlus arrhythmia](https://medlineplus.gov/arrhythmia.html), arrhythmia → irregular heartbeat was rejected: an arrhythmia can involve a regular but abnormal rate, and the everyday phrase can narrow the meaning. Edema, esophagus, enzyme and other tempting a/an-changing paraphrases remain excluded because the runtime does not infer article pronunciation. Short LDL/HDL/VLDL aliases and bare plaque are excluded despite the apparent coverage gain. Prediabetes is not shortened to diabetes; electrolyte names are not collapsed into salt; lipoproteins are not renamed cholesterol.

These comparisons are editorial, not independent expert sign-off. The exact source wording, named compounds, technical uses and unusual sentences may still require originals. A dictionary note cannot make the runtime understand arbitrary context.
