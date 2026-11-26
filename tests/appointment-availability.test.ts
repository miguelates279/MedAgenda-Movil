import assert from 'node:assert/strict';
import test from 'node:test';
import appointmentsApi from '../src/api/appointments';
import apiClient from '../src/api/client';
import type {
  AppointmentAvailability,
  DoctorAppointmentView,
} from '../src/api/types';
import {
  availabilityNow,
  buildAvailabilityCalendar,
  createAvailabilityClock,
  currentAppointmentCapabilities,
  mapAvailabilitySlots,
  slotStatusLabel,
} from '../src/utils/appointmentAvailability';
import { rescheduleAppointment } from '../src/screens/appointments/rescheduleAppointment';

const now = Date.parse('2030-11-25T12:00:00.000Z');
const response = (): AppointmentAvailability => ({
  clinic_id: 1,
  doctor_id: 2,
  date: '2030-11-25',
  time_zone: 'America/Bogota',
  server_now: new Date(now).toISOString(),
  minimum_advance_minutes: 60,
  duration_minutes: 30,
  unavailable_reason: null,
  slots: [
    'available',
    'booked',
    'break',
    'past',
    'too_soon',
    'unavailable',
    'current',
  ].map((status, index) => ({
    start_date_time: new Date(now + (60 + index * 30) * 60_000).toISOString(),
    end_date_time: new Date(now + (90 + index * 30) * 60_000).toISOString(),
    status: status as AppointmentAvailability['slots'][number]['status'],
  })),
});
const appointment = (): DoctorAppointmentView => ({
  appointment_id: 7,
  clinic_id: 1,
  doctor_id: 2,
  start_date_time: '2030-11-25T13:00:00.000Z',
  end_date_time: '2030-11-25T13:30:00.000Z',
  first_name: 'Ana',
  first_last_name: 'Ruiz',
  second_last_name: '',
  clinic_name: 'Centro',
  appointment_status: 'scheduled',
  allowed_actions: ['confirm', 'cancel'],
  can_reschedule: true,
  can_edit_notes: true,
  minimum_advance_minutes: 60,
  change_deadline: '2030-11-25T12:00:00.000Z',
});

test('respeta estados del servidor, muestra Colombia y cierra el horario al vencer la hora mínima', () => {
  const availability = response();
  const slots = mapAvailabilitySlots(availability, now);
  assert.equal(slots[0].label, '08:00 - 08:30');
  assert.equal(slots[0].status, 'available');
  assert.deepEqual(
    slots.slice(1).map((slot) => slot.status),
    availability.slots.slice(1).map((slot) => slot.status),
  );
  assert.equal(
    mapAvailabilitySlots(availability, now + 1)[0].status,
    'too_soon',
  );
  assert.equal(
    mapAvailabilitySlots(availability, now + 3_600_000)[0].status,
    'past',
  );
  assert.equal(slotStatusLabel('unavailable'), 'No disponible');
  assert.equal(slotStatusLabel('too_soon'), 'Fuera de plazo');
  assert.equal(slotStatusLabel('current'), 'Cita actual');
});

test('el reloj del servidor avanza monotónicamente aunque el teléfono cambie de fecha', () => {
  const original = Date.now;
  try {
    const clock = createAvailabilityClock(
      new Date(now).toISOString(),
      200,
      10_000,
    );
    Date.now = () => Date.parse('2050-01-01T00:00:00Z');
    assert.equal(availabilityNow(clock, 11_000), now + 1_200);
    Date.now = () => Date.parse('1980-01-01T00:00:00Z');
    assert.equal(availabilityNow(clock, 12_000), now + 2_200);
    assert.equal(availabilityNow(clock, 9_000), now + 200);
    assert.throws(() => createAvailabilityClock('invalid'), /servidor/);
    assert.throws(
      () => createAvailabilityClock('2030-11-25T12:00:00'),
      /servidor/,
    );
  } finally {
    Date.now = original;
  }
});

test('reconcilia un calendario de teléfono adelantado o atrasado con el servidor y conserva fechas explícitas válidas', () => {
  const serverNow = Date.parse('2030-12-31T23:30:00-05:00');
  for (const deviceDate of [
    '2031-01-03T12:00:00Z',
    '2030-12-28T12:00:00Z',
    '2050-01-01T12:00:00Z',
    '2000-01-01T12:00:00Z',
  ]) {
    const bootstrap = buildAvailabilityCalendar(Date.parse(deviceDate));
    assert.ok(bootstrap.selectedDayKey);
    const corrected = buildAvailabilityCalendar(serverNow);
    assert.equal(corrected.months[0].key, '2030-12');
    assert.equal(corrected.selectedDayKey, '2030-12-31');
  }
  const explicit = buildAvailabilityCalendar(
    serverNow,
    '2031-01',
    '2031-01-13',
  );
  assert.equal(explicit.selectedMonthKey, '2031-01');
  assert.equal(explicit.selectedDayKey, '2031-01-13');
  const midnight = buildAvailabilityCalendar(
    Date.parse('2031-01-01T05:00:00Z'),
    '2030-12',
    '2030-12-31',
  );
  assert.equal(midnight.selectedMonthKey, '2031-01');
  assert.equal(midnight.selectedDayKey, '2031-01-01');
});

