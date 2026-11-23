import type { ReminderData } from './reminderPlan';

export interface ReminderNavigationState {
  ready: boolean;
  authenticated: boolean;
  loading: boolean;
  resolvingModes: boolean;
  patientId?: number;
  activeMode: string | null;
  availableModes: string[];
}

export function reminderResponseKey(
  identifier: string,
  data: ReminderData,
): string {
  return `${identifier}@${data.firesAt}`;
}

export function reminderNavigationAction(
  data: ReminderData,
  state: ReminderNavigationState,
) {
  if (!state.ready || state.loading || state.resolvingModes) return 'wait';
  if (!state.authenticated) return 'login';
  if (!state.patientId || !state.activeMode) return 'wait';
  if (state.patientId !== data.patientId) return 'wrong-account';
  if (state.activeMode !== 'patient')
    return state.availableModes.includes('patient') ? 'patient-mode' : 'wait';
  return 'open';
}
