import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import appointmentsApi from '../api/appointments';
import apiClient from '../api/client';
import type { AppointmentAvailability } from '../api/types';
import { useFocusedRefresh } from './useFocusedRefresh';
import {
  buildAvailabilityCalendar,
  availabilityNow,
  createAvailabilityClock,
  formatDateParam,
  mapAvailabilitySlots,
  MINIMUM_ADVANCE_MINUTES,
  monotonicNow,
} from '../utils/appointmentAvailability';
import type {
  AvailabilityClock,
  TimeSlot,
} from '../utils/appointmentAvailability';

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
  const [state, setState] = useState<{
    key: string;
    response: AppointmentAvailability | null;
    clock: AvailabilityClock | null;
    error: string | null;
    loading: boolean;
  }>({ key: '', response: null, clock: null, error: null, loading: false });
  const [, updateClock] = useState(0);
  const now = state.clock ? availabilityNow(state.clock) : Date.now();
  const today = formatDateParam(new Date(now));
  const initialDay =
    initialStart && Number.isFinite(Date.parse(initialStart))
      ? formatDateParam(new Date(initialStart))
      : '';
  const [monthKey, setSelectedMonthKey] = useState(initialDay.slice(0, 7));
  const [dayKey, setDayKey] = useState(initialDay);
  const { months, days, selectedMonthKey, selectedDayKey, selectedDate } =
    useMemo(
      () =>
        buildAvailabilityCalendar(
          new Date(`${today}T12:00:00-05:00`).getTime(),
          monthKey,
          dayKey,
        ),
      [today, monthKey, dayKey],
    );
  const selectedDayLabel =
    selectedDate?.toLocaleDateString('es-CO', {
      timeZone: 'America/Bogota',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }) ?? 'Elige un día';
  const queryKey = `${scope}:${selectedDayKey}`;
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const request = useRef(0);
  const mounted = useRef(true);
  const currentKey = useRef(queryKey);
  currentKey.current = queryKey;
  const live = useRef(state);
  live.current = state;
  const loaded = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      ++request.current;
    };
  }, []);

  const refreshSlots = useCallback(
    async (explicitDate?: Date, quiet = false) => {
      const day = explicitDate ? formatDateParam(explicitDate) : selectedDayKey;
      const key = `${scope}:${day}`;
      if (key !== currentKey.current) return;
      const revision = ++request.current;
      const sessionId = apiClient.getSessionId();
      const valid = () =>
        mounted.current &&
        revision === request.current &&
        sessionId === apiClient.getSessionId() &&
        key === currentKey.current;
      if (!day || !clinicId || !doctorId) {
        setState({
          key,
          response: null,
          clock: null,
          loading: false,
          error: 'No se pudo identificar la clínica o el médico de la cita.',
        });
        return;
      }
      setState((previous) => ({
        key,
        response: quiet && previous.key === key ? previous.response : null,
        clock: previous.clock,
        error: null,
        loading: !quiet || previous.key !== key || !previous.response,
      }));
      const startedAt = monotonicNow();
      try {
        const response = excludeAppointmentId
          ? await appointmentsApi.getRescheduleAvailability(
              excludeAppointmentId,
              day,
            )
          : await appointmentsApi.getAvailability(clinicId, doctorId, day);
        const receivedAt = monotonicNow();
        if (
          response.clinic_id !== clinicId ||
          response.doctor_id !== doctorId ||
          response.date !== day
        )
          throw new Error(
            'La disponibilidad recibida no corresponde a esta cita.',
          );
        const clock = createAvailabilityClock(
          response.server_now,
          receivedAt - startedAt,
          receivedAt,
        );
        mapAvailabilitySlots(response, availabilityNow(clock));
        if (valid()) {
          loaded.current = true;
          setState({ key, response, clock, error: null, loading: false });
        }
      } catch (cause: any) {
        if (valid()) {
          setSelectedSlotId(null);
          setState((previous) => ({
            key,
            response: null,
            clock: previous.clock,
            loading: false,
            error: cause?.message || 'No se pudo cargar la disponibilidad.',
          }));
        }
      }
    },
    [clinicId, doctorId, selectedDayKey, scope, excludeAppointmentId],
  );

  const refreshRef = useRef(refreshSlots);
  refreshRef.current = refreshSlots;
  useEffect(() => {
    setSelectedSlotId(null);
    void refreshSlots();
    return () => {
      ++request.current;
    };
  }, [refreshSlots]);

  useFocusEffect(
    useCallback(() => {
      if (loaded.current) void refreshRef.current(undefined, true);
    }, [scope]),
  );
  useFocusedRefresh(
    () => refreshRef.current(undefined, true),
    !!clinicId && !!doctorId,
  );

  const response = state.key === queryKey ? state.response : null;
  const minimumAdvanceMinutes =
    response?.minimum_advance_minutes ?? MINIMUM_ADVANCE_MINUTES;
  const slots = useMemo(
    () => (response ? mapAvailabilitySlots(response, now) : []),
    [response, now],
  );
  const loadingSlots = state.key !== queryKey || state.loading;
  const slotsError = state.key === queryKey ? state.error : null;
  const withinChangeDeadline =
    !initialStart ||
    Date.parse(initialStart) - now >= minimumAdvanceMinutes * 60_000;
  const selectedSlot =
    !loadingSlots && !slotsError && withinChangeDeadline
      ? (slots.find(
          (slot) => slot.id === selectedSlotId && slot.status === 'available',
        ) ?? null)
      : null;

  useEffect(() => {
    if (selectedSlotId && !loadingSlots && !selectedSlot)
      setSelectedSlotId(null);
  }, [selectedSlotId, loadingSlots, selectedSlot]);

  useEffect(() => {
    if (!response || !state.clock) return;
    const current = availabilityNow(state.clock);
    const cutoffs = response.slots
      .filter((slot) => slot.status === 'available')
      .map(
        (slot) =>
          Date.parse(slot.start_date_time) - minimumAdvanceMinutes * 60_000 + 1,
      )
      .filter((cutoff) => cutoff > current);
    const originalCutoff = initialStart
      ? Date.parse(initialStart) - minimumAdvanceMinutes * 60_000 + 1
      : NaN;
    if (originalCutoff > current) cutoffs.push(originalCutoff);
    const nextDay = new Date(`${today}T00:00:00-05:00`).getTime() + 86_400_000;
    const delay = Math.max(1, Math.min(nextDay, ...cutoffs) - current);
    const timer = setTimeout(() => {
      updateClock((value) => value + 1);
      if (
        Number.isFinite(originalCutoff) &&
        originalCutoff <= availabilityNow(state.clock!)
      )
        void refreshRef.current(undefined, true);
    }, delay);
    return () => clearTimeout(timer);
  }, [response, state.clock, minimumAdvanceMinutes, initialStart, today, now]);

  const getServerNow = () =>
    live.current.clock && queryKey === currentKey.current
      ? availabilityNow(live.current.clock)
      : NaN;
  const isSlotAvailable = (slot: TimeSlot) => {
    const snapshot = live.current;
    if (
      snapshot.key !== currentKey.current ||
      queryKey !== currentKey.current ||
      !snapshot.response ||
      !snapshot.clock ||
      snapshot.loading
    )
      return false;
    if (
      initialStart &&
      Date.parse(initialStart) - availabilityNow(snapshot.clock) <
        snapshot.response.minimum_advance_minutes * 60_000
    )
      return false;
    return mapAvailabilitySlots(
      snapshot.response,
      availabilityNow(snapshot.clock),
    ).some(
      (candidate) =>
        candidate.id === slot.id &&
        candidate.end.getTime() === slot.end.getTime() &&
        candidate.status === 'available',
    );
  };

  return {
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
    minimumAdvanceMinutes,
    durationMinutes: response?.duration_minutes,
    unavailableReason: response?.unavailable_reason ?? null,
    refreshSlots,
    retry: () => {
      void refreshSlots();
    },
    getServerNow,
    isSlotAvailable,
  };
}
