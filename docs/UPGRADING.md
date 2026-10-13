# Updating OpenPlainEnglish and restoring feedback

Unpacked installations do not update automatically. Keep an exported backup before replacing files, removing an installation, or moving to another browser. A backup is a local JSON file, separate from the extension and from any public GitHub issue.

## Back up your drafts

1. Open the extension's glossary page, then **Your feedback**.
2. Choose **Export JSON**. Save `openplainenglish-feedback-YYYY-MM-DD.json` somewhere you can find again.
3. Confirm the download exists before changing the installation. Exporting does not delete drafts or send them to the project.

The backup contains only draft ID, entry ID, term, category, your note, creation time and glossary version. It can contain sensitive information if you typed it into a note; keep your backup accordingly. There is no automatic sync or cloud copy.

## Update the extension

1. Download the desired versioned extension ZIP from [Releases](https://github.com/jakezwang/openplainenglish/releases), together with its checksum if you want to verify file integrity. The GitHub **Source code** archive is not the built extension.
2. Extract the ZIP and confirm `manifest.json` is at the extracted folder's root.
3. Replace the files in your existing unpacked-extension folder with the new release. Keeping the same installation folder helps preserve the existing installation; keep the exported backup regardless.
4. Open `chrome://extensions` or `edge://extensions` and choose **Reload** on OpenPlainEnglish. Confirm the expected version is shown.
5. Refresh web pages and reopen the glossary page. Enable the reader again when needed. Inspect **Your feedback** to see whether your drafts are present.

Loading a different folder or moving to another browser can create a separate installation with separate storage. Removing the old extension removes its local drafts. Keep the backup until you have checked the new installation and restored any missing drafts.

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
