import test from 'node:test';
import assert from 'node:assert/strict';
import { publicReviewSchema, uuidParamSchema, documentUploadSchema } from './types/index.js';
import { isAllowedOrigin } from './middleware/originGuard.js';

test('public review contract rejects out-of-range ratings', () => {
  assert.equal(publicReviewSchema.safeParse({
    name: 'Reviewer',
    profession: 'Engineer',
    rating: 6,
    feedback: 'A useful review with enough content.',
  }).success, false);
});

test('public review contract accepts bounded valid input', () => {
  const result = publicReviewSchema.safeParse({
    name: 'Reviewer',
    profession: 'Engineer',
    rating: 5,
    feedback: 'A useful review with enough content.',
  });
  assert.equal(result.success, true);
});

test('UUID route contract rejects arbitrary identifiers', () => {
  assert.equal(uuidParamSchema.safeParse({ id: 'not-an-id' }).success, false);
  assert.equal(uuidParamSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' }).success, true);
});

test('document title contract rejects blank titles', () => {
  assert.equal(documentUploadSchema.safeParse({ title: '   ' }).success, false);
});


test('origin contract allows configured origins and rejects foreign origins', () => {
  assert.equal(isAllowedOrigin('http://localhost:3001/'), true);
  assert.equal(isAllowedOrigin('https://evil.example'), false);
  assert.equal(isAllowedOrigin(undefined), false);
});
