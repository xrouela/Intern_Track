import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRequestNotification } from './notifications.ts';

test('buildRequestNotification includes the requester and request type for new submissions', () => {
  const result = buildRequestNotification({
    requestType: 'schedule',
    action: 'submitted',
    requesterName: 'Mina Cruz',
  });

  assert.equal(result.title, 'New schedule change request from Mina Cruz');
  assert.match(result.message, /Mina Cruz/i);
  assert.match(result.message, /schedule change/i);
});

test('buildRequestNotification includes the reviewer and request type for review decisions', () => {
  const result = buildRequestNotification({
    requestType: 'leave',
    action: 'approved',
    reviewerName: 'Rina Santos',
  });

  assert.equal(result.title, 'Leave request approved');
  assert.match(result.message, /Rina Santos/i);
  assert.match(result.message, /leave/i);
});
