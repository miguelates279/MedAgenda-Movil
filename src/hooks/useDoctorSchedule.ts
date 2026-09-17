import { useCallback, useEffect, useMemo, useState } from 'react';
import clinicsApi from '../api/clinics';
import appointmentsApi from '../api/appointments';
import {
  AppointmentSlot,
  ClinicScheduleRules,
  CreateAppointmentDto,
} from '../api/types';

export type SlotStatus = 'available' | 'booked' | 'break' | 'past';

export interface TimeSlot {
  id: string;
  start: Date;
  end: Date;
  label: string;
  status: SlotStatus;
  note?: string;
}

export interface MonthOption {
  key: string;
  label: string;
  date: Date;
}

export interface DayOption {
  key: string;
  label: string;
  weekLabel: string;
  date: Date;
}

const MONTHS_COUNT = 5;
const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const WEEKDAY_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const pad = (n: number) => n.toString().padStart(2, '0');

export const formatDateParam = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseTimeToMinutes = (value?: string | null): number | null => {
  if (!value) return null;
  const clean = String(value).trim();
  if (clean.includes('T') || clean.includes('-')) {
    const d = new Date(clean);
    if (!Number.isNaN(d.getTime())) return d.getUTCHours() * 60 + d.getUTCMinutes();
  }
  const parts = clean.split(':').map(Number);
  if (parts.length === 1 && Number.isFinite(parts[0])) return parts[0];
  if (parts.length === 0 || parts.some(Number.isNaN)) return null;
  const [hours = 0, minutes = 0, seconds = 0] = parts;
  return hours * 60 + minutes + Math.floor(seconds / 60);
};

const minutesBetween = (base: Date, target: Date) =>
  Math.floor((target.getTime() - base.getTime()) / 60000);

const formatRangeLabel = (startMin: number, endMin: number) => {
  const sH = pad(Math.floor(startMin / 60));
  const sM = pad(startMin % 60);
  const eH = pad(Math.floor(endMin / 60));
  const eM = pad(endMin % 60);
  return `${sH}:${sM} - ${eH}:${eM}`;
};

