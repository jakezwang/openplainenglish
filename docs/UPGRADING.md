# Updating OpenPlainEnglish and restoring feedback

Unpacked installations do not update automatically. Keep an exported backup before replacing files, removing an installation, or moving to another browser. A backup is a local JSON file, separate from the extension and from any public GitHub issue.

## Moving to v0.4

**Plain reading** changes eligible health phrases in place; **Explain terms** keeps original words with explanations. **Restore original** turns the reader off. v0.4 adds one-occurrence restore, ignore-for-this-page controls and matching across supported inline formatting. These remain explicit phrase substitutions, not full-sentence rewriting. Reload existing pages after updating so an older injected reader is not left running.

The extension now remembers interface language, density, highlighting and reading mode locally. An older installation without preferences starts with **English / Comfortable / Subtle / Plain reading**. Valid existing fields are retained; missing or invalid fields receive safe defaults. Chinese changes the interface, not the English glossary or your notes. Changing settings or selecting a mode while off does not activate page access. A fresh page load always starts disabled.

Open **Reading preferences** in the glossary to change these settings. Shortcuts are Ctrl+Shift+L to toggle reading and Ctrl+Shift+U to restore; on macOS use Control, not Command. Browser conflicts may leave a shortcut unassigned. Inspect assignments at `chrome://extensions/shortcuts` or `edge://extensions/shortcuts`.

The feedback backup schema is unchanged. Schema-version-1 exports from v0.1–v0.3 remain supported after preview and confirmation, and restored notes retain their original glossary version. No account or network service is required. Automated tests cover schema compatibility; native upgrade and file-picker import remain unverified, so keep a backup until you have checked your installation.

## Back up your drafts

1. Open the extension's glossary page, then **Your feedback**.
2. Choose **Export JSON**. Save `openplainenglish-feedback-YYYY-MM-DD.json` somewhere you can find again.
3. Confirm the download exists before changing the installation. Exporting does not delete drafts or send them to the project.

The backup contains only draft ID, entry ID, term, category, your note, creation time and glossary version. It does **not** include reading preferences, ignored terms or page text. Note your preferred settings before changing installations. A note can contain sensitive information if you typed it there; keep your backup accordingly. There is no automatic sync or cloud copy.

**Copy report** and **Download report** provide one reviewed feedback report without a GitHub account. The downloaded `.txt` file is for manual sharing and cannot be restored with Import JSON. Use **Export JSON** for backups. Neither action sends feedback to the project automatically.

## Update the extension

1. Download the desired Chromium extension ZIP from [Releases](https://github.com/jakezwang/openplainenglish/releases), for example `openplainenglish-0.4.0.zip`, together with its checksum if you want to verify file integrity. The GitHub **Source code** archive is not the built extension.
2. Extract the ZIP and confirm `manifest.json` is at the extracted folder's root.
3. Replace the files in your existing unpacked-extension folder with the new release. Keeping the same installation folder helps preserve the existing installation; keep the exported backup regardless.
4. Open `chrome://extensions` or `edge://extensions` and choose **Reload** on OpenPlainEnglish. Confirm the expected version is shown.
5. Refresh web pages and reopen the glossary page. Check **Reading preferences** and **Your feedback**. Enable the reader again when needed, then try **Restore original** on invented text before relying on the updated installation.

Loading a different folder or moving to another browser can create a separate installation with separate storage. Removing the old extension removes its local drafts and preferences. Keep the backup until you have checked the new installation and restored any missing drafts. Feedback in the website's explicitly labeled browser preview uses that website's separate storage; it does not migrate into the extension automatically.

The separately named `openplainenglish-0.4.0-firefox-preview.zip` is an unsigned developer draft for Firefox 140 or later, not a Chromium update or a signed store installer. Native Firefox installation, upgrade and acceptance remain pending. The `openplainenglish-core-0.4.0.tgz` SDK is a separate developer library, not an extension installer; see the [SDK guide](SDK.md). The 8-entry public-service pilot belongs to the opt-in workshop/SDK and does not replace the extension's 112-entry health glossary.

## Restore a backup in v0.2 or later

1. Open **Your feedback → Import JSON** and choose the exported file. v0.1 exports are supported.
2. Review the file's draft count, new drafts to keep, duplicates and resulting total. Expand **Inspect the drafts in this file** to check terms and notes. The preview also shows existing or imported drafts that the capacity limit would leave out.
3. Choose **Merge local drafts** to confirm. **Cancel** or Escape leaves local drafts unchanged before the merge begins.
4. Read the final counts and inspect the saved drafts. Importing never opens GitHub or posts feedback.

The file is read locally before confirmation. The background handler validates it again before a serialized storage update, so an invalid file does not partially import. Concurrent changes in another window can affect the final counts.

## How merging works

- A draft's ID identifies it. If that ID already exists locally, the existing draft wins, even if the backup has different text. Reimporting the same backup does not duplicate those drafts.
- If the backup repeats an ID, the first record in the file wins.
- After deduplication, the newest 100 drafts by `createdAt` are kept. Equal timestamps are ordered by ascending ID; lower IDs are retained first at the capacity boundary.
- Historical entry IDs and glossary versions remain attached to restored notes. Import does not rewrite old notes or claim they refer to a current explanation.

Export your current drafts before merging a large backup if you want to preserve records that may fall outside the 100-draft limit.

## If a file is rejected

Import accepts the exported JSON envelope `{ "schemaVersion": 1, "feedback": [...] }`, up to **1 MiB** of UTF-8 data and **1,000 records**. Each record must contain the seven documented string fields, valid IDs and an ISO UTC creation time; categories are `unclear`, `inaccurate` or `suggestion`. Notes are limited to 2,000 Unicode code points and terms to 120.

Unsupported fields, invalid records, altered hidden formatting or oversized files are rejected as a whole. Choose the original feedback export instead of a document, copied webpage, or edited file. If a valid old export still fails, report the error message and extension version using invented data; do not attach private drafts.

## Roll back if needed

Export your current drafts first, replace the unpacked folder with the earlier release, and reload the extension and open pages. v0.1 can export drafts but has no import control; retain your backup until you use an import-capable release again. A software downgrade does not itself restore a previously deleted draft.

The [testing guide](TESTING.md) lists installation and runtime checks. A successful local demo or package checksum does not establish that the installed extension works in every browser.
