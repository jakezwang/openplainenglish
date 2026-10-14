import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFeedbackDestination, createFeedbackMailto } from '../src/options/feedback-destination.js';

test('feedback destination is absent by default and accepts only one owner-configured mailbox', () => {
  assert.equal(createFeedbackMailto({ schemaVersion:1, email:null }, { subject:'Feedback', body:'Note' }), null);
  assert.deepEqual(validateFeedbackDestination({ schemaVersion:1, email:'reader+notes@example.org' }), { schemaVersion:1, email:'reader+notes@example.org' });
  for (const email of ['mailto:feedback@example.org', 'feedback@example.org?bcc=other@example.org', 'one@example.org,two@example.org', 'a@example.org\r\nBcc:other@example.org', 'a%0d%0a@example.org', 'a@localhost', ' Name <a@example.org>', 'a..b@example.org', 'a@example..org', '', 3]) {
    assert.throws(() => validateFeedbackDestination({ schemaVersion:1, email }), TypeError);
  }
  for (const value of [{ email:null }, { schemaVersion:2, email:null }, { schemaVersion:1, email:null, endpoint:'https://other.test' }, { schemaVersion:1, email:null, [Symbol('secret')]:true }]) assert.throws(() => validateFeedbackDestination(value), TypeError);
  assert.throws(() => validateFeedbackDestination(Object.defineProperty({ schemaVersion:1 }, 'email', { enumerable:true, get() { assert.fail('Do not invoke config getters'); } })), TypeError);
});

test('email link round-trips exactly reviewed text and cannot inject additional headers', () => {
  const subject = 'OpenPlainEnglish feedback: hypertension';
  const body = 'My note: 中文 & ?body=other\nKeep punctuation + # and this line.\nBcc: text only';
  const link = new URL(createFeedbackMailto({ schemaVersion:1, email:'feedback@example.org' }, { subject, body }));
  assert.equal(link.protocol, 'mailto:');
  assert.equal(link.pathname, 'feedback@example.org');
  assert.deepEqual([...link.searchParams.keys()], ['subject','body']);
  assert.equal(link.searchParams.get('subject'), subject);
  assert.equal(link.searchParams.get('body'), body);
  assert.throws(() => createFeedbackMailto({ schemaVersion:1, email:'feedback@example.org' }, { subject:'bad\r\nBcc:other@example.org', body:'ok' }), TypeError);
  assert.throws(() => createFeedbackMailto({ schemaVersion:1, email:'feedback@example.org' }, { subject:'ok', body:'中'.repeat(2000) }), RangeError);
});