const buildMonths = (): MonthOption[] => {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const months: MonthOption[] = [];

  for (let i = 0; i < MONTHS_COUNT; i++) {
    const date = new Date(y, m + i, 1);
    const label = `${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
    months.push({ key: `${date.getFullYear()}-${date.getMonth()}`, label, date });
  }
  return months;
};

const buildDaysForMonth = (month: MonthOption): DayOption[] => {
  const now = new Date();
  const year = month.date.getFullYear();
  const monthIdx = month.date.getMonth();
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();

  const startDay =
    now.getFullYear() === year && now.getMonth() === monthIdx ? now.getDate() : 1;
  const days: DayOption[] = [];

  for (let day = startDay; day <= lastDay; day++) {
    const date = new Date(year, monthIdx, day);
    days.push({
      key: formatDateParam(date),
      label: `${day}`,
      weekLabel: WEEKDAY_SHORT[date.getDay()],
      date,
    });
  }
  return days;
};

export function useDoctorSchedule(clinicId: number, doctorId: number) {
  const [rules, setRules] = useState<ClinicScheduleRules | null>(null);
  const [loadingRules, setLoadingRules] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const months = useMemo(() => buildMonths(), []);
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(months[0]?.key || '');

  const activeMonth = useMemo(
    () => months.find((m) => m.key === selectedMonthKey) || months[0],
    [months, selectedMonthKey]
  );

  const days = useMemo(
    () => (activeMonth ? buildDaysForMonth(activeMonth) : []),
    [activeMonth]
  );

  const [selectedDayKey, setSelectedDayKey] = useState<string>(days[0]?.key || '');

  useEffect(() => {
    if (days.length > 0 && (!selectedDayKey || !days.some((d) => d.key === selectedDayKey))) {
      setSelectedDayKey(days[0].key);
    }
  }, [days, selectedDayKey]);

  const selectedDate = useMemo(
    () => days.find((d) => d.key === selectedDayKey)?.date || null,
    [days, selectedDayKey]
  );

  const selectedDayLabel = useMemo(() => {
    if (!selectedDate) return 'Elige un día';
    return `${WEEKDAY_NAMES[selectedDate.getDay()]}, ${selectedDate.getDate()} de ${MONTH_NAMES[selectedDate.getMonth()]}`;
  }, [selectedDate]);

  useEffect(() => {
    if (!clinicId || !doctorId) return;
    let active = true;

    (async () => {
      setLoadingRules(true);
      setRulesError(null);
      try {
        const data = await clinicsApi.getClinicScheduleRules(clinicId);
        if (active) setRules(data);
      } catch (err: any) {
        if (active) setRulesError(err.message || 'No se pudo cargar el horario de la clínica.');
      } finally {
        if (active) setLoadingRules(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [clinicId, doctorId]);

  const refreshSlots = useCallback(
    async (explicitDate?: Date) => {
      if (!rules || !clinicId || !doctorId) return;
      const targetDate = explicitDate || selectedDate;
      if (!targetDate) return;

      setLoadingSlots(true);
      setSlotsError(null);
      setSelectedSlotId(null);

      try {
        const dateStr = formatDateParam(targetDate);
        const booked = await clinicsApi.getClinicDoctorAppointmentsForDay(
          clinicId,
          doctorId,
          dateStr
        );

        const opening = parseTimeToMinutes(rules.clinic_opening_time);
        const closing = parseTimeToMinutes(rules.clinic_close_time);
        const slotMin = parseTimeToMinutes(rules.clinic_average_appointment_time) || 30;
        const breakStart = parseTimeToMinutes(rules.clinic_break_time);
        const breakDur = parseTimeToMinutes(rules.clinic_break_duration);
        const breakEnd = breakStart !== null && breakDur !== null ? breakStart + breakDur : null;

        if (opening === null || closing === null || opening >= closing) {
          setSlots([]);
          return;
        }

        const dayStart = new Date(`${dateStr}T00:00:00`);
        const now = new Date();

        const normalizedAppointments = booked
          .map((appt) => {
            const start = new Date(appt.start_date_time);
            const end = appt.end_date_time
              ? new Date(appt.end_date_time)
              : new Date(start.getTime() + slotMin * 60000);
            if (Number.isNaN(start.getTime())) return null;
            return {
              startMin: minutesBetween(dayStart, start),
              endMin: minutesBetween(dayStart, end),
            };
          })
          .filter((x): x is { startMin: number; endMin: number } => !!x);

        const generated: TimeSlot[] = [];

        for (let sMin = opening; sMin + slotMin <= closing; sMin += slotMin) {
          const eMin = sMin + slotMin;
          const sDate = new Date(dayStart.getTime() + sMin * 60000);
          const eDate = new Date(dayStart.getTime() + eMin * 60000);

          const isBreak =
            breakStart !== null && breakEnd !== null && sMin < breakEnd && eMin > breakStart;
          const isBooked = normalizedAppointments.some(
            (b) => sMin < b.endMin && eMin > b.startMin
          );
          const isPast = sDate < now;

          let status: SlotStatus = 'available';
          let noteText: string | undefined;

          if (isBooked) {
            status = 'booked';
            noteText = 'Ocupado';
          } else if (isBreak) {
            status = 'break';
            noteText = 'Descanso';
          } else if (isPast) {
            status = 'past';
            noteText = 'Hora pasada';
          }

          generated.push({
            id: sDate.toISOString(),
            start: sDate,
            end: eDate,
            label: formatRangeLabel(sMin, eMin),
            status,
            note: noteText,
          });
        }

        setSlots(generated);
      } catch (err: any) {
        setSlots([]);
        setSlotsError(err.message || 'Error al cargar disponibilidad.');
      } finally {
        setLoadingSlots(false);
      }
    },
    [clinicId, doctorId, rules, selectedDate]
  );

  useEffect(() => {
    if (rules && selectedDate) {
      refreshSlots(selectedDate);
    }
  }, [rules, selectedDate, refreshSlots]);

  const selectedSlot = useMemo(
    () => slots.find((s) => s.id === selectedSlotId && s.status === 'available') || null,
    [slots, selectedSlotId]
  );

  const confirmBooking = async (): Promise<void> => {
    if (!selectedSlot || !clinicId || !doctorId) {
      throw new Error('Selecciona un horario disponible antes de confirmar.');
    }

    setSubmitting(true);
    setScheduleError(null);

    try {
      const dto: CreateAppointmentDto = {
        clinic_id: clinicId,
        doctor_id: doctorId,
        start_date_time: selectedSlot.start,
        end_date_time: selectedSlot.end,
        appointment_description: note.trim() || undefined,
      };
      await appointmentsApi.scheduleAppointment(dto);
      setNote('');
      await refreshSlots(selectedSlot.start);
    } catch (err: any) {
      let message = err.message || 'No se pudo agendar la cita.';
      if (/409|Conflict/i.test(message)) {
        message = 'El horario seleccionado ya no se encuentra disponible.';
      }
      setScheduleError(message);
      throw new Error(message);
    } finally {
      setSubmitting(false);
    }
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
    setSelectedDayKey,
    selectedDate,
    selectedDayLabel,
    slots,
    loadingSlots,
    slotsError,
    selectedSlotId,
    setSelectedSlotId,
    selectedSlot,
    note,
    setNote,
    submitting,
    scheduleError,
    confirmBooking,
    refreshSlots,
  };
}

export default useDoctorSchedule;
