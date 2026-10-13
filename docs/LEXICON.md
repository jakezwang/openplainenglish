# Health lexicon v0.1

The bundled [health.json](../data/health.json) contains 100 entries for reading English health information. Each keeps the original term, a short meaning, an explanation, a context note, sources, and a review record. Topics include symptoms and conditions, blood and immune-system vocabulary, imaging and other tests, cancer treatment, and public-health research. It is a small editorial seed, not a complete medical dictionary.

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
| [MedlinePlus](https://medlineplus.gov/) | [Using Content](https://medlineplus.gov/about/using/usingcontent/) explicitly lists health-topic summaries, medical-test information, and named tutorials as public domain. | Only health-topic **summaries** and the two medical-test articles listed below. A.D.A.M. encyclopedia articles, drug monographs, stock images, outside links, and bibliography sources are excluded. Source: MedlinePlus, National Library of Medicine. |
| [CDC Principles of Epidemiology glossary](https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/glossary.html) | [CDC agency-material policy](https://www.cdc.gov/other/agencymaterials.html); the [course overview](https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/index.html) identifies CDC as its developer. | Archived glossary used for the distinction between prevalence and incidence. It is an archived educational reference, not current clinical guidance. |
| [FDA postmarket safety explanation](https://www.fda.gov/drugs/cder-conversations/understanding-cders-postmarket-safety-surveillance-programs-and-public-data) | [FDA Website Policies](https://www.fda.gov/about-fda/about-website/website-policies) identify FDA text as public domain unless otherwise noted. | The adverse-event versus causation distinction. No safety-report dataset or individual reports were downloaded. |

**Attribution:** Definitions are adapted from cited public sources. CDC, NIH/NLM/NCI, FDA, and the U.S. Government do not endorse OpenPlainEnglish. Our explanations may differ from the original source wording; the links let readers inspect that wording.

Two sources in the early idea were attractive but were not used: [MedSimplify](https://github.com/Anyantd/MedSimplify) had no explicit reuse license in its repository and combined several upstream glossaries; [UMich PLMD](https://github.com/mlibrary/medical-dictionary) provided instructions to embed a widget but no explicit license for copying its dataset. Public visibility and free reading alone were not treated as permission to redistribute.

## Editorial choices and remaining limitations

- Original terms are kept. No entry is an instruction to replace the source text or reinterpret a medical record.
- Broad ambiguous matches such as `positive`, `negative`, `discharge`, `stroke`, `acute`, `chronic`, and `screening` are excluded as standalone terms. Phrases such as `acute illness`, `screening test`, and `disease transmission` narrow the meaning. Ambiguous short acronyms such as `MI`, `BP`, `RA`, `MS`, and `IV` are not aliases.
- Aliases are selected spellings, plurals, and established names, not automatically generated synonyms. Case folding is used for matching. A few useful abbreviations such as ECG, EKG, COPD, and MRI remain and can still be ambiguous outside health writing.
- The matcher is a word/phrase matcher, not a medical language model. It cannot detect every metaphor, negation, historical mention, hypothetical statement, nonmedical sense, or subtype. An explanation on a page does not mean the reader has that condition. Matching a shorter term inside a more specific medical phrase may give only the general meaning.
- Definitions aim at plain wording but have not been tested with readers. Terms such as “antigen” still need more than a one-word substitute. Health-literacy and clinical review remain future work.
- Source pages may change. The source-check date records this release's comparison, not continuous freshness. Run link/source review and bump the lexicon version when updating wording.
- English, general health, and a small vocabulary are the current scope. Legal, insurance, food-label, document-level interpretation, scanned PDFs, and multilingual meanings are not included.

## Schema and checks

The root object has `schemaVersion`, semantic release `version`, `license`, and `entries`. Each entry has:

| Field | Meaning / validation |
| --- | --- |
| `id` | Stable lowercase kebab-case identifier; unique with case folding. |
| `term` and `aliases` | Literal match strings, unique across all entries after Unicode compatibility normalization, case folding, and whitespace normalization. |
| `domain` | `health` in this release. |
| `short` | Plain-text initial meaning, at most 96 Unicode characters. |
| `explanation` | Fuller plain-text explanation, at most 500 characters. |
| `context` | Scope or a relevant distinction, at most 500 characters. |
| `sources` | At least one `{label, url, license}` record; HTTPS primary-source host; no URL credentials/custom ports; no licensed MedlinePlus encyclopedia/drug-monograph paths. |
| `review` | Only `source-checked` is accepted in v0.1, with a real ISO date and the exact limitation-bearing method above. |

Run `node scripts/validate-lexicon.mjs` and `node --test tests/lexicon.test.mjs`. The validator also exports `validateLexicon` (returns an array of errors) and `assertValidLexicon` (returns the data or throws). Tests exercise collisions, malformed structures, missing metadata, unsafe/unsupported source URLs, excessive lengths, unearned review claims, and several important semantic distinctions.

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
| `incidence-rate` | [CDC Everyday Words: Incidence rate](https://www.cdc.gov/ccindex/everydaywords/index.html?word=Incidence%20rate) |
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
