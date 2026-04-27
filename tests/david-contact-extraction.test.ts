import test from 'node:test';
import assert from 'node:assert/strict';

import { extractContactInfo } from '@/lib/david/scoring';

test('extractContactInfo gives explicit "my name is" priority over buyer-intent language', () => {
  const info = extractContactInfo(
    "Hi David, I'm interested in the 2018 Raymond 752R45TT reach truck. My name is Koda Verification, email koda.verification@materialsolutionsnj.com, phone 973-555-0101."
  );

  assert.equal(info.name, 'Koda Verification');
  assert.equal(info.email, 'koda.verification@materialsolutionsnj.com');
  assert.equal(info.phone, '973-555-0101');
});

test('extractContactInfo does not mistake "I am interested in" for a customer name', () => {
  const info = extractContactInfo(
    'I am interested in the 2018 Raymond 752R45TT reach truck. Email buyer@example.com.'
  );

  assert.equal(info.name, undefined);
  assert.equal(info.email, 'buyer@example.com');
});

test('extractContactInfo still captures normal conversational introductions', () => {
  const info = extractContactInfo(
    "Hello, I'm Jane Buyer from NorthStar Logistics. My phone is (973) 555-0199."
  );

  assert.equal(info.name, 'Jane Buyer');
  assert.equal(info.phone, '(973) 555-0199');
});
