export const SURFACE_DEFINITIONS = Object.freeze([
  { id: 'auth', kind: 'view' },
  { id: 'counselor_home', kind: 'view' },
  { id: 'tasks', kind: 'view' },
  { id: 'dashboard', kind: 'view' },
  { id: 'users', kind: 'view' },
  { id: 'counselors', kind: 'view' },
  { id: 'clients', kind: 'view' },
  { id: 'scheduling', kind: 'view' },
  { id: 'workspace_studio', kind: 'view' },
  { id: 'clinical', kind: 'view' },
  { id: 'documents', kind: 'view' },
  { id: 'offerings', kind: 'view' },
  { id: 'portal', kind: 'view' },
  { id: 'faith', kind: 'view' },
  { id: 'audit_intelligence', kind: 'view' },
  { id: 'about', kind: 'page' },
  { id: 'operations', kind: 'page' },
  { id: 'monitor', kind: 'page' },
  { id: 'signup', kind: 'page' },
  { id: 'trial_expired', kind: 'page' },
  { id: 'trial_banner', kind: 'banner' },
  { id: 'portal.dashboard', kind: 'tab' },
  { id: 'portal.profile', kind: 'tab' },
  { id: 'portal.appointments', kind: 'tab' },
  { id: 'portal.documents', kind: 'tab' },
  { id: 'portal.counselor', kind: 'tab' },
  { id: 'portal.giving', kind: 'tab' },
  { id: 'portal.resources', kind: 'tab' },
  { id: 'portal.data_rights', kind: 'tab' },
  { id: 'client.demographics', kind: 'tab' },
  { id: 'client.contacts', kind: 'tab' },
  { id: 'client.clinical', kind: 'tab' },
  { id: 'client.intake_preview', kind: 'tab' },
  { id: 'client.diagnoses', kind: 'tab' },
  { id: 'client.faith', kind: 'tab' },
  { id: 'client.legal', kind: 'tab' },
  { id: 'client.insurance', kind: 'tab' },
  { id: 'clinical.session_notes', kind: 'workflow' },
  { id: 'clinical.ai_note_draft', kind: 'workflow' },
  { id: 'billing.claims', kind: 'view' },
  { id: 'billing.subscription', kind: 'view' },
  { id: 'counselor.profile', kind: 'tab' },
  { id: 'counselor.licenses', kind: 'tab' },
  { id: 'counselor.specialties', kind: 'tab' },
  { id: 'counselor.faith', kind: 'tab' },
  { id: 'counselor.certifications', kind: 'tab' },
  { id: 'counselor.employment', kind: 'tab' },
  { id: 'counselor.availability', kind: 'tab' },
  { id: 'studio.practice', kind: 'tab' },
  { id: 'studio.locations', kind: 'tab' },
  { id: 'studio.staff', kind: 'tab' },
  { id: 'studio.lifecycle', kind: 'tab' },
  { id: 'studio.chart', kind: 'tab' },
  { id: 'studio.documents', kind: 'tab' },
  { id: 'studio.clients', kind: 'tab' },
  { id: 'studio.appointments', kind: 'tab' },
  { id: 'studio.offerings', kind: 'tab' },
  { id: 'studio.portal', kind: 'tab' },
  { id: 'scheduling.general', kind: 'subview' },
  { id: 'scheduling.counselor', kind: 'subview' },
  { id: 'scheduling.practice', kind: 'subview' },
  { id: 'scheduling.month', kind: 'subview' },
  { id: 'modal.client_picker', kind: 'modal' },
  { id: 'modal.client_editor', kind: 'modal' },
  { id: 'modal.appointment_composer', kind: 'modal' },
  { id: 'modal.user_maintenance', kind: 'modal' },
  { id: 'modal.counselor_maintenance', kind: 'modal' },
  { id: 'modal.portal_actions', kind: 'modal' },
  { id: 'modal.demo_feedback', kind: 'modal' },
  { id: 'control.demo_feedback', kind: 'page' },
  { id: 'control.demo_feedback.detail', kind: 'drawer' },
]);

const SURFACE_MAP = new Map(SURFACE_DEFINITIONS.map((surface) => [surface.id, surface]));

export function getSurfaceDefinition(surfaceId) {
  if (typeof surfaceId !== 'string') return null;
  return SURFACE_MAP.get(surfaceId.trim()) ?? null;
}

export function isKnownSurfaceId(surfaceId) {
  return Boolean(getSurfaceDefinition(surfaceId));
}

export function getSurfaceSummary() {
  const byKind = {};
  for (const surface of SURFACE_DEFINITIONS) {
    byKind[surface.kind] = (byKind[surface.kind] ?? 0) + 1;
  }
  return {
    total: SURFACE_DEFINITIONS.length,
    byKind,
    surfaces: SURFACE_DEFINITIONS,
  };
}
