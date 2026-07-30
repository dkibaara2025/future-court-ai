import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreArgument } from '../src/domain/scoring.js';

test('scoring is deterministic and bounded', () => {
  const argument = 'Although the system saved lives, essential healthcare creates coercion because patients cannot freely refuse treatment. Therefore permanent memory access should be invalidated while anonymised medical insights may remain.';
  const first = scoreArgument(argument, 'liberate');
  const second = scoreArgument(argument, 'liberate');
  assert.deepEqual(first, second);
  assert.ok(first.totalScore >= 10 && first.totalScore <= 100);
  for (const dimension of [first.reasoning, first.relevance, first.counterargument, first.clarity]) {
    assert.ok(dimension.score >= 1 && dimension.score <= 10);
    assert.ok(dimension.feedback.length > 5);
  }
});

test('explicit counterargument language is rewarded', () => {
  const plain = scoreArgument('The agreements should remain because the system saved lives and patients accepted the service.', 'protect');
  const nuanced = scoreArgument('Although privacy is fundamental, the agreements should remain because the system saved lives and patients accepted the service. However, future agreements should permit withdrawal.', 'protect');
  assert.ok(nuanced.counterargument.score > plain.counterargument.score);
});
