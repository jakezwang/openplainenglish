# Lexicons v0.5

The bundled [health.json](../data/health.json) contains 132 entries for reading English health information. Each keeps the original term, a short meaning, an explanation, a context note, sources, and a review record. Topics include symptoms and conditions, blood and immune-system vocabulary, imaging and other tests, cancer treatment, and public-health research. It is a small editorial seed, not a complete medical dictionary.

Version 0.3 introduced 21 inline entries / 40 explicit pairs; v0.4 added 12 annotation-only entries. Version 0.5 now has 30 inline entries / 56 pairs and 20 additional entries. Existing short definitions never become substitutions automatically. Unchanged definition reviews retain their original dates; new definitions and new inline comparisons are dated 2026-10-14. The [coverage record](COVERAGE.md) reports the fixed sample and its remaining gaps; it does not claim population-wide frequency or comprehension.

The explanations are original project wording, written with AI assistance after comparison with the cited primary sources. The [data license](../data/LICENSE) is CC0-1.0 for those original contributions. The code license is separate. No terminology was copied from MedSimplify, University of Michigan PLMD, NAIC, Plain English Campaign, or Open Food Facts.

## What “source-checked” means

Every entry records the same method honestly:

> editorial source comparison; no independent clinical or user-comprehension review

The initial comparison occurred on **2026-10-13**. This means the wording was compared with the cited source material; it does not mean a clinician approved it, a user understood it, or a test established accuracy. No individual reviewer credentials, clinical approval, readability study, or comprehension score is claimed. The structural validator cannot establish any of these things.

The short meaning is only the first layer. Context notes preserve distinctions such as gastritis affecting the **stomach lining**, hypoxemia concerning **blood** versus hypoxia concerning **tissue**, and an adverse event occurring after treatment without proving causation. There are no dosage instructions, diagnostic thresholds, personal treatment suggestions, or individual risk estimates. The heart-attack entry identifies the condition as an emergency without attempting symptom triage.

## Rights and attribution evidence

`Public-Domain-US` in source metadata is a descriptive project label for the reviewed U.S. federal text. It is **not an SPDX identifier**, a claim that an entire website is unrestricted, or a statement about every jurisdiction. It is separate from `CC0-1.0`, which covers our original wording. Federal logos, images, third-party materials, and links to external articles have not been included.

