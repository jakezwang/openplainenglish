# Contributing to OpenPlainEnglish

The project aims to make public health language easier to understand while preserving the source wording. Contributions can be a confusing term, a clearer sentence, an accessibility observation, a source correction, a test, or a code change.

## Start with a small, concrete example

Use the [issue forms](https://github.com/jakezwang/openplainenglish/issues/new/choose) to explain what happened, what you expected, and which release you used. Plain language is welcome. A short made-up example or a link to public reference material is enough; please do not upload medical records or include names, account information, private browsing URLs, or other sensitive details.

Security concerns follow [SECURITY.md](SECURITY.md). Community participation follows [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Development

Use Node.js 22 or 24. Work in your own branch or fork:

```sh
npm ci
npm run check
npm run package
```

Build output lives in `dist/`; edit source files rather than compiled files. Load `dist/` as an unpacked extension in Chrome or Edge for browser checks. `npm run dev` starts the local demo and prints its URL. Keep the demo's own reader disabled when checking the installed extension. The popup and glossary previews use mock browser APIs and separate test-draft storage; use them for interface work, then test the actual extension for tab access, messaging, permissions, and persistence. The [testing guide](docs/TESTING.md) distinguishes automated checks from browser and packaging verification.

Keep pull requests focused. Explain the problem, resulting behavior, how you checked it, and any remaining limitations. Update relevant documentation when behavior or data boundaries change. Never commit personal content, credentials, browser profiles, feedback exports, build caches, or `node_modules/`.

## Glossary contributions

Read [docs/LEXICON.md](docs/LEXICON.md) and the [review rubric](docs/REVIEW.md) before changing `data/health.json`. Write explanations in your own words, keep the scope of the term clear, and include a primary, public reference that supports the meaning. Record the source's actual license; a citation alone is not permission to copy its text. The [source audit](docs/SOURCE-AUDIT.md) explains reproducible URL checks and their limits.

An entry needs its term, aliases, short meaning, fuller explanation, context, sources, and review metadata. Avoid implying that a term establishes a diagnosis or that one definition applies in every situation. A plain-language explanation must retain qualifications that affect meaning.

The `source-checked` label means the entry was compared with its cited source. It does not mean a clinician approved it or readers have demonstrated understanding. Do not add clinical, expert, accessibility, or comprehension-review claims unless the corresponding review has happened and can be described accurately.

AI-assisted wording is welcome as a draft. Check every factual statement, qualifier, source, and licensing claim before proposing it as source-checked. Prefer familiar, natural wording over strict word-origin rules or forced hyphenated coinages. A shorter phrase is useful only when it preserves the meaning. Keep source attribution and the product's no-endorsement statement visible.

Feedback does not require professional credentials. Tell us what you understood, what remained confusing, or which next question an explanation left unanswered. Proposals for reader studies should report the actual participants, tasks, comparison, and results rather than treating a readability score as proof of comprehension. The [participant protocol](docs/USER-TESTING.md) is a starting point that has not yet been run.

By submitting code or project documentation, you agree to contribute it under MIT. By submitting authored glossary content, you agree to dedicate that contribution under CC0 1.0. Submit only material you are entitled to contribute under those terms; third-party source rights remain separate.

## Review flow

1. Describe the reader problem and proposed change in an issue or pull request. Larger changes benefit from an issue first.
2. Add or update the source, explanation, implementation, and meaningful tests needed for the change.
3. Run `npm run check` and `npm run package`. For interface, injection, or permission changes, complete the relevant browser checks in [docs/TESTING.md](docs/TESTING.md).
4. A maintainer checks the evidence, licensing, language, context, privacy boundaries, accessibility, and test results. A passing test does not establish factual or clinical accuracy.
5. Address review comments. Maintainers merge only after the change and its review status match the evidence. Published data changes appear in a versioned release.

Feedback is a proposal until it has been reviewed and merged. Maintainers may narrow, rewrite, defer, or decline a suggestion when its meaning, license, or scope is unclear. There is no required response time.