test('la disponibilidad inválida falla cerrada en vez de inventar horarios libres', () => {
  for (const mutate of [
    (data: AppointmentAvailability) => {
      data.minimum_advance_minutes = 0;
    },
    (data: AppointmentAvailability) => {
      data.duration_minutes = 0;
    },
    (data: AppointmentAvailability) => {
      data.slots[0].end_date_time = data.slots[0].start_date_time;
    },
    (data: AppointmentAvailability) => {
      data.slots[0].start_date_time = 'invalid';
    },
    (data: AppointmentAvailability) => {
      data.slots[0].status = 'unknown' as 'available';
    },
    (data: AppointmentAvailability) => {
      data.slots.push(data.slots[0]);
    },
    (data: AppointmentAvailability) => {
      data.date = '2030-11-26';
    },
    (data: AppointmentAvailability) => {
      data.unavailable_reason = 'closed';
    },
  ]) {
    const data = response();
    mutate(data);
    assert.throws(() => mapAvailabilitySlots(data, now), /disponibilidad/);
  }
  for (const reason of ['closed', 'weekend'] as const) {
    assert.deepEqual(
      mapAvailabilitySlots(
        { ...response(), unavailable_reason: reason, slots: [] },
        now,
      ),
      [],
    );
  }
});

test('vencer el plazo solo retira cambios de horario y cancelar, conservando las notas hasta el inicio', () => {
  const value = appointment();
  assert.deepEqual(currentAppointmentCapabilities(value, now).allowed_actions, [
    'confirm',
    'cancel',
  ]);
  const expired = currentAppointmentCapabilities(value, now + 1);
  assert.equal(expired.can_reschedule, false);
  assert.equal(expired.can_edit_notes, true);
  assert.deepEqual(expired.allowed_actions, ['confirm']);
  assert.equal(
    currentAppointmentCapabilities(value, Date.parse(value.start_date_time))
      .can_edit_notes,
    false,
  );
  const denied = currentAppointmentCapabilities(
    {
      ...value,
      allowed_actions: [],
      can_reschedule: false,
      can_edit_notes: false,
    },
    now - 1,
  );
  assert.deepEqual(denied.allowed_actions, []);
  assert.equal(denied.can_reschedule, false);
  assert.equal(denied.can_edit_notes, false);
  assert.equal(value.can_reschedule, true);
  assert.deepEqual(value.allowed_actions, ['confirm', 'cancel']);
});

test('reprogramar exige una hora para la cita original y nueva antes de tocar servidor o recordatorios', async () => {
  const available = mapAvailabilitySlots(response(), now)[0];
  for (const [original, selected, current] of [
    [appointment(), available, now + 1],
    [
      { ...appointment(), start_date_time: '2030-11-25T15:00:00Z' },
      available,
      now + 1,
    ],
  ] as const) {
    const calls: string[] = [];
    await assert.rejects(
      rescheduleAppointment(original, selected, {
        now: () => current,
        sessionIsCurrent: () => true,
        update: async () => {
          calls.push('update');
        },
        cancelReminders: async () => {
          calls.push('cancel');
        },
        refreshReminders: async () => {
          calls.push('refresh');
        },
      }),
      /1 hora/,
    );
    assert.deepEqual(calls, []);
  }
  const calls: string[] = [];
  const later = {
    ...available,
    id: 'later',
    start: new Date(now + 7_200_000),
    end: new Date(now + 9_000_000),
  };
  await rescheduleAppointment(appointment(), later, {
    now: () => now,
    sessionIsCurrent: () => true,
    update: async () => {
      calls.push('update');
    },
    cancelReminders: async () => {
      calls.push('cancel');
    },
    refreshReminders: async () => {
      calls.push('refresh');
    },
  });
  assert.deepEqual(calls, ['update', 'cancel', 'refresh']);
});

test('consulta disponibilidad pública sin token y privada con sesión sin permitir excluir citas ajenas', async () => {
  const originalFetch = globalThis.fetch;
  const calls: { path: string; options: RequestInit }[] = [];
  apiClient.setSession('availability-session', 14);
  globalThis.fetch = async (input, options) => {
    calls.push({ path: String(input), options: options ?? {} });
    return new Response(JSON.stringify(response()), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    await appointmentsApi.getAvailability(1, 2, '2030-11-25');
    await appointmentsApi.getRescheduleAvailability(7, '2030-11-25');
    assert.equal(
      calls[0].path.endsWith(
        '/appointments/availability/day?clinic_id=1&doctor_id=2&date=2030-11-25',
      ),
      true,
    );
    assert.equal(
      (calls[0].options.headers as Record<string, string>).Authorization,
      undefined,
    );
    assert.equal(
      calls[1].path.endsWith('/appointments/7/availability?date=2030-11-25'),
      true,
    );
    assert.equal(
      (calls[1].options.headers as Record<string, string>).Authorization,
      'Bearer availability-session',
    );
    assert.equal(
      calls.every((call) => !call.path.includes('exclude')),
      true,
    );
  } finally {
    globalThis.fetch = originalFetch;
    apiClient.setSession(null, 15);
  }
});
