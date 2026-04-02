const COUNSELOR_ROLES = new Set(['counselor', 'intern']);
const ADMIN_ROLES = new Set(['platform_admin', 'practice_owner', 'practice_admin']);

export function isClientRole(role) {
  return role === 'client';
}

export function isCounselorRole(role) {
  return COUNSELOR_ROLES.has(role ?? '');
}

export function isAdminRole(role) {
  return ADMIN_ROLES.has(role ?? '');
}

export function isOperationsStaffRole(role) {
  return role === 'scheduler_biller';
}
