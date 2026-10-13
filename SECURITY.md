# Security policy

OpenPlainEnglish reads page text after an explicit user action and stores local feedback drafts. Access beyond that boundary, execution of untrusted page content, unexpected disclosure, or unintended permissions are security concerns.

The project is an early release maintained on a best-effort basis. Reports should identify the affected version or commit; fixes are intended for the latest release. No response or fix timeline is promised.

## Report a concern

If this repository has GitHub private vulnerability reporting enabled, use **Security → Report a vulnerability** at [the repository's security page](https://github.com/jakezwang/openplainenglish/security). Include a minimal reproduction, the affected version, the impact, and steps to reproduce using invented or public data.

If that private option is unavailable, open a public issue that only says you need a private channel for a potential security report. Do not include exploit details, credentials, private page content, medical information, or attachments in that public issue. A maintainer can arrange a reporting route. The project does not publish a security email address.

A confusing or inaccurate definition can be reported through the glossary issue form without personal medical details. If the problem could expose information or compromise a browser, use the security route above.

## Development boundaries

Use local or invented fixtures for tests. Do not use browser profiles, tokens, production credentials, or real health records as test data. Changes to permissions, message handlers, injected UI, storage, or external navigation need explicit review and the relevant checks in [docs/TESTING.md](docs/TESTING.md).

Page text, contributed explanations, and feedback notes are untrusted data. Rendering must keep their content as text, validate external link protocols, and preserve the allowlist of feedback fields. Do not add automatic page-context uploads or accept commands from ordinary page scripts. Saves and deletions share the background operation queue so simultaneous actions do not overwrite unrelated drafts.

The reader adds markers to the visited page's DOM; this is not a confidential display channel hidden from that page. Local draft storage is browser extension storage, not an encrypted vault or a backup. Opening a prepared GitHub issue sends its prefilled fields in the navigation URL before the issue is posted. Deleting a local draft does not remove that browser-history entry or delete a published issue. See [the privacy policy](docs/PRIVACY.md) for the complete sharing boundaries.

The public preview adapter in `demo/` intentionally mocks extension APIs and stores invented test drafts separately in web-origin localStorage. It remains outside extension release artifacts. Its behavior cannot establish the security of an installed extension. The site build publishes only its public asset allowlist. Release ZIP checksums provide file-integrity comparisons; the project does not claim signed packages or an independent security audit.
