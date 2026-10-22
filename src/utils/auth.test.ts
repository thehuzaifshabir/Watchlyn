import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, sanitizeUsername, validateEmail } from './auth.ts';

test('hashPassword hashes password to 64-char sha256 hex string', async () => {
  const hash1 = await hashPassword('Secret123!');
  const hash2 = await hashPassword('Secret123!');
  const hash3 = await hashPassword('DifferentPassword');

  assert.equal(typeof hash1, 'string');
  assert.equal(hash1.length, 64);
  assert.equal(hash1, hash2);
  assert.notEqual(hash1, hash3);
});

test('sanitizeUsername trims, lowercases, and strips @ and symbols', () => {
  assert.equal(sanitizeUsername('@Huzaif_Shabir'), 'huzaif_shabir');
  assert.equal(sanitizeUsername('  John.Doe123! '), 'john.doe123');
  assert.equal(sanitizeUsername('user@domain.com'), 'userdomain.com');
});

test('validateEmail checks standard email patterns', () => {
  assert.equal(validateEmail('test@example.com'), true);
  assert.equal(validateEmail('user.name@watchlyn.com'), true);
  assert.equal(validateEmail('user.name@cinejoy.pk'), true);
  assert.equal(validateEmail('invalid-email'), false);
  assert.equal(validateEmail('missing@domain'), false);
});
