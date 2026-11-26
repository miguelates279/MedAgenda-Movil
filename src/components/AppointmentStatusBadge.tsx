import React from 'react';
import type { DoctorAppointmentView } from '../api/types';
import { appointmentStatusPresentation } from '../utils/appointmentStatus';
import { Badge } from './Badge';

export function AppointmentStatusBadge({
  appointment,
}: {
  appointment: DoctorAppointmentView;
}) {
  const { label, variant } = appointmentStatusPresentation(appointment);
  return <Badge text={label} variant={variant} />;
}