| Publisher / source | Permission evidence checked 2026-10-13 | Included scope and boundary |
| --- | --- | --- |
| [CDC Everyday Words](https://www.cdc.gov/ccindex/everydaywords/index.html) | The [official 2016 publication record](https://stacks.cdc.gov/view/cdc/40455) is marked Public Domain; [Use of Agency Materials](https://www.cdc.gov/other/agencymaterials.html) gives reuse rules and exceptions. | Term alternatives and relevant examples checked through the public Everyday Words service used by the page. We wrote our own explanations. Attribution and the no-endorsement statement must remain visible in the product. No logos or images. |
| [NCI Dictionary of Cancer Terms](https://www.cancer.gov/publications/dictionaries/cancer-terms) | [NCI Reuse of Information](https://www.cancer.gov/policies/copyright-reuse) permits reuse of text unless indicated otherwise and asks for credit/linking. | Individual definition text, checked via the official glossary API. No images, audio, logo, or PDQ trademark. The original definition pages are linked per entry. |
| [MedlinePlus](https://medlineplus.gov/) | [Using Content](https://medlineplus.gov/about/using/usingcontent/) explicitly lists health-topic summaries, medical-test information, and named tutorials as public domain. | Only health-topic **summaries** and the medical-test articles listed below. A.D.A.M. encyclopedia articles, drug monographs, stock images, outside links, and bibliography sources are excluded. Source: MedlinePlus, National Library of Medicine. |
| [CDC Principles of Epidemiology glossary](https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/glossary.html) | [CDC agency-material policy](https://www.cdc.gov/other/agencymaterials.html); the [course overview](https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/index.html) identifies CDC as its developer. | Archived glossary used for the distinction between prevalence and incidence. It is an archived educational reference, not current clinical guidance. |
| [FDA postmarket safety explanation](https://www.fda.gov/drugs/cder-conversations/understanding-cders-postmarket-safety-surveillance-programs-and-public-data) | [FDA Website Policies](https://www.fda.gov/about-fda/about-website/website-policies) identify FDA text as public domain unless otherwise noted. | The adverse-event versus causation distinction. No safety-report dataset or individual reports were downloaded. |

**Attribution:** Definitions are adapted from cited public sources. CDC, NIH/NLM/NCI, FDA, and the U.S. Government do not endorse OpenPlainEnglish. Our explanations may differ from the original source wording; the links let readers inspect that wording.

Two sources in the early idea were attractive but were not used: [MedSimplify](https://github.com/Anyantd/MedSimplify) had no explicit reuse license in its repository and combined several upstream glossaries; [UMich PLMD](https://github.com/mlibrary/medical-dictionary) provided instructions to embed a widget but no explicit license for copying its dataset. Public visibility and free reading alone were not treated as permission to redistribute.

## Editorial choices and remaining limitations

- Original terms remain recoverable. Annotation explanations and optional inline replacement pairs are separate data: only an explicitly listed `from` string may use its corresponding `to` text. No entry authorizes interpreting a medical record or changing surrounding claims.
- Broad ambiguous matches such as `positive`, `negative`, `discharge`, `stroke`, `acute`, `chronic`, and `screening` are excluded as standalone terms. Phrases such as `acute illness`, `screening test`, and `disease transmission` narrow the meaning. Ambiguous short acronyms such as `MI`, `BP`, `RA`, `MS`, and `IV` are not aliases.
- Aliases are selected spellings, plurals, and established names, not automatically generated synonyms. Case folding is used for matching. A few useful abbreviations such as ECG, EKG, COPD, and MRI remain and can still be ambiguous outside health writing.
- The matcher is a word/phrase matcher, not a medical language model. It cannot detect every metaphor, negation, historical mention, hypothetical statement, nonmedical sense, or subtype. An explanation on a page does not mean the reader has that condition. Matching a shorter term inside a more specific medical phrase may give only the general meaning.
- Definitions aim at plain wording but have not been tested with readers. Terms such as “antigen” still need more than a one-word substitute. Health-literacy and clinical review remain future work.
- Source pages may change. The source-check date records this release's comparison, not continuous freshness. Run link/source review and bump the lexicon version when updating wording.
- English health reading is the default scope. An opt-in public-service phrase pilot is separate. Legal or benefits interpretation, insurance, food-label interpretation, scanned PDFs, and multilingual meanings are not included.

## Schema and checks

The root object has `schemaVersion`, semantic release `version`, `license`, and `entries`. Each entry has:

| Field | Meaning / validation |
| --- | --- |
| `id` | Stable lowercase kebab-case identifier; unique with case folding. |
| `term` and `aliases` | Literal match strings, unique across all entries after Unicode compatibility normalization, case folding, and whitespace normalization. |
| `domain` | `health` for the default lexicon; `public-service` only in the separate opt-in pilot. |
| `short` | Plain-text initial meaning, at most 96 Unicode characters. |
| `explanation` | Fuller plain-text explanation, at most 500 characters. |
| `context` | Scope or a relevant distinction, at most 500 characters. |
| `sources` | At least one `{label, url, license}` record; HTTPS primary-source host; no URL credentials/custom ports; no licensed MedlinePlus encyclopedia/drug-monograph paths. |
| `review` | Only `source-checked` is accepted, with a real ISO date and the exact limitation-bearing method for its domain. |
| `inline` (optional) | A dedicated `{replacements: [{from, to}], note, review}` record. Sources inherit the entry's validated citations; a separate inline review records comparison of the replacements. Each source is an existing term/alias; targets are plain text of at most 96 characters. No automatic substitution from `short`, inferred inflections, or identity pairs. See [the inline rules and ledger](INLINE-LEXICON.md). |

Run `node scripts/validate-lexicon.mjs` and `node --test tests/lexicon.test.mjs`. The validator also exports `validateLexicon` (returns an array of errors) and `assertValidLexicon` (returns the data or throws). Tests exercise collisions, malformed structures, missing metadata, unsafe/unsupported source URLs, excessive lengths, unearned review claims, and several important semantic distinctions. Inline checks additionally reject duplicate or foreign source strings, identity pairs, missing nested review metadata, unsupported fields, markup, and control or hidden formatting characters. Invented sentence-pair fixtures protect selected grammatical and meaning distinctions without claiming full-context understanding.

These are **offline structural and provenance checks**. They do not fetch URLs, confirm that a host still serves a definition, verify licenses for future pages, or certify medical correctness. Adding a host to the allowlist requires reviewing its actual source material and rights, not merely its domain suffix.

## Source-comparison ledger

All rows below were checked on **2026-10-13**. The links are the human-readable primary references also bundled with each entry. NCI dictionary definitions were retrieved through its documented [official glossary API](https://webapis.cancer.gov/glossary/v1/swagger/v1/swagger.json), using the exact definition slug; missing definitions were replaced with verified sources, not inferred from a 404 page. CDC alternatives and examples were retrieved using the public `tools.cdc.gov/ewapi/everydaywords.svc/entries?term=...` endpoint named in the official page. MedlinePlus comparisons used the public-domain summary section or medical-test article itself, not its linked third-party materials.

This ledger records source comparison, not an independent expert review. Each entry's health meaning and context distinction remain open to correction.

| Entry | Reference(s) compared |
| --- | --- |
| `acute-illness` | [CDC Everyday Words: Acute](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Acute) |
| `adverse-event` | [CDC Everyday Words: Adverse Event](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Adverse%20Event); [FDA: Understanding Postmarket Safety Surveillance](https://www.fda.gov/drugs/cder-conversations/understanding-cders-postmarket-safety-surveillance-programs-and-public-data) |
| `anemia` | [MedlinePlus, National Library of Medicine: anemia](https://medlineplus.gov/anemia.html) |
| `angina` | [CDC Everyday Words: Angina](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Angina) |
| `antibody` | [National Cancer Institute: antibody](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/antibody) |
| `antigen` | [National Cancer Institute: antigen](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/antigen); [National Cancer Institute: antibody](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/antibody) |
| `arrhythmia` | [MedlinePlus, National Library of Medicine: arrhythmia](https://medlineplus.gov/arrhythmia.html) |
| `arthritis` | [National Cancer Institute: arthritis](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/arthritis) |
| `asthma` | [National Cancer Institute: asthma](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/asthma) |
| `bacteria` | [National Cancer Institute: bacteria](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/bacteria) |
| `benign-tumor` | [National Cancer Institute: benign tumor](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/benign-tumor) |
| `biopsy` | [National Cancer Institute: biopsy](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/biopsy) |
| `blood-glucose` | [CDC Everyday Words: Glucose](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Glucose) |
| `bradycardia` | [MedlinePlus, National Library of Medicine: arrhythmia](https://medlineplus.gov/arrhythmia.html) |
| `bronchitis` | [National Cancer Institute: bronchitis](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/bronchitis) |
| `carcinogen` | [CDC Everyday Words: Carcinogen](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Carcinogen) |
| `carcinoma` | [National Cancer Institute: carcinoma](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/carcinoma) |
| `case-report` | [CDC Everyday Words: Case report](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Case%20report) |
| `case-control-study` | [CDC Everyday Words: Case-control study](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Case-control%20study) |
| `chemotherapy` | [National Cancer Institute: chemotherapy](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/chemotherapy) |
| `chronic-disease` | [CDC Everyday Words: Chronic disease](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Chronic%20disease) |
| `chronic-obstructive-pulmonary-disease` | [National Cancer Institute: chronic obstructive pulmonary disease](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/chronic-obstructive-pulmonary-disease) |
| `cirrhosis` | [National Cancer Institute: cirrhosis](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/cirrhosis) |
| `complete-blood-count` | [National Cancer Institute: complete blood count](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/complete-blood-count) |
| `computed-tomography` | [National Cancer Institute: ct scan](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/ct-scan) |
| `constipation` | [National Cancer Institute: constipation](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/constipation) |
| `contagious` | [CDC Everyday Words: Contagious](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Contagious) |
| `dehydration` | [National Cancer Institute: dehydration](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/dehydration) |
| `diabetes-mellitus` | [National Cancer Institute: diabetes mellitus](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/diabetes-mellitus) |
| `dialysis` | [National Cancer Institute: dialysis](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/dialysis) |
| `diarrhea` | [National Cancer Institute: diarrhea](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/diarrhea) |
| `dysphagia` | [National Cancer Institute: dysphagia](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/dysphagia) |
| `dyspnea` | [National Cancer Institute: dyspnea](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/dyspnea) |
| `echocardiogram` | [National Cancer Institute: echocardiogram](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/echocardiogram); [National Cancer Institute: electrocardiogram](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/electrocardiogram) |
| `edema` | [National Cancer Institute: edema](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/edema) |
| `electrocardiogram` | [National Cancer Institute: electrocardiogram](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/electrocardiogram); [National Cancer Institute: echocardiogram](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/echocardiogram) |
| `embolism` | [National Cancer Institute: embolism](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/embolism) |
| `end-stage-renal-disease` | [CDC Everyday Words: End-stage renal disease](https://www.cdc.gov/ccindex/everydaywords/index.html?word=End-stage%20renal%20disease); [National Cancer Institute: renal failure](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/renal-failure) |
| `epidemiology` | [CDC Everyday Words: Epidemiology](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Epidemiology) |
| `esophagus` | [National Cancer Institute: esophagus](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/esophagus) |
| `evidence-based-care` | [CDC Everyday Words: Evidence-based](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Evidence-based) |
| `gastritis` | [National Cancer Institute: gastritis](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/gastritis) |
| `gastroesophageal-reflux-disease` | [MedlinePlus, National Library of Medicine: gerd](https://medlineplus.gov/gerd.html) |
| `health-care-provider` | [CDC Everyday Words: Health care provider](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Health%20care%20provider) |
| `health-disparities` | [CDC Everyday Words: Health disparities](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Health%20disparities) |
| `health-screening` | [National Cancer Institute: screening](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/screening) |
| `hematocrit` | [National Cancer Institute: hematocrit](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hematocrit) |
| `hematuria` | [National Cancer Institute: hematuria](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hematuria) |
| `hemoglobin` | [National Cancer Institute: hemoglobin](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hemoglobin) |
| `hepatitis` | [MedlinePlus, National Library of Medicine: hepatitis](https://medlineplus.gov/hepatitis.html) |
| `hyperglycemia` | [CDC Everyday Words: Hyperglycemia](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Hyperglycemia) |
| `hypertension` | [CDC Everyday Words: Hypertension](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Hypertension); [MedlinePlus, National Library of Medicine: highbloodpressure](https://medlineplus.gov/highbloodpressure.html) |
| `hypoglycemia` | [CDC Everyday Words: Hypoglycemia](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Hypoglycemia) |
| `hypotension` | [CDC Everyday Words: Hypotension](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Hypotension); [National Cancer Institute: hypotension](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hypotension) |
| `hypoxemia` | [National Cancer Institute: hypoxemia](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hypoxemia); [National Cancer Institute: hypoxia](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hypoxia) |
| `hypoxia` | [National Cancer Institute: hypoxia](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hypoxia); [National Cancer Institute: hypoxemia](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hypoxemia) |
| `immune-system` | [CDC Everyday Words: Immune system](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Immune%20system) |
| `immunization` | [CDC Everyday Words: Immunization](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Immunization) |
| `immunosuppression` | [National Cancer Institute: immunosuppression](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/immunosuppression) |
| `immunotherapy` | [National Cancer Institute: immunotherapy](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/immunotherapy) |
| `incidence-rate` | [CDC Everyday Words: Incidence rate](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Incidence%20rate); [CDC epidemiology glossary: incidence rate](https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/glossary.html) |
| `incubation-period` | [CDC Everyday Words: Incubation period](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Incubation%20period) |
| `infection` | [CDC Everyday Words: Infection](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Infection); [CDC Everyday Words: Infectious diseases](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Infectious%20diseases) |
| `infection-transmission` | [CDC Everyday Words: Transmit, transmission](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Transmit); [CDC Everyday Words: Infectious diseases](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Infectious%20diseases) |
| `infectious-disease` | [CDC Everyday Words: Infectious diseases](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Infectious%20diseases) |
| `inflammation` | [National Cancer Institute: inflammation](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/inflammation) |
| `insulin` | [National Cancer Institute: insulin](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/insulin) |
| `ischemic-heart-disease` | [CDC Everyday Words: Ischemic heart disease](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Ischemic%20heart%20disease) |
| `jaundice` | [MedlinePlus, National Library of Medicine: jaundice](https://medlineplus.gov/jaundice.html) |
| `magnetic-resonance-imaging` | [National Cancer Institute: magnetic resonance imaging](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/magnetic-resonance-imaging) |
| `malignant-tumor` | [National Cancer Institute: malignant](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/malignant) |
| `metastasis` | [National Cancer Institute: metastasis](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/metastasis) |
| `morbidity` | [CDC Everyday Words: Morbidity](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Morbidity); [CDC Everyday Words: Mortality rate](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Mortality%20rate) |
| `mortality-rate` | [CDC Everyday Words: Mortality rate](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Mortality%20rate) |
| `myocardial-infarction` | [MedlinePlus, National Library of Medicine: heartattack](https://medlineplus.gov/heartattack.html) |
| `nausea` | [National Cancer Institute: nausea](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/nausea) |
| `osteoporosis` | [National Cancer Institute: osteoporosis](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/osteoporosis) |
| `peripheral-neuropathy` | [MedlinePlus, National Library of Medicine: peripheralnervedisorders](https://medlineplus.gov/peripheralnervedisorders.html) |
| `platelet` | [National Cancer Institute: platelet](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/platelet) |
| `pneumonia` | [MedlinePlus, National Library of Medicine: pneumonia](https://medlineplus.gov/pneumonia.html) |
| `prevalence` | [CDC Everyday Words: Prevalence](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Prevalence); [CDC Principles of Epidemiology: Glossary](https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/glossary.html) |
| `prognosis` | [National Cancer Institute: prognosis](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/prognosis) |
| `proteinuria` | [National Cancer Institute: proteinuria](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/proteinuria) |
| `public-health` | [CDC Everyday Words: Public health](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Public%20health) |
| `pulse-oximetry` | [MedlinePlus, National Library of Medicine: pulse oximetry](https://medlineplus.gov/lab-tests/pulse-oximetry/) |
| `radiation-therapy` | [National Cancer Institute: radiation therapy](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/radiation-therapy) |
| `red-blood-cell` | [National Cancer Institute: red blood cell](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/red-blood-cell) |
| `renal` | [CDC Everyday Words: Renal](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Renal) |
| `respiratory` | [CDC Everyday Words: Respiratory](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Respiratory) |
| `risk-factor` | [CDC Everyday Words: Risk factor](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Risk%20factor) |
| `sleep-apnea` | [MedlinePlus, National Library of Medicine: sleepapnea](https://medlineplus.gov/sleepapnea.html) |
| `spirometry` | [MedlinePlus, National Library of Medicine: lung function tests](https://medlineplus.gov/lab-tests/lung-function-tests/) |
| `tachycardia` | [MedlinePlus, National Library of Medicine: arrhythmia](https://medlineplus.gov/arrhythmia.html) |
| `thrombosis` | [National Cancer Institute: thrombosis](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/thrombosis) |
| `toxic-exposure` | [CDC Everyday Words: Toxic](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Toxic); [CDC Everyday Words: Exposure](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Exposure) |
| `ultrasound` | [National Cancer Institute: ultrasound](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/ultrasound) |
| `urinary-tract-infection` | [National Cancer Institute: urinary tract infection](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/urinary-tract-infection) |
| `vaccine` | [CDC Everyday Words: Vaccine](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Vaccine); [National Cancer Institute: vaccine](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/vaccine) |
| `virus` | [CDC Everyday Words: Virus](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Virus) |
| `white-blood-cell` | [National Cancer Institute: white blood cell](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/white-blood-cell) |

## v0.4 additions and source comparison

On 2026-10-13, the authored medical-test information and health-topic summaries below were read and compared with the new explanations. All 12 additions are annotation-only: changing a substance into its definition, or a specific test into a generic test, would lose meaning or grammatical fit. Test error phrases are complete phrases; standalone positive and negative remain excluded. The A1C test has full test-name aliases, including the parenthesized spelling used by MedlinePlus, but no bare A1C, HbA1c, or CMP acronym alias.

| Added entry | Primary reference compared |
| --- | --- |
| `albumin` | [MedlinePlus, National Library of Medicine: Albumin Blood Test](https://medlineplus.gov/lab-tests/albumin-blood-test/); [MedlinePlus, National Library of Medicine: Comprehensive Metabolic Panel (CMP)](https://medlineplus.gov/lab-tests/comprehensive-metabolic-panel-cmp/) |
| `atherosclerosis` | [MedlinePlus, National Library of Medicine: Cholesterol](https://medlineplus.gov/cholesterol.html) |
| `bilirubin` | [MedlinePlus, National Library of Medicine: Comprehensive Metabolic Panel (CMP)](https://medlineplus.gov/lab-tests/comprehensive-metabolic-panel-cmp/) |
| `cholesterol` | [MedlinePlus, National Library of Medicine: Cholesterol](https://medlineplus.gov/cholesterol.html) |
| `comprehensive-metabolic-panel` | [MedlinePlus, National Library of Medicine: Comprehensive Metabolic Panel (CMP)](https://medlineplus.gov/lab-tests/comprehensive-metabolic-panel-cmp/) |
| `creatinine` | [MedlinePlus, National Library of Medicine: Creatinine Test](https://medlineplus.gov/lab-tests/creatinine-test/) |
| `electrolyte` | [MedlinePlus, National Library of Medicine: Comprehensive Metabolic Panel (CMP)](https://medlineplus.gov/lab-tests/comprehensive-metabolic-panel-cmp/) |
| `false-negative-result` | [MedlinePlus, National Library of Medicine: How to Understand Your Lab Results](https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/) |
| `false-positive-result` | [MedlinePlus, National Library of Medicine: How to Understand Your Lab Results](https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/) |
| `hemoglobin-a1c-test` | [MedlinePlus, National Library of Medicine: Hemoglobin A1C (HbA1c) Test](https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/) |
| `reference-range` | [MedlinePlus, National Library of Medicine: How to Understand Your Lab Results](https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/) |
| `triglyceride` | [MedlinePlus, National Library of Medicine: Triglycerides](https://medlineplus.gov/triglycerides.html); [MedlinePlus, National Library of Medicine: Cholesterol](https://medlineplus.gov/cholesterol.html) |

## Separate public-service pilot

[data/pilots/public-service.json](../data/pilots/public-service.json) contains 8 entries with 14 explicit pairs. It uses the same schema and CC0 license for authored wording, with domain `public-service`. It is an opt-in reading/workbench experiment and is not part of the default health bundle. It shortens a small set of formal phrases and verbs; it does not interpret law, deadlines, eligibility, or obligations. [Pair boundaries and examples](INLINE-LEXICON.md#public-service-opt-in-pilot) accompany the data.

Its review method is **editorial source comparison; no independent domain-expert or user-comprehension review**. No independent human review or user study has been completed. The pilot sources are [CPSC Plain Language Principles](https://www.cpsc.gov/About-CPSC/Policies-Statements-and-Directives/plain-language-principles) and [Digital.gov Familiar terms](https://digital.gov/guides/writing-understanding/familiar-terms), checked 2026-10-13. CPSC permits copying web text with credit and no implied endorsement in its [copyright notice](https://www.cpsc.gov/About-CPSC/Policies-Statements-and-Directives/Privacy-Policy). [Digital.gov reuse policy](https://digital.gov/policies#reuse-and-copyright) allows most authored material to be copied and distributed, with exceptions for licensed material. Only the government-authored prose/table alternatives are used; no logos, credited images, or outside content. Source: U.S. Consumer Product Safety Commission; Digital.gov, U.S. General Services Administration. Neither agency nor the U.S. Government endorses OpenPlainEnglish.

See the [contributor and two-person review process](COMMUNITY.md) and [review package form](REVIEW.md#independent-review-package). These describe work still needed; a policy document does not turn editorial comparisons into independent reviews.

## v0.5 additions and source comparison

Twenty new entries were compared with the cited primary text on **2026-10-14**. Sixteen address concepts already labeled in the fixed four-page corpus. Three complete renal noun phrases provide useful, bounded alternatives to replacing the standalone adjective. The specific lipoprotein (a) entry protects that named subtype from a general lipoprotein substitution. Bare plaque and the HDL/LDL/VLDL abbreviations remain excluded. No source-host or rights expansion was needed. MedlinePlus summary/test and NCI text reuse policies were reread; external references, encyclopedia text and graphics remain excluded.

| Added entry | Meaning / ambiguity boundary | Primary comparison |
| --- | --- | --- |
| `bicarbonate` | A bicarbonate blood result does not by itself identify why the level is high or low. | [MedlinePlus, National Library of Medicine: Carbon Dioxide (CO2) in Blood](https://medlineplus.gov/lab-tests/carbon-dioxide-co2-in-blood/) |
| `blood-urea-nitrogen` | This is not the same as a creatinine result or a diagnosis of kidney failure. The abbreviation BUN is not matched on its own. | [MedlinePlus, National Library of Medicine: BUN (Blood Urea Nitrogen)](https://medlineplus.gov/lab-tests/bun-blood-urea-nitrogen/) |
| `calcium` | A blood calcium result is not the same as the amount of calcium in bones. | [MedlinePlus, National Library of Medicine: Calcium Blood Test](https://medlineplus.gov/lab-tests/calcium-blood-test/) |
| `chloride` | Chloride is not chlorine gas. Its name alone does not interpret a blood-test result. | [MedlinePlus, National Library of Medicine: Chloride Blood Test](https://medlineplus.gov/lab-tests/chloride-blood-test/) |
| `enzyme` | The particular enzyme and test matter; the general word does not identify an organ problem. | [National Cancer Institute: enzyme](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/enzyme); [MedlinePlus, National Library of Medicine: Comprehensive Metabolic Panel](https://medlineplus.gov/lab-tests/comprehensive-metabolic-panel-cmp/) |
| `globulin` | Globulins are a group, not one single protein. A general globulin result does not identify a particular antibody. | [MedlinePlus, National Library of Medicine: Globulin Test](https://medlineplus.gov/lab-tests/globulin-test/) |
| `high-density-lipoprotein` | The label good cholesterol is a shorthand, not a guarantee of health. The abbreviation HDL is not matched on its own. | [MedlinePlus, National Library of Medicine: Cholesterol](https://medlineplus.gov/cholesterol.html) |
| `hormone` | Different hormones have different jobs. The word alone does not identify a particular hormone or explain a symptom. | [MedlinePlus, National Library of Medicine: Hormones](https://medlineplus.gov/hormones.html); [National Cancer Institute: hormone](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/hormone) |
| `lipoprotein` | A lipoprotein particle is not the same thing as cholesterol itself. Specific named types keep their names. | [MedlinePlus, National Library of Medicine: Cholesterol](https://medlineplus.gov/cholesterol.html); [MedlinePlus, National Library of Medicine: Lipoprotein (a) Blood Test](https://medlineplus.gov/lab-tests/lipoprotein-a-blood-test/) |
| `lipoprotein-a` | This exact named subtype is kept for annotation rather than replaced by a general particle description. | [MedlinePlus, National Library of Medicine: Lipoprotein (a) Blood Test](https://medlineplus.gov/lab-tests/lipoprotein-a-blood-test/) |
| `low-density-lipoprotein` | The particle and the cholesterol it carries are related but different. The short abbreviation LDL is not matched on its own. | [MedlinePlus, National Library of Medicine: Cholesterol](https://medlineplus.gov/cholesterol.html) |
| `metabolism` | This word describes processes, not a diagnosis or a measurement of body weight. | [National Cancer Institute: metabolism](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/metabolism) |
| `potassium` | The name identifies a substance. A high or low result needs its units, reference range, and other clinical information. | [MedlinePlus, National Library of Medicine: Potassium Blood Test](https://medlineplus.gov/lab-tests/potassium-blood-test/) |
| `prediabetes` | This explanation gives no numerical cutoff and cannot classify a reader from a single result. | [MedlinePlus, National Library of Medicine: Hemoglobin A1C Test](https://medlineplus.gov/lab-tests/hemoglobin-a1c-hba1c-test/) |
| `renal-disease` | Kidney disease does not always mean kidney failure. Standalone renal remains an adjective for annotation. | [CDC Everyday Words: Renal](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Renal); [National Cancer Institute: renal-failure](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/renal-failure) |
| `renal-failure` | The phrase does not itself say whether the problem is sudden, lasting, or at a particular stage. | [National Cancer Institute: renal-failure](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/renal-failure); [CDC Everyday Words: Renal](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Renal) |
| `renal-function` | The phrase is about kidney performance, not a diagnosis or one specific laboratory test. | [CDC Everyday Words: Renal](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Renal); [National Cancer Institute: renal-failure](https://www.cancer.gov/publications/dictionaries/cancer-terms/def/renal-failure) |
| `sodium` | Sodium is one part of table salt; the words sodium and salt are not interchangeable. | [MedlinePlus, National Library of Medicine: Sodium Blood Test](https://medlineplus.gov/lab-tests/sodium-blood-test/) |
| `total-protein` | The sample matters: a blood-test total is not a measure of how much protein someone eats. | [MedlinePlus, National Library of Medicine: Total Protein and Albumin/Globulin Ratio](https://medlineplus.gov/lab-tests/total-protein-and-albumin-globulin-a-g-ratio/) |
| `very-low-density-lipoprotein` | The abbreviation VLDL is not matched on its own, and this explanation does not interpret a test result. | [MedlinePlus, National Library of Medicine: Cholesterol](https://medlineplus.gov/cholesterol.html) |

Existing entries with new inline metadata are carcinogen, hematuria, end-stage renal disease and ultrasound. Chronic disease adds the explicit plural alias/pair chronic illnesses → long-term illnesses; its definition remains unchanged. All original definitions and citations remain intact. Each new pair has its own 2026-10-14 inline comparison record and regression examples in the [inline ledger](INLINE-LEXICON.md). No independent clinical or comprehension review was completed.
