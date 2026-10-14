/** Owner-controlled bundled configuration only. No arbitrary endpoints or URL schemes. */
export function validateFeedbackDestination(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new TypeError('Invalid feedback destination.');
  const keys = Reflect.ownKeys(value);
  if (keys.length !== 2 || !keys.includes('schemaVersion') || !keys.includes('email')) throw new TypeError('Invalid feedback destination fields.');
  for (const key of keys) if (!Object.hasOwn(Object.getOwnPropertyDescriptor(value, key) || {}, 'value')) throw new TypeError('Invalid feedback destination fields.');
  if (value.schemaVersion !== 1) throw new TypeError('Unsupported feedback destination configuration.');
  if (value.email === null) return Object.freeze({ schemaVersion: 1, email: null });
  const email = value.email;
  // A single conservative ASCII mailbox: never headers, display names, multiple recipients or URL syntax.
  if (typeof email !== 'string' || email.length > 254 || !/^[A-Za-z0-9](?:[A-Za-z0-9._+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,63}$/u.test(email)
    || email.includes('..') || email.split('@')[0].length > 64) throw new TypeError('Invalid feedback email address.');
  return Object.freeze({ schemaVersion: 1, email });
}

export function createFeedbackMailto(config, { subject, body }) {
  const { email } = validateFeedbackDestination(config);
  if (!email) return null;
  if (typeof subject !== 'string' || subject.length < 1 || subject.length > 180 || /[\r\n\u0000-\u001f\u007f]/u.test(subject)
    || typeof body !== 'string' || body.length < 1 || body.length > 8000 || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(body)) throw new TypeError('Invalid feedback report.');
  const url = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  if (url.length > 16000) throw new RangeError('This report is too long for an email link. Copy or download it instead.');
  return url;
}
