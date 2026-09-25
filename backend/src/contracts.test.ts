import test from 'node:test';
import assert from 'node:assert/strict';
import { publicReviewSchema, uuidParamSchema, documentUploadSchema } from './types/index.js';

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

import { ErrorCode } from './constants/index.js';
import { getClientErrorDetails } from './middleware/errorHandler.js';

test('AI quota errors map to an actionable 429 response', () => {
  const result = getClientErrorDetails(ErrorCode.AI_QUOTA_EXCEEDED);
  assert.equal(result?.statusCode, 429);
  assert.match(result?.message ?? '', /usage limit|quota|billing/i);
});

test('AI credential errors map to an actionable settings response', () => {
  const result = getClientErrorDetails(ErrorCode.AI_AUTH_FAILED);
  assert.equal(result?.statusCode, 422);
  assert.match(result?.message ?? '', /API key|Settings/i);
});

test('AI provider outages map to a retryable 503 response', () => {
  const result = getClientErrorDetails(ErrorCode.AI_PROVIDER_UNAVAILABLE);
  assert.equal(result?.statusCode, 503);
  assert.match(result?.message ?? '', /temporarily unavailable|try again/i);
});
