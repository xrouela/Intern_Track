export interface ProfilePersistencePayload {
  name?: string;
  school?: string | null;
  program?: string | null;
  year_level?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_relation?: string | null;
  emergency_contact_phone?: string | null;
  emergency_contact_email?: string | null;
  emergency_contact_location?: string | null;
  skills?: string[] | string | null;
}

function normalizeText(value?: string | null): string | null {
  if (typeof value !== 'string') return value ?? null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeSkills(value?: string[] | string | null): string[] | null {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => normalizeText(item))
      .filter((item): item is string => Boolean(item))
      .filter((item, index, arr) => arr.indexOf(item) === index);

    return normalized.length > 0 ? normalized.slice(0, 10) : null;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return normalizeSkills(parsed);
      }
    } catch {
      const parts = value.split(',').map((item) => normalizeText(item)).filter(Boolean) as string[];
      return parts.length > 0 ? parts.slice(0, 10) : null;
    }
  }

  return null;
}

export function normalizeProfilePersistence(payload: ProfilePersistencePayload) {
  return {
    ...payload,
    name: normalizeText(payload.name),
    school: normalizeText(payload.school),
    program: normalizeText(payload.program),
    year_level: normalizeText(payload.year_level),
    emergency_contact_name: normalizeText(payload.emergency_contact_name),
    emergency_contact_relation: normalizeText(payload.emergency_contact_relation),
    emergency_contact_phone: normalizeText(payload.emergency_contact_phone),
    emergency_contact_email: normalizeText(payload.emergency_contact_email),
    emergency_contact_location: normalizeText(payload.emergency_contact_location),
    skills: normalizeSkills(payload.skills),
  };
}
