import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clinicsApi from '../api/clinics';
import apiClient from '../api/client';
import type { ClinicScheduleRules } from '../api/types';
import {
  buildDaysForMonth,
  buildMonths,
  buildTimeSlots,
  formatDateParam,
} from '../utils/appointmentAvailability';
import type { TimeSlot } from '../utils/appointmentAvailability';

export interface AvailabilityOptions {
  excludeAppointmentId?: number;
  initialStart?: string;
}

export function useAppointmentAvailability(
  clinicId: number,
  doctorId: number,
  options: AvailabilityOptions = {},
) {
  const { excludeAppointmentId, initialStart } = options;
  const scope = `${apiClient.getSessionId()}:${clinicId}:${doctorId}:${excludeAppointmentId ?? ''}`;
  const months = useMemo(() => buildMonths(), []);
  const initialDay =
    initialStart && Number.isFinite(Date.parse(initialStart))
      ? formatDateParam(new Date(initialStart))
      : '';
  const [selectedMonthKey, setSelectedMonthKey] = useState(
    () =>
      months.find((month) => initialDay.startsWith(month.key))?.key ??
      months[0]?.key ??
      '',
  );
  const activeMonth =
    months.find((month) => month.key === selectedMonthKey) ?? months[0];
  const days = useMemo(
    () => (activeMonth ? buildDaysForMonth(activeMonth) : []),
    [activeMonth],
  );
  const [dayKey, setDayKey] = useState(initialDay);
  const selectedDayKey = days.some((day) => day.key === dayKey)
    ? dayKey
    : (days[0]?.key ?? '');
  const selectedDate =
    days.find((day) => day.key === selectedDayKey)?.date ?? null;
  const selectedDayLabel =
    selectedDate?.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }) ?? 'Elige un día';
  const [rulesState, setRulesState] = useState<{
    scope: string;
    rules: ClinicScheduleRules | null;
    error: string | null;
    loading: boolean;
  }>({ scope: '', rules: null, error: null, loading: false });
  const [rulesRevision, setRulesRevision] = useState(0);
  const [slotState, setSlotState] = useState<{
    key: string;
    slots: TimeSlot[];
    error: string | null;
    loading: boolean;
  }>({ key: '', slots: [], error: null, loading: false });
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const request = useRef(0);
  const mounted = useRef(true);
  const rules = rulesState.scope === scope ? rulesState.rules : null;
  const loadingRules = rulesState.scope !== scope || rulesState.loading;
  const rulesError = rulesState.scope === scope ? rulesState.error : null;
  const queryKey = `${scope}:${selectedDayKey}`;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      ++request.current;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const sessionId = apiClient.getSessionId();
    setSelectedSlotId(null);
    setRulesState({ scope, rules: null, error: null, loading: true });
    if (!clinicId || !doctorId) {
      setRulesState({
        scope,
        rules: null,
        error: 'No se pudo identificar la clínica o el médico de la cita.',
        loading: false,
      });
      return;
    }
    clinicsApi
      .getClinicScheduleRules(clinicId)
      .then((data) => {
        if (active && sessionId === apiClient.getSessionId())
          setRulesState({ scope, rules: data, error: null, loading: false });
      })
      .catch((error: Error) => {
        if (active && sessionId === apiClient.getSessionId())
          setRulesState({
            scope,
            rules: null,
            error:
              error.message || 'No se pudo cargar el horario de la clínica.',
            loading: false,
          });
      });
    return () => {
      active = false;
    };
  }, [clinicId, doctorId, scope, rulesRevision]);

  const refreshSlots = useCallback(
    async (explicitDate?: Date) => {
      const revision = ++request.current;
      const day = explicitDate ? formatDateParam(explicitDate) : selectedDayKey;
      const key = `${scope}:${day}`;
      const sessionId = apiClient.getSessionId();
      setSelectedSlotId(null);
      if (!rules || !day || !clinicId || !doctorId) return;
      setSlotState({ key, slots: [], error: null, loading: true });
      const valid = () =>
        mounted.current &&
        revision === request.current &&
        sessionId === apiClient.getSessionId();
      try {
        const booked = await clinicsApi.getClinicDoctorAppointmentsForDay(
          clinicId,
          doctorId,
          day,
        );
        const slots = buildTimeSlots(day, rules, booked, {
          excludeAppointmentId,
          currentStart: initialStart,
        });
        if (valid()) setSlotState({ key, slots, error: null, loading: false });
      } catch (error: any) {
        if (valid())
          setSlotState({
            key,
            slots: [],
            error: error.message || 'No se pudo cargar la disponibilidad.',
            loading: false,
          });
      }
    },
    [
      clinicId,
      doctorId,
      rules,
      selectedDayKey,
      scope,
      excludeAppointmentId,
      initialStart,
    ],
  );

  useEffect(() => {
    void refreshSlots();
    return () => {
      ++request.current;
    };
  }, [refreshSlots]);

  const loadingSlots =
    !!rules && (slotState.key !== queryKey || slotState.loading);
  const slots =
    rules && !loadingRules && slotState.key === queryKey ? slotState.slots : [];
  const slotsError = slotState.key === queryKey ? slotState.error : null;
  const selectedSlot =
    !loadingSlots && !loadingRules
      ? (slots.find(
          (slot) =>
            slot.id === selectedSlotId &&
            slot.status === 'available' &&
            slot.start.getTime() > Date.now(),
        ) ?? null)
      : null;
  const retry = () => {
    setSelectedSlotId(null);
    setRulesRevision((value) => value + 1);
  };

  return {
    rules,
    loadingRules,
    rulesError,
    months,
    selectedMonthKey,
    setSelectedMonthKey,
    days,
    selectedDayKey,
    setSelectedDayKey: setDayKey,
    selectedDate,
    selectedDayLabel,
    slots,
    loadingSlots,
    slotsError,
    selectedSlotId,
    setSelectedSlotId,
    selectedSlot,
    refreshSlots,
    retry,
  };
}
