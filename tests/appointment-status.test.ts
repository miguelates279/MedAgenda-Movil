import assert from 'node:assert/strict';
import test from 'node:test';
import type {
  AppointmentStatus,
  DoctorAppointmentView,
} from '../src/api/types';
import {
  appointmentActionsForView,
  appointmentStatusPresentation,
  groupAppointmentsByHour,
  isAppointmentActive,
  isAppointmentUpcoming,
} from '../src/utils/appointmentStatus';

test('muestra solo las acciones del modo activo cuando la cuenta reúne varias membresías', () => {
  const union = [
    'confirm',
    'check_in',
    'call',
    'start',
    'complete',
    'no_show',
    'cancel',
  ] as const;
  assert.deepEqual(appointmentActionsForView(union, 'patient'), [
    'confirm',
    'check_in',
    'cancel',
  ]);
  assert.deepEqual(appointmentActionsForView(union, 'doctor'), [
    'call',
    'start',
    'complete',
    'no_show',
  ]);
  assert.deepEqual(appointmentActionsForView(union, 'reception'), [
    'confirm',
    'check_in',
    'call',
    'no_show',
    'cancel',
  ]);
});

test('el filtro de presentación nunca concede acciones que el backend no haya permitido', () => {
  for (const view of ['patient', 'doctor', 'reception'] as const) {
    assert.deepEqual(appointmentActionsForView(undefined, view), []);
    assert.deepEqual(appointmentActionsForView([], view), []);
    const granted = ['call', 'cancel'] as const;
    assert.ok(
      appointmentActionsForView(granted, view).every((action) =>
        granted.includes(action as 'call' | 'cancel'),
      ),
    );
  }
});
import appointmentsApi from '../src/api/appointments';
import apiClient from '../src/api/client';

const appointment = (
  changes: Partial<DoctorAppointmentView> = {},
): DoctorAppointmentView => ({
  appointment_id: 8,
  first_name: 'Ana',
  first_last_name: 'Pérez',
  second_last_name: 'Díaz',
  clinic_name: 'Clínica',
  start_date_time: '2026-11-26T15:00:00Z',
  end_date_time: '2026-11-26T15:30:00Z',
  appointment_status: 'scheduled',
  status_version: 0,
  status_updated_at: null,
  allowed_actions: [],
  can_reschedule: false,
  can_edit_notes: false,
  ...changes,
});

test('muestra estados persistidos sin convertir una fecha pasada en atención completada', () => {
  const now = Date.parse('2026-11-27T15:00:00Z');
  assert.equal(
    appointmentStatusPresentation(appointment(), now).label,
    'Sin cierre registrado',
  );
  const labels: Record<AppointmentStatus, string> = {
    scheduled: 'Programada',
    confirmed: 'Confirmada',
    waiting: 'En sala de espera',
    called: 'Llamada a consulta',
    in_progress: 'En consulta',
    completed: 'Atendida',
    cancelled: 'Cancelada',
    no_show: 'No asistió',
  };
  for (const [status, label] of Object.entries(labels)) {
    const value = appointment({
      appointment_status: status as AppointmentStatus,
      status_updated_at: '2026-11-26T15:00:00Z',
    });
    assert.equal(appointmentStatusPresentation(value, now).label, label);
  }
  assert.equal(
    appointmentStatusPresentation(
      appointment({ appointment_status: undefined }),
      now,
    ).label,
    'Estado no disponible',
  );
});

test('las canceladas y no asistidas permanecen en historial incluso con fecha futura', () => {
  const now = Date.parse('2026-11-25T15:00:00Z');
  for (const status of ['completed', 'cancelled', 'no_show'] as const) {
    const value = appointment({ appointment_status: status });
    assert.equal(isAppointmentActive(value), false);
    assert.equal(isAppointmentUpcoming(value, now), false);
  }
});

test('mantiene la cita activa de hoy tras su hora y la consulta abierta al cruzar medianoche de Colombia', () => {
  const now = Date.parse('2026-11-27T02:30:00Z');
  assert.equal(isAppointmentUpcoming(appointment(), now), true);
  const nextDay = Date.parse('2026-11-27T05:30:00Z');
  assert.equal(isAppointmentUpcoming(appointment(), nextDay), false);
  assert.equal(
    isAppointmentUpcoming(
      appointment({ appointment_status: 'in_progress' }),
      nextDay,
    ),
    true,
  );
  assert.equal(
    isAppointmentUpcoming(appointment({ start_date_time: 'invalid' }), now),
    false,
  );
});

test('agrupa agenda completa por hora colombiana y ordena citas sin truncar pacientes', () => {
  const rows = Array.from({ length: 25 }, (_, index) =>
    appointment({
      appointment_id: index + 1,
      start_date_time: new Date(
        Date.parse('2026-11-26T15:00:00Z') + index * 600_000,
      ).toISOString(),
    }),
  ).reverse();
  const groups = groupAppointmentsByHour(rows);
  assert.equal(groups[0].title, '10:00');
  assert.deepEqual(
    groups[0].data.map((row) => row.appointment_id),
    [1, 2, 3, 4, 5, 6],
  );
  assert.equal(
    groups.reduce((count, group) => count + group.data.length, 0),
    25,
  );
});

test('el contrato de acciones envía versión y sesión y usa agenda privada por clínica', async () => {
  const originalFetch = globalThis.fetch;
  const calls: { path: string; options: RequestInit }[] = [];
  apiClient.setSession('test-session', 5);
  globalThis.fetch = async (input, options) => {
    calls.push({ path: String(input), options: options ?? {} });
    return new Response(
      JSON.stringify({
        appointment_id: 8,
        appointment_status: 'called',
        status_version: 4,
        allowed_actions: ['start'],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  };
  try {
    const result = await appointmentsApi.performAction(8, 'call', 3);
    assert.equal(result.status_version, 4);
    assert.equal(calls[0].path.endsWith('/appointments/8/actions'), true);
    assert.equal(calls[0].options.method, 'POST');
    assert.deepEqual(JSON.parse(String(calls[0].options.body)), {
      action: 'call',
      expected_version: 3,
    });
    assert.equal(
      (calls[0].options.headers as Record<string, string>).Authorization,
      'Bearer test-session',
    );
    await appointmentsApi.getClinicAppointments(9, '2026-11-26');
    assert.equal(
      calls[1].path.endsWith('/appointments/clinic/9?date=2026-11-26'),
      true,
    );
    await appointmentsApi.getAppointment(8);
    assert.equal(calls[2].path.endsWith('/appointments/8'), true);
  } finally {
    globalThis.fetch = originalFetch;
    apiClient.setSession(null, 6);
  }
});
