import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import appointmentsApi from '../api/appointments';
import apiClient from '../api/client';
import type {
  AppointmentAction,
  AppointmentState,
  DoctorAppointmentView,
} from '../api/types';
import { appointmentActionLabels } from '../utils/appointmentStatus';
import { appAlerts } from '../utils/appAlerts';

export function useAppointmentAction(
  onChanged: (state: AppointmentState) => Promise<unknown> | unknown,
  scope?: string | number,
) {
  const [pending, setPending] = useState<{
    appointmentId: number;
    action: AppointmentAction;
  } | null>(null);
  const busy = useRef(false);
  const focused = useRef(false);
  const focusGeneration = useRef(0);
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const onChangedRef = useRef(onChanged);
  onChangedRef.current = onChanged;

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      ++focusGeneration.current;
      return () => {
        focused.current = false;
        ++focusGeneration.current;
      };
    }, []),
  );

  const requestAction = (
    appointment: DoctorAppointmentView,
    action: AppointmentAction,
  ) => {
    if (
      busy.current ||
      !appointment.allowed_actions?.includes(action) ||
      !Number.isInteger(appointment.status_version)
    )
      return;
    const sessionId = apiClient.getSessionId();
    const currentScope = scopeRef.current;
    const currentFocus = focusGeneration.current;
    const current = () =>
      focused.current &&
      sessionId === apiClient.getSessionId() &&
      currentScope === scopeRef.current &&
      currentFocus === focusGeneration.current;
    const perform = async () => {
      if (busy.current || !current()) return;
      busy.current = true;
      setPending({ appointmentId: appointment.appointment_id, action });
      try {
        const state = await appointmentsApi.performAction(
          appointment.appointment_id,
          action,
          appointment.status_version!,
        );
        if (current()) await onChangedRef.current(state);
      } catch (error: any) {
        if (!current()) return;
        try {
          const latest = await appointmentsApi.getAppointment(
            appointment.appointment_id,
          );
          if (current()) await onChangedRef.current(latest as AppointmentState);
        } catch {}
        if (current())
          appAlerts.alert(
            'No se pudo actualizar la cita',
            error?.message || 'Actualiza la agenda y vuelve a intentarlo.',
            undefined,
            { variant: 'error' },
          );
      } finally {
        busy.current = false;
        setPending(null);
      }
    };
    const confirmation: Partial<Record<AppointmentAction, string>> = {
      complete:
        '¿Deseas cerrar la atención de este paciente? La cita quedará registrada como atendida.',
      no_show:
        '¿Confirmas que el paciente no asistió? La cita quedará en el historial como no asistida.',
      cancel:
        '¿Deseas cancelar esta cita? Se conservará en el historial y su horario quedará disponible.',
    };
    if (confirmation[action]) {
      appAlerts.alert(
        appointmentActionLabels[action],
        confirmation[action]!,
        [
          { text: 'Volver', style: 'cancel' },
          {
            text: appointmentActionLabels[action],
            style: action === 'complete' ? 'default' : 'destructive',
            onPress: perform,
          },
        ],
        { variant: action === 'complete' ? 'primary' : 'danger' },
      );
    } else {
      void perform();
    }
  };

  return { pending, requestAction };
}
