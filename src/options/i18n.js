// Interface copy only. Dictionary wording and user-authored notes stay as written.
const translations = new Map(Object.entries({
  'Skip to content':'跳到正文','About and navigation':'介绍和导航','An open reading companion':'开放的阅读助手','Useful words,':'让词语更易懂，','within reach.':'随手可查。','Main navigation':'主导航','The glossary':'词库','Your feedback':'你的反馈','Local by default.':'默认保存在本机。','No account. No automatic uploads.':'无需账号，不会自动上传。','Built to make reading a little easier.':'让阅读容易一点。','The open-source project ↗':'开源项目 ↗','Local glossary':'本机词库',
  '01 / The health glossary':'01 / 健康词库','Words you can':'让每个词','make sense of.':'更容易理解。','See which health phrases change in plain reading, the words they become, and the sources behind them. Other terms keep their original wording and offer explanations.':'查看白话阅读会替换哪些健康词语、替换用词和资料来源。其余词语保留原文并提供解释。','Find an original word, replacement or meaning':'搜索原词、替换用词或释义','Try inflammation, heart, or a term you’ve seen…':'试试 inflammation、heart 或读到的英文词语…','Explanations adapted from cited public sources. CDC, NIH/NLM/NCI, FDA and the U.S. Government do not endorse OpenPlainEnglish.':'释义参考所列公开资料。CDC、NIH/NLM/NCI、FDA 及美国政府均未为 OpenPlainEnglish 背书。','Loading the glossary…':'正在加载词库…','Plain meanings. Original words.':'易懂释义，原词可查。','No matches yet. Try another word, or':'没有匹配结果。换个词，或','suggest a term':'建议新增词条','for the glossary.':'到词库。','A note on these explanations':'关于这些释义','“Source-checked” means an explanation was checked against its cited source. It does not mean it was independently clinically reviewed or tested for understanding. Plain reading applies a limited set of reviewed phrase substitutions. It does not rewrite every sentence or interpret your health. These meanings do not diagnose a condition or replace advice about your care.':'“已核对来源”仅指与引用资料做过对照，不代表独立临床审核或读者理解测试。白话阅读仅替换部分经过核对的词语，不会改写每个句子、判断你的健康状况、诊断疾病或替代诊疗建议。',
  '02 / Your feedback':'02 / 你的反馈','Clarity is':'清楚易懂，','a shared effort.':'需要一起改进。','Suggest a clearer replacement, request a phrase for plain reading, or improve an explanation. Start with a local draft, then decide whether to share it.':'建议更清楚的替换用词、新增词语或改进释义。先保存在本机，再决定是否分享。','A better way to say it':'更好懂的说法','Saved locally first':'先保存在本机','Word or phrase':'单词或短语','The term you’d like to discuss':'你想讨论的词语','What could improve?':'哪里需要改进？','The wording is hard to understand':'用词仍然难懂','The meaning may be inaccurate':'释义可能不准确','I have a replacement suggestion or a new term':'建议替换用词或新增词条','Your note':'你的建议','What was confusing? Which everyday phrase would work here?':'哪里难懂？怎样说更清楚？','Use your own words. Leave out personal health details. We do not automatically include page text or a page address.':'请用自己的话描述，不要填写个人健康信息。我们不会自动附加网页内容或地址。','Save local draft':'保存本机草稿','Nothing is sent to GitHub.':'不会发送到 GitHub。','On this device':'保存在这台设备','Your saved drafts':'已保存的草稿','Import JSON':'导入 JSON','Export JSON':'导出 JSON','Delete all':'全部删除','Choose a feedback backup to preview':'选择要预览的反馈备份','Your drafts will appear here. Saving one keeps it on this device until you choose to share or delete it.':'保存的草稿会显示在这里。草稿留在本机，由你决定分享或删除。','Up to 100 drafts are kept locally. Export drafts you want to keep; import a backup to restore them. Nothing is uploaded or synced automatically.':'本机最多保存 100 份草稿。需要保留时请导出，也可导入备份恢复。不会自动上传或同步。','Understanding belongs to everyone.':'每个人都有理解的权利。',
  'Local drafts':'本机草稿','Delete this draft?':'删除这份草稿？','Delete all local drafts?':'删除全部本机草稿？','This removes the draft from this device. This cannot be undone.':'这会从本机删除草稿，无法撤销。','This removes all feedback drafts from this device. Export a copy first if you want to keep them. This cannot be undone.':'这会删除全部本机反馈草稿，无法撤销。如需保留，请先导出备份。','Keep drafts':'保留草稿','Delete':'删除','Review before sharing':'分享前检查','Your words. Your choice.':'你的文字，由你决定。','Copy or download the reviewed text without an account. Nothing is sent automatically. Opening a GitHub draft sends this text to GitHub; publishing there makes it public.':'无需账号即可复制或下载检查过的文字。不会自动发送。打开 GitHub 草稿会将文字发送到 GitHub；在那里发布后内容会公开。','This is the text that will be included':'将包含以下文字','No page address, browsing history, or page content is added automatically.':'不会自动加入网页地址、浏览历史或网页内容。','Keep it local':'暂不分享','Open GitHub draft ↗':'打开 GitHub 草稿 ↗','Copy report':'复制报告','Download report':'下载报告','Report copied. Share it only where you choose.':'已复制报告，由你选择分享给谁。','Clipboard unavailable. The report is selected; copy it with your keyboard.':'无法访问剪贴板。已选中报告，可用键盘复制。','Report downloaded. Nothing was sent.':'已准备下载报告，没有发送任何内容。','Unable to download the report. You can copy the selected text instead.':'无法下载报告，可以复制已选中的文字。','Review & share':'检查与分享','Review & share on GitHub ↗':'检查与分享',
  'Restore a local backup':'恢复本机备份','Review before restoring.':'恢复前先检查。','Your backup is read on this device. It will be merged with your local drafts only after you confirm.':'备份仅在本机读取。确认后才会与本机草稿合并。','Drafts in this file':'文件中的草稿','New drafts to keep':'将保留的新草稿','Duplicates skipped':'跳过的重复草稿','Total after merging':'合并后的总数','Inspect the drafts in this file':'查看文件中的草稿','Existing drafts win when IDs match. The newest 100 by creation date are kept; equal dates are ordered by ID. Counts can change if another window edits your drafts. Importing does not send anything to GitHub.':'ID 相同时保留本机草稿，按创建日期保留最新 100 份，同日按 ID 排序。其他窗口的编辑可能改变数量。导入不会发送到 GitHub。','Cancel':'取消','Merge local drafts':'合并本机草稿','Restoring…':'正在恢复…',
  'In plain reading':'白话阅读中的替换','Explanation only. This term keeps its original wording in plain reading.':'仅提供解释。白话阅读保留此词原文。','Meaning, context & source':'释义、用法与来源','Review status not confirmed.':'审核状态未确认。','Improve this wording':'改进这个说法','Suggest a plain-reading phrase':'建议白话替换用词','Hard to understand':'难以理解','May be inaccurate':'可能不准确','Suggestion or new term':'建议或新词',
  'Reading preferences':'阅读偏好','Interface language':'界面语言','Density':'显示密度','Comfortable':'宽松','Compact':'紧凑','Highlight':'标记强度','Subtle':'柔和','Strong':'醒目','Default reading mode':'记住的阅读模式','Plain reading':'白话阅读','Explain terms':'解释词语','Save preferences':'保存偏好','These settings stay on this device. Language changes the interface, not the English glossary or your notes. Your last activated reading mode is remembered.':'设置保存在本机。语言仅改变界面，不翻译英文词库或你的建议。会记住最近启用的阅读模式。','Preferences saved on this device.':'偏好已保存在本机。','Unable to save preferences. Please try again.':'无法保存偏好，请重试。','Preferences unavailable. Defaults are shown; try reloading.':'无法读取偏好，暂时显示默认值；请尝试重新加载。',
  'A little clarity, right here.':'让眼前的文字更清楚。','Make the page':'让网页','easier to read.':'更容易读懂。','Swap reviewed health phrases for everyday words across this page. Keep the originals within reach.':'将本页经过核对的健康词语换成日常说法，随时查看原词。','Reading mode':'阅读模式','Read in plain English ↗':'开始白话阅读 ↗','Explain terms on this page ↗':'解释本页词语 ↗','Restore original':'恢复原文','Ready when you are.':'准备好了。','View a term & its original →':'查看词语与原文 →','Go to the first explanation →':'前往第一个解释 →','Uses reviewed phrase substitutions. Restore originals any time.':'使用经过核对的词语替换，随时恢复原文。','Keep the page wording and open explanations for marked terms.':'保留网页原文，点击标记的词语查看解释。','No matching health terms here yet. This is a focused glossary.':'本页没有匹配的健康词语，目前词库范围有限。','No reviewed substitutions match this page. Marked terms still have explanations.':'本页没有适用的已核对替换词。标记的词语仍可查看解释。','Only reviewed phrases change. Select a marked phrase for its original, context and source.':'只替换经过核对的词语。点击标记可查原词、用法与来源。','Original wording is shown. Select a marked term for its meaning and source.':'当前显示原文，点击标记可查释义与来源。','Explore the glossary ↗':'查看词库 ↗','Runs on your device. No account.':'在本机运行，无需账号。','Open a regular website to begin.':'请打开普通网页后使用。','Checking this page…':'正在检查页面…','Preferences & shortcuts':'偏好与快捷键','Reading settings ↗':'阅读设置 ↗','Shortcuts: Ctrl+Shift+L to toggle reading; Ctrl+Shift+U to restore. On macOS use Control, not Command. Browser conflicts may leave these unassigned; configure them at chrome://extensions/shortcuts (Edge: edge://extensions/shortcuts).':'快捷键：Ctrl+Shift+L 切换阅读，Ctrl+Shift+U 恢复原文。macOS 使用 Control 键。若与浏览器快捷键冲突，可在 chrome://extensions/shortcuts（Edge：edge://extensions/shortcuts）自行设置。',
  'Draft saved on this device. Only the most recent 100 drafts are kept.':'草稿已保存，本机仅保留最新 100 份。','New-term suggestion saved on this device. Review it below whenever you’re ready to share.':'新词建议已保存。准备分享时可在下方检查。','Draft saved on this device. Review it below whenever you’re ready to share.':'草稿已保存。准备分享时可在下方检查。','All local drafts deleted.':'全部本机草稿已删除。','Local draft deleted.':'本机草稿已删除。','Export prepared. Your local drafts are still saved.':'已准备导出，本机草稿仍然保留。','Reading your backup on this device…':'正在本机读取备份…','Backup ready for review. Your drafts have not changed.':'备份已准备好，请检查。现有草稿尚未改变。','The glossary is unavailable.':'词库不可用。','This file is too large. Choose a feedback export no larger than 1 MiB.':'文件过大，请选择不超过 1 MiB 的反馈备份。','This backup contains no drafts to restore.':'备份中没有可恢复的草稿。',
  'Unable to delete the draft. Please try again.':'无法删除草稿，请重试。','Unable to export drafts. Please try again.':'无法导出草稿，请重试。','Unable to refresh local drafts.':'无法刷新本机草稿。','Unable to load the bundled glossary. Reload this page to try again.':'无法加载内置词库，请重新加载页面。','Unable to read local feedback. Reload this page to try again.':'无法读取本机反馈，请重新加载页面。'
}));
for (const [en, zh] of Object.entries({
  'Explore the glossary':'查看词库',
  'Read in plain English':'开始白话阅读',
  'View a term & its original':'查看词语与原文',
  'Choose a JSON feedback export.':'请选择 JSON 格式的反馈备份。',
  'This file is not valid JSON. Choose an OpenPlainEnglish feedback export.':'文件不是有效的 JSON，请选择 OpenPlainEnglish 反馈备份。',
  'Unsupported backup format. Expected schemaVersion 1 and a feedback list.':'备份格式不受支持，需要 schemaVersion 1 和反馈列表。',
  'A backup can contain at most 1,000 drafts.':'一份备份最多包含 1,000 份草稿。',
  'Feedback needs an ID, a valid date, a term, and a note.':'请填写词语和建议，草稿还需要有效的编号与日期。',
  'Choose unclear, inaccurate, or suggestion as the feedback kind.':'请选择难懂、不准确或建议作为反馈类别。',
  'Choose a feedback category and write a note.':'请选择反馈类别并填写建议。',
  'The draft could not be saved.':'无法保存草稿。',
  'The draft could not be saved. Your note is still here.':'无法保存草稿，你的建议仍在输入框中。',
  'Unable to delete the draft.':'无法删除草稿。',
  'Unable to read this backup. Your drafts have not changed.':'无法读取备份，现有草稿尚未改变。',
  'The backup could not be restored.':'无法恢复备份。',
  'Unable to restore the backup. Please try again.':'无法恢复备份，请重试。',
  'This page is not available. Try a regular website.':'当前页面不可用，请打开普通网页。',
  'Unable to reach this page. Try refreshing it.':'无法访问页面，请尝试刷新。',
  'The page changed. Please try again.':'页面已经改变，请重试。',
  'Open a regular web page first.':'请先打开普通网页。',
  'Choose Plain reading or Explain terms.':'请选择白话阅读或解释词语。',
  'Open a regular web page first. Browser settings, extension stores, PDFs and local files cannot be annotated.':'请打开普通网页。浏览器设置、扩展商店、PDF 和本机文件不受支持。',
  'Open OpenPlainEnglish from the browser toolbar on the page you want to read, then try again.':'请在需要阅读的网页上，通过浏览器工具栏打开 OpenPlainEnglish 后重试。',
  'This page cannot be annotated, or it changed while opening. Try a regular web page and enable the reader again.':'本页不受支持，或打开时页面已改变。请在普通网页重新开启阅读。'
})) translations.set(en, zh);
for (const [en, zh] of Object.entries({
  'Reading guide':'阅读演练','Make yourself at home.':'先试一试，放心阅读。','Try the reading controls on a short, invented example.':'用一小段虚构文字练习阅读操作。','Practice completed on this device. You can repeat it anytime.':'已在本机完成演练，随时可以重做。','Open the reading guide ↗':'打开阅读演练 ↗','New here? Try the one-minute guide →':'第一次使用？试试一分钟演练 →','Practice with the reading guide ↗':'重新练习阅读操作 ↗',
  'Additional reading areas — off by default':'额外读取区域（默认关闭）','Include accessible same-origin frames':'包含可访问的同源内嵌页面','Include open shadow-root components':'包含开放的 Shadow DOM 组件','These optional areas can contain more page text. Cross-origin frames and closed components remain inaccessible. Enabling these settings does not turn reading on; restore original to stop reading.':'这些可选区域可能包含更多网页文字。跨域内嵌页面与封闭组件仍无法访问。勾选设置不会开启阅读；可用“恢复原文”停止阅读。',
  'Configured feedback email':'已配置的反馈邮箱','To':'收件人','Subject':'主题','The email body is exactly the report above. Your mail app may add its own signature. Review there before sending.':'邮件正文就是上方报告。邮件应用可能加上自己的签名，请发送前再次检查。','Open email draft ↗':'打开邮件草稿 ↗','No feedback email is configured. You can still copy or download this report; neither action sends it to the project.':'暂未配置反馈邮箱，仍可复制或下载报告；这两种操作都不会把内容发送给项目。','OpenPlainEnglish does not send this email. Review and send it in your mail app.':'OpenPlainEnglish 不会发送此邮件。请在邮件应用中检查，再自行发送。','This report is too long for an email link. Copy or download it instead.':'报告过长，无法通过邮件链接打开，请复制或下载。',
})) translations.set(en, zh);
const reverse = new Map([...translations].map(([en, zh]) => [zh, en]));
const patterns = [
 [/^(Hard to understand|May be inaccurate|Suggestion or new term) · (.+)$/, (_, kind, date) => `${translations.get(kind)} · ${date}`],
 [/^Draft (\d+) (.+) No drafts were imported\.$/, (_, n, detail) => `第 ${n} 份草稿格式不符合要求，未导入任何草稿。(${detail})`],
 [/^(\d+) replaced · (\d+) explained$/, (_, a, b) => `已替换 ${a} 处 · 可解释 ${b} 处`],
 [/^(\d+) terms? marked · original wording$/, (_, n) => `已标记 ${n} 处 · 保留原文`],
 [/^(\d+) match(?:es)? in (\d+) health terms$/, (_, n, total) => `${total} 个健康词条中找到 ${n} 项`],
 [/^(\d+) health terms, ready to explore$/, (_, n) => `${n} 个健康词条`],
 [/^Edition (.+)$/, (_, version) => `版本 ${version}`],
 [/^Also written as: (.+)$/, (_, value) => `其他写法：${value}`],
 [/^Source-checked(.*)\. Not independently clinically reviewed or comprehension tested\.$/, (_, date) => `已核对来源${date}。尚未独立临床审核或读者理解测试。`],
 [/^Meaning, context and source for (.+)$/, (_, term) => `${term} 的释义、用法与来源`],
 [/^Review and share feedback on (.+)$/, (_, term) => `检查并分享关于 ${term} 的反馈`],
 [/^Delete feedback on (.+)$/, (_, term) => `删除关于 ${term} 的反馈`],
 [/^(.+) Give feedback on (.+)$/, (_, label, term) => `${translations.get(label) || label}：${term}`],
 [/^The 100-draft limit leaves out (\d+) existing drafts and (\d+) drafts from this file\. Export your current drafts first if you want to keep them all\.$/, (_, a, b) => `100 份上限将舍弃 ${a} 份本机草稿及文件中的 ${b} 份草稿。如需全部保留，请先导出。`],
 [/^Restored (\d+) drafts\. Skipped (\d+) duplicates; (\d+) older drafts left out by the 100-draft limit\. (\d+) drafts are now stored on this device\.$/, (_, a,b,c,d) => `已恢复 ${a} 份，跳过 ${b} 份重复草稿；受 100 份上限影响舍弃 ${c} 份旧草稿。本机现有 ${d} 份。`],
];
export function translated(text, language) {
  if (language !== 'zh-CN') return reverse.get(text) || text;
  if (translations.has(text)) return translations.get(text);
  const limit = ' Large page: only part was checked.';
  if (text.endsWith(limit)) return translated(text.slice(0, -limit.length), language) + ' 页面较大，仅检查了部分内容。';
  for (const [pattern, replacement] of patterns) if (pattern.test(text)) return text.replace(pattern, replacement);
  return text;
}
export function createLocalizer(document, getLanguage) {
  const originals = new WeakMap();
  const attributes = new WeakMap();
  function apply() {
    const language = getLanguage();
    document.documentElement.lang = language;
    const walker = document.createTreeWalker(document.body, document.defaultView.NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest('script,style,textarea,[data-user-content]')) continue;
      const prior = originals.get(node);
      const source = prior && node.data === prior.rendered ? prior.source : node.data;
      const trimmed = source.trim();
      const rendered = trimmed ? source.replace(trimmed, translated(trimmed, language)) : source;
      if (node.data !== rendered) node.data = rendered;
      originals.set(node, { source, rendered });
    }
    for (const element of document.querySelectorAll('[placeholder],[aria-label]')) {
      const record = attributes.get(element) || {};
      for (const name of ['placeholder', 'aria-label']) if (element.hasAttribute(name)) {
        const current = element.getAttribute(name), prior = record[name];
        const source = prior && current === prior.rendered ? prior.source : current;
        const rendered = translated(source, language);
        if (current !== rendered) element.setAttribute(name, rendered);
        record[name] = { source, rendered };
      }
      attributes.set(element, record);
    }
  }
  // React to status/error/dialog text without coupling every event handler to copy.
  const observer = new document.defaultView.MutationObserver(() => { observer.disconnect(); apply(); observe(); });
  const observe = () => observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  apply(); observe();
  return apply;
}
