/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DoctorAppointmentView } from '../src/api/types';
import {
  buildDaysForMonth,
  buildMonths,
  buildTimeSlots,
  formatDateParam,
} from '../src/utils/appointmentAvailability';
import type { TimeSlot } from '../src/utils/appointmentAvailability';
import { rescheduleAppointment } from '../src/screens/appointments/rescheduleAppointment';
import { AppointmentReminderService } from '../src/screens/appointments/reminders/reminderService';

const rules = {
  clinic_opening_time: '08:00',
  clinic_close_time: '12:00',
  clinic_average_appointment_time: '30',
  clinic_break_time: '10:00',
  clinic_break_duration: '30',
};
const now = Date.parse('2030-11-25T07:00:00-05:00');
const appointment: DoctorAppointmentView = {
  appointment_id: 7,
  clinic_id: 1,
  doctor_id: 2,
  start_date_time: '2030-11-25T08:00:00-05:00',
  end_date_time: '2030-11-25T08:30:00-05:00',
  clinic_name: 'Centro',
  first_name: 'Ana',
  first_last_name: 'Ruiz',
  second_last_name: '',
  appointment_description: 'Notas que deben conservarse',
};
const slot = (): TimeSlot => ({
  id: '2030-11-25T14:00:00.000Z',
  start: new Date('2030-11-25T09:00:00-05:00'),
  end: new Date('2030-11-25T09:30:00-05:00'),
  label: '09:00 - 09:30',
  status: 'available',
});

function dependencies() {
  const calls: unknown[] = [];
  let active = true;
  return {
    calls,
    setActive: (value: boolean) => {
      active = value;
    },
    deps: {
      update: async (id: number, dates: unknown) => {
        calls.push(['update', id, dates]);
      },
      cancelReminders: async (id: number) => {
        calls.push(['cancelReminders', id]);
      },
      refreshReminders: async () => {
        calls.push(['refreshReminders']);
      },
      sessionIsCurrent: () => active,
      now: () => now,
    },
  };
}

test('uses the Colombian calendar at UTC midnight and across year/leap-month boundaries', () => {
  const edge = new Date('2031-01-01T02:00:00Z');
  assert.equal(formatDateParam(edge), '2030-12-31');
  const months = buildMonths(edge);
  assert.equal(months[0].key, '2030-12');
  assert.equal(months[1].key, '2031-01');
  assert.deepEqual(
    buildDaysForMonth(months[0], edge).map((day) => day.key),
    ['2030-12-31'],
  );
  const leap = buildMonths(new Date('2032-02-01T12:00:00Z'))[0];
  assert.equal(buildDaysForMonth(leap, leap.date).at(-1)?.key, '2032-02-29');
});

test('builds Colombian instants and blocks overlapping bookings, breaks and past slots', () => {
  const slots = buildTimeSlots(
    '2030-11-25',
    rules,
    [
      {
        appointment_id: 99,
        start_date_time: '2030-11-25T14:15:00Z',
        end_date_time: '2030-11-25T14:45:00Z',
      },
    ],
    { now: Date.parse('2030-11-25T08:00:00-05:00') },
  );
  assert.equal(slots[0].start.toISOString(), '2030-11-25T13:00:00.000Z');
  assert.equal(slots[0].status, 'past');
  assert.equal(
    slots.find((item) => item.label.startsWith('08:30'))?.status,
    'available',
  );
  assert.equal(
    slots.find((item) => item.label.startsWith('09:00'))?.status,
    'booked',
  );
  assert.equal(
    slots.find((item) => item.label.startsWith('09:30'))?.status,
    'booked',
  );
  assert.equal(
    slots.find((item) => item.label.startsWith('10:00'))?.status,
    'break',
  );
  assert.equal(
    slots.find((item) => item.label.startsWith('10:30'))?.status,
    'available',
  );
});

test('excludes only the appointment being moved and marks its unchanged slot as current', () => {
  const slots = buildTimeSlots(
    '2030-11-25',
    rules,
    [
      appointment,
      {
        ...appointment,
        appointment_id: 8,
        start_date_time: '2030-11-25T08:30:00-05:00',
        end_date_time: '2030-11-25T09:00:00-05:00',
      },
    ],
    { now, excludeAppointmentId: 7, currentStart: appointment.start_date_time },
  );
  assert.equal(slots[0].status, 'current');
  assert.equal(slots[1].status, 'booked');
  assert.equal(slots[2].status, 'available');
});

