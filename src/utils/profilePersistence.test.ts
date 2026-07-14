import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeProfilePersistence } from './profilePersistence';

test('normalizes profile details and skill lists before saving', () => {
  const result = normalizeProfilePersistence({
    name: '  Ana Cruz  ',
    school: '   ',
    program: '  Computer Science  ',
    year_level: '  2nd Year ',
    emergency_contact_name: '  Jane Cruz  ',
    emergency_contact_relation: '  Sister  ',
    emergency_contact_phone: ' 0917-123-4567 ',
    emergency_contact_email: '  jane@example.com ',
    emergency_contact_location: '  Manila  ',
    skills: [' React ', '  ', 'Node.js', 'React'],
  });

  assert.equal(result.name, 'Ana Cruz');
  assert.equal(result.school, null);
  assert.equal(result.program, 'Computer Science');
  assert.equal(result.year_level, '2nd Year');
  assert.equal(result.emergency_contact_name, 'Jane Cruz');
  assert.equal(result.emergency_contact_relation, 'Sister');
  assert.equal(result.emergency_contact_phone, '0917-123-4567');
  assert.equal(result.emergency_contact_email, 'jane@example.com');
  assert.equal(result.emergency_contact_location, 'Manila');
  assert.deepEqual(result.skills, ['React', 'Node.js']);
});
