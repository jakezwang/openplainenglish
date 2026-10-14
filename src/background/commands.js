const COMMANDS = new Map([
  ['toggle-reading', 'OPE_TOGGLE_ACTIVE'],
  ['restore-original', 'OPE_DISABLE_ACTIVE'],
]);

export function createCommandHandler(chrome, actions) {
  let queue = Promise.resolve();
  async function run(type) {
    let ok = false;
    try {
      // Content-script refusals are resolved messages, not rejected promises.
      ok = (await actions.handle({ type }))?.ok === true;
    } catch { /* The toolbar remains the recovery path for denied or stale pages. */ }
    // Serialize indicators with commands, so a delayed failure cannot overwrite
    // the badge/title from a later successful shortcut. Toolbar API failures
    // must not create unhandled promise rejections in an event listener.
    await Promise.allSettled([
      Promise.resolve().then(() => chrome.action?.setBadgeText?.({ text: ok ? '' : '!' })),
      Promise.resolve().then(() => chrome.action?.setTitle?.({ title: ok
        ? 'OpenPlainEnglish'
        : 'OpenPlainEnglish: open the toolbar on a regular web page to continue.' })),
    ]);
    return ok;
  }
  return (command) => {
    const type = COMMANDS.get(command);
    if (!type) return Promise.resolve(undefined);
    const result = queue.then(() => run(type), () => run(type));
    queue = result.catch(() => {});
    return result;
  };
}
