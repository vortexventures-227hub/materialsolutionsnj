import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildContactSubjectOptions,
  CONTACT_SUBJECT_OPTIONS,
  normalizeRequestedContactSubject,
} from '@/lib/contactSubjects';

test('buildContactSubjectOptions preserves sitewide quote subjects that are not in the default select list', () => {
  const options = buildContactSubjectOptions('Quote Request');

  assert.equal(options[0], 'Quote Request');
  assert.equal(options.includes('Sales Question'), true);
  assert.equal(options.filter((option) => option === 'Quote Request').length, 1);
});

test('buildContactSubjectOptions avoids duplicating existing canned subjects', () => {
  const options = buildContactSubjectOptions('Rental Quote');

  assert.deepEqual(options, [...CONTACT_SUBJECT_OPTIONS]);
});

test('normalizeRequestedContactSubject trims blank or padded values', () => {
  assert.equal(normalizeRequestedContactSubject('  Wire-Guided Systems  '), 'Wire-Guided Systems');
  assert.equal(normalizeRequestedContactSubject('   '), '');
  assert.equal(normalizeRequestedContactSubject(undefined), '');
});