test('matches weekday-only API availability and fails closed for invalid schedule or bookings', () => {
  assert.deepEqual(buildTimeSlots('2030-11-30', rules, [], { now }), []);
  assert.throws(() =>
    buildTimeSlots(
      '2030-11-25',
      { ...rules, clinic_average_appointment_time: '0' },
      [],
    ),
  );
  assert.throws(() =>
    buildTimeSlots('2030-11-25', rules, [
      { start_date_time: 'invalid', end_date_time: 'invalid' },
    ]),
  );
  assert.equal(
    buildTimeSlots(
      '2030-11-25',
      { ...rules, clinic_average_appointment_time: '00:30:00' },
      [],
      { now },
    ).length,
    8,
  );
});

test('PUT changes only dates on the same appointment and replaces reminders after server success', async () => {
  const { deps, calls } = dependencies();
  const result = await rescheduleAppointment(appointment, slot(), deps);
  assert.deepEqual(calls, [
    [
      'update',
      7,
      {
        start_date_time: '2030-11-25T14:00:00.000Z',
        end_date_time: '2030-11-25T14:30:00.000Z',
      },
    ],
    ['cancelReminders', 7],
    ['refreshReminders'],
  ]);
  assert.equal(result?.appointment.appointment_id, 7);
  assert.equal(
    result?.appointment.appointment_description,
    appointment.appointment_description,
  );
  assert.equal(result?.appointment.doctor_id, 2);
  assert.equal(result?.remindersUpdated, true);
  assert.equal(appointment.start_date_time, '2030-11-25T08:00:00-05:00');
});

test('a rejected conflict or network PUT preserves the old appointment and all reminders', async () => {
  for (const message of ['409 Conflict', 'Network request failed']) {
    const { deps, calls } = dependencies();
    deps.update = async () => {
      throw new Error(message);
    };
    await assert.rejects(
      rescheduleAppointment(appointment, slot(), deps),
      new RegExp(message),
    );
    assert.deepEqual(calls, []);
  }
});

test('validates past, current, unavailable and incorrect-duration selections before sending PUT', async () => {
  for (const selection of [
    { ...slot(), status: 'booked' as const },
    { ...slot(), status: 'break' as const },
    { ...slot(), start: new Date(now - 60_000) },
    {
      ...slot(),
      start: new Date(appointment.start_date_time),
      end: new Date(appointment.end_date_time),
    },
    { ...slot(), end: new Date(slot().end.getTime() + 60_000) },
  ]) {
    const { deps, calls } = dependencies();
    await assert.rejects(rescheduleAppointment(appointment, selection, deps));
    assert.deepEqual(calls, []);
  }
  const { deps, calls } = dependencies();
  await assert.rejects(
    rescheduleAppointment(
      { ...appointment, start_date_time: new Date(now - 1).toISOString() },
      slot(),
      deps,
    ),
  );
  assert.deepEqual(calls, []);
});

test('a failed refresh after successful PUT removes stale alarms and reports a recoverable warning', async () => {
  const { deps, calls } = dependencies();
  deps.refreshReminders = async () => {
    throw new Error('offline');
  };
  const result = await rescheduleAppointment(appointment, slot(), deps);
  assert.equal(result?.appointment.start_date_time, slot().start.toISOString());
  assert.equal(result?.remindersUpdated, false);
  assert.deepEqual(calls.at(-1), ['cancelReminders', 7]);
});

test('notification cleanup failure never reports a successful server change as a failed appointment', async () => {
  const { deps } = dependencies();
  deps.cancelReminders = async () => {
    throw new Error('native unavailable');
  };
  const result = await rescheduleAppointment(appointment, slot(), deps);
  assert.equal(result?.remindersUpdated, false);
  assert.equal(result?.appointment.start_date_time, slot().start.toISOString());
});

test('session changes before dispatch or during PUT never affect the next account reminders or UI', async () => {
  const first = dependencies();
  first.setActive(false);
  assert.equal(
    await rescheduleAppointment(appointment, slot(), first.deps),
    null,
  );
  assert.deepEqual(first.calls, []);
  const second = dependencies();
  second.deps.update = async () => {
    second.setActive(false);
  };
  assert.equal(
    await rescheduleAppointment(appointment, slot(), second.deps),
    null,
  );
  assert.deepEqual(second.calls, []);
});

test('rescheduling can observe a native scheduling failure while ordinary background sync remains nonblocking', async () => {
  const service = new AppointmentReminderService(
    {
      hasPermission: async () => true,
      requestPermission: async () => true,
      scheduled: async () => [],
      presented: async () => [],
      cancel: async () => {},
      dismiss: async () => {},
      schedule: async () => {
        throw new Error('native scheduling unavailable');
      },
    },
    async () => [appointment],
    () => true,
    () => now - 48 * 3_600_000,
  );
  await service.setSession({ patientId: 42, sessionId: 1 });
  assert.deepEqual(await service.refresh(), [appointment]);
  await assert.rejects(
    service.refresh(false, { throwOnDeviceError: true }),
    /native scheduling unavailable/,
  );
});
