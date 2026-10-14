export const DEFAULT_PREFERENCES = Object.freeze({ language: 'en', density: 'comfortable', highlight: 'subtle', mode: 'plain', includeFrames: false, includeShadowRoots: false, guideCompleted: false });
const VALUES = Object.freeze({ language: ['en', 'zh-CN'], density: ['comfortable', 'compact'], highlight: ['subtle', 'strong'], mode: ['plain', 'annotate'], includeFrames: [false, true], includeShadowRoots: [false, true], guideCompleted: [false, true] });
const object = (value) => {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || (Object.getPrototypeOf(prototype) === null && Object.getOwnPropertyDescriptor(prototype, 'constructor')?.value?.name === 'Object');
};

/** Validate a partial update. Never preserve unknown metadata. */
export function validatePreferences(value) {
  if (!object(value)) throw new TypeError('Reading preferences must be an object.');
  const result = {};
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (typeof key !== 'string' || !Object.hasOwn(VALUES, key) || !descriptor || !Object.hasOwn(descriptor, 'value') || !VALUES[key].includes(descriptor.value)) throw new TypeError('Choose a supported reading preference.');
    result[key] = descriptor.value;
  }
  return result;
}

/** Recover safe defaults from absent, old or damaged local storage. */
export function normalizePreferences(value) {
  const result = { ...DEFAULT_PREFERENCES };
  if (!object(value)) return result;
  for (const key of Object.keys(DEFAULT_PREFERENCES)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor && Object.hasOwn(descriptor, 'value') && VALUES[key].includes(descriptor.value)) result[key] = descriptor.value;
  }
  return result;
}
