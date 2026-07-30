import test from 'node:test';
import assert from 'node:assert/strict';
import { buildChallengeUrl, decodeChallenge, encodeChallenge } from '../src/lib/challenge.js';

const payload = { version: 1, caseId: 'memory-rights-2089', challengerAlias: 'Amina', challengerSide: 'protect', challengerScore: 78, createdAt: '2026-07-30T16:00:00.000Z' };

test('privacy-safe challenge payload round-trips', () => {
  const token = encodeChallenge(payload);
  assert.ok(!token.includes('argument'));
  assert.deepEqual(decodeChallenge(token), payload);
  const url = buildChallengeUrl(payload, 'https://example.test/app?x=1');
  assert.match(url, /^https:\/\/example\.test\/app#challenge=/);
});

test('malformed challenge is rejected', () => {
  assert.equal(decodeChallenge('not-a-token'), null);
});
