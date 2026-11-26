import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import appointmentsApi from '../../api/appointments';
import apiClient from '../../api/client';
import { DoctorAppointmentView } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { useAppointmentAction } from '../../hooks/useAppointmentAction';
import { useFocusedRefresh } from '../../hooks/useFocusedRefresh';
import { formatDateParam } from '../../utils/appointmentAvailability';
import { useDispatchClinics } from '../../hooks/useDispatchClinics';

export function useClinicAppointmentAgenda(clinicId: number) {
  const { isAuthenticated, activeMode, adminClinics } = useAuth();
  const { clinics } = useDispatchClinics();
  const employee =
    activeMode === 'patient' &&
    clinics.some(
      (clinic) =>
        clinic.clinic_id === clinicId &&
        clinic.role_within_clinic === 'Employee',
    );
  const administrator =
    activeMode === 'admin' &&
    adminClinics.some((clinic) => clinic.clinic_id === clinicId);
  const enabled = isAuthenticated && (administrator || employee);
  const [appointments, setAppointments] = useState<DoctorAppointmentView[]>([]);
  const [date, setDate] = useState(() => formatDateParam(new Date()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const active = useRef(false);
  const generation = useRef(0);

  const load = useCallback(
    async (quiet = false) => {
      if (!enabled || !active.current) return;
      const request = ++generation.current;
      const session = apiClient.getSessionId();
      const current = () =>
        active.current &&
        request === generation.current &&
        session === apiClient.getSessionId();
      if (!quiet) setLoading(true);
      try {
        const today = formatDateParam(new Date());
        const data = await appointmentsApi.getClinicAppointments(
          clinicId,
          today,
        );
        if (current()) {
          setAppointments(data);
          setDate(today);
          setError(null);
        }
      } catch (cause: any) {
        if (current()) {
          setAppointments([]);
          setError(
            cause?.message || 'No se pudo cargar la agenda de recepción.',
          );
        }
      } finally {
        if (current()) setLoading(false);
      }
    },
    [clinicId, enabled],
  );

  useFocusEffect(
    useCallback(() => {
      active.current = true;
      setAppointments([]);
      setError(null);
      void load();
      return () => {
        active.current = false;
        ++generation.current;
      };
    }, [load]),
  );
  useFocusedRefresh(() => load(true), enabled);
  const { pending, requestAction } = useAppointmentAction(async (state) => {
    setAppointments((previous) =>
      previous.map((appointment) =>
        appointment.appointment_id === state.appointment_id
          ? { ...appointment, ...state }
          : appointment,
      ),
    );
    await load(true);
  }, `${clinicId}:${activeMode}`);
  return {
    enabled,
    appointments,
    date,
    loading,
    error,
    load,
    pending,
    requestAction,
  };
}
