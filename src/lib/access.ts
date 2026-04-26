import { INITIAL_ROLES } from '../constants';

export type AppRole = 'bishop' | 'admin' | 'parish_priest' | 'parish_secretary' | 'school' | 'seminary';

export type AccessRole =
  | 'bishop'
  | 'diocese_admin'
  | 'parish_priest'
  | 'parish_secretary'
  | 'seminary_rector'
  | 'school_registrar';

export const ACCESS_ROLE_TO_APP_ROLE: Record<AccessRole, AppRole> = {
  bishop: 'bishop',
  diocese_admin: 'admin',
  parish_priest: 'parish_priest',
  parish_secretary: 'parish_secretary',
  seminary_rector: 'seminary',
  school_registrar: 'school',
};

const roleNameToId = new Map(
  INITIAL_ROLES.map((role) => [role.name.toLowerCase(), role.id as AccessRole])
);

const legacyRoleToAccessRole: Record<string, AccessRole> = {
  bishop: 'bishop',
  admin: 'diocese_admin',
  priest: 'parish_priest',
  school: 'school_registrar',
  seminary: 'seminary_rector',
  parish_priest: 'parish_priest',
  parish_secretary: 'parish_secretary',
  diocese_admin: 'diocese_admin',
  seminary_rector: 'seminary_rector',
  school_registrar: 'school_registrar',
};

export function normalizeAccessRole(role?: string): AccessRole {
  if (!role) return 'parish_priest';

  const normalized = role.trim().toLowerCase().replace(/\s+/g, '_');
  const displayNameMatch = roleNameToId.get(role.trim().toLowerCase());

  return displayNameMatch || legacyRoleToAccessRole[normalized] || 'parish_priest';
}

export function getAppRole(role?: string): AppRole {
  return ACCESS_ROLE_TO_APP_ROLE[normalizeAccessRole(role)];
}

export function getAccessRoleLabel(role?: string) {
  const accessRole = normalizeAccessRole(role);
  return INITIAL_ROLES.find((item) => item.id === accessRole)?.name || 'Parish Priest';
}
