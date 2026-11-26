import React from 'react';
import { View } from 'react-native';
import type { AppointmentAction, DoctorAppointmentView } from '../api/types';
import {
  appointmentActionLabels,
  appointmentActionsForView,
  AppointmentActionView,
} from '../utils/appointmentStatus';
import { Button } from './Button';

export function AppointmentActions({
  appointment,
  view,
  pendingAction,
  disabled,
  onAction,
  exclude = [],
}: {
  appointment: DoctorAppointmentView;
  view: AppointmentActionView;
  pendingAction?: AppointmentAction | null;
  disabled?: boolean;
  onAction: (action: AppointmentAction) => void;
  exclude?: AppointmentAction[];
}) {
  const actions = appointmentActionsForView(
    appointment.allowed_actions,
    view,
  ).filter((action) => !exclude.includes(action));
  if (!actions.length) return null;
  return (
    <View className="gap-2 mt-3 min-w-0 max-w-full">
      {actions.map((action) => (
        <Button
          key={action}
          text={appointmentActionLabels[action]}
          variant={
            action === 'cancel' || action === 'no_show'
              ? 'danger'
              : action === 'complete' || action === 'start'
                ? 'primary'
                : 'secondary'
          }
          loading={pendingAction === action}
          disabled={disabled || !!pendingAction}
          onPress={() => onAction(action)}
        />
      ))}
    </View>
  );
}
