import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { test } from 'node:test';
import type { Server } from 'node:http';

const require = createRequire(import.meta.url);
const { createLayoutServer } = require('./fixtures/layout-server.cjs') as {
  createLayoutServer(options: { now: () => number; log: () => void }): Server;
};

test('el fixture conserva los cambios del despacho entre medico, paciente y recepcion con control de version', async (context) => {
  const now = Date.parse('2026-11-26T12:00:00-05:00');
  const server = createLayoutServer({ now: () => now, log: () => {} });
  context.after(() => server.close());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const request = async (
    path: string,
    role = 'patient',
    method = 'GET',
    body?: unknown,
  ) => {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        Authorization: `Bearer layout-${role}`,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };
  const action = (id: number, role: string, name: string, version: number) =>
    request(`/appointments/${id}/actions`, role, 'POST', {
      action: name,
      expected_version: version,
    });

  const before = await request('/appointments/patient');
  assert.equal(before.status, 200);
  assert.equal(before.body.length, 50);
  const statusSet = new Set(
    before.body.map((item: any) => item.appointment_status),
  );
  assert.deepEqual(
    [...statusSet].sort(),
    [
      'scheduled',
      'confirmed',
      'waiting',
      'called',
      'in_progress',
      'completed',
      'cancelled',
      'no_show',
    ].sort(),
  );
  const hidden = await request('/appointments/1000', 'admin');
  assert.equal(hidden.status, 200);
  assert.equal(hidden.body.patient_id, 42);
  assert.equal(hidden.body.doctor_id, 84);
  assert.equal(hidden.body.first_name, 'Paciente 01');
  assert.equal(hidden.body.doctor_first_name, 'Ana');

  const completeExisting = await action(1004, 'doctor', 'complete', 0);
  assert.equal(completeExisting.status, 200);
  const concurrent = await Promise.all([
    action(1000, 'doctor', 'call', 0),
    action(1000, 'admin', 'call', 0),
  ]);
  assert.deepEqual(
    concurrent.map((result) => result.status).sort(),
    [200, 409],
  );
  assert.equal(
    (await request('/appointments/1000')).body.appointment_status,
    'called',
  );
  assert.equal((await action(1000, 'patient', 'complete', 1)).status, 400);
  assert.equal((await action(1000, 'doctor', 'start', 1)).status, 200);
  assert.equal((await action(1009, 'doctor', 'start', 0)).status, 409);
  assert.equal((await action(1000, 'doctor', 'complete', 2)).status, 200);
  const finished = await request('/appointments/1000');
  assert.equal(finished.body.appointment_status, 'completed');
  assert.equal(finished.body.status_version, 3);
  assert.deepEqual(finished.body.allowed_actions, []);
  assert.equal(finished.body.can_reschedule, false);
  const agenda = await request(
    '/appointments/clinic/1?date=2026-11-26',
    'admin',
  );
  assert.equal(agenda.status, 200);
  assert.equal(
    agenda.body.find((item: any) => item.appointment_id === 1000)
      .appointment_status,
    'completed',
  );
  assert.equal(
    (await request('/appointments/clinic/1?date=2026-11-26')).status,
    404,
  );
  const state = await request('/__qa/state');
  assert.deepEqual(
    state.body.appointmentEvents
      .filter((event: any) => event.appointment_id === 1000)
      .map((event: any) => [event.action, event.version]),
    [
      ['call', 1],
      ['start', 2],
      ['complete', 3],
    ],
  );
});

test('el fixture mantiene las citas canceladas en el historial y libera el horario tras cancelar o no asistir', async (context) => {
  const now = Date.parse('2026-11-26T07:00:00-05:00');
  const server = createLayoutServer({ now: () => now, log: () => {} });
  context.after(() => server.close());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const request = async (path: string, method = 'GET', body?: unknown) => {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        Authorization: 'Bearer layout-patient',
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };
  assert.equal((await request('/appointments/1000', 'DELETE')).status, 200);
  const cancelled = await request('/appointments/1000');
  assert.equal(cancelled.body.appointment_status, 'cancelled');
  assert.equal((await request('/appointments/patient')).body.length, 50);
  const slots = await request(
    '/clinics/getClinicDoctorAppointmentsForDay?clinic_id=1&doctor_id=84&appointment_date=2026-11-26',
  );
  assert.ok(
    slots.body.every(
      (item: any) =>
        !['cancelled', 'no_show'].includes(item.appointment_status),
    ),
  );
  assert.ok(!slots.body.some((item: any) => item.appointment_id === 1000));
  assert.equal(
    (
      await request('/appointments/1000', 'PUT', {
        appointment_description: 'Cambio invalido',
      })
    ).status,
    400,
  );

  const confirmed = await request('/appointments/1/actions', 'POST', {
    action: 'confirm',
    expected_version: 0,
  });
  assert.equal(confirmed.body.appointment_status, 'confirmed');
  const newStart = '2026-12-02T08:00:00-05:00';
  const rescheduled = await request('/appointments/1', 'PUT', {
    start_date_time: newStart,
    end_date_time: '2026-12-02T08:30:00-05:00',
  });
  assert.equal(rescheduled.status, 200);
  const changed = await request('/appointments/1');
  assert.equal(changed.body.appointment_status, 'scheduled');
  assert.equal(changed.body.status_version, 2);
  assert.equal(changed.body.start_date_time, newStart);
});

test('el fixture da a recepcion solo sus clinicas y acciones operativas sin capacidades de medico ni administrador', async (context) => {
  const now = Date.parse('2026-11-26T12:00:00-05:00');
  const server = createLayoutServer({ now: () => now, log: () => {} });
  context.after(() => server.close());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const request = async (path: string, method = 'GET', body?: unknown) => {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        Authorization: 'Bearer layout-employee',
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };
  const login = await request('/auth/login', 'POST', {
    email: 'employee@layout.test',
    password: 'layout123',
  });
  assert.equal(login.body.isAdmin, false);
  assert.equal(login.body.isDoctor, false);
  assert.equal(login.body.token, 'layout-employee');
  const clinics = await request('/appointments/dispatch-clinics');
  assert.deepEqual(clinics.body, [
    { clinic_id: 1, clinic_name: 'Clinica 01', role_within_clinic: 'Employee' },
  ]);
  assert.deepEqual((await request('/admin/my-clinics')).body, []);
  assert.equal(
    (await request('/appointments/clinic/2?date=2026-11-26')).status,
    404,
  );
  const agenda = await request('/appointments/clinic/1?date=2026-11-26');
  assert.equal(agenda.status, 200);
  const waiting = agenda.body.find((item: any) => item.appointment_id === 1002);
  assert.ok(waiting.allowed_actions.includes('call'));
  assert.ok(!waiting.allowed_actions.includes('start'));
  assert.equal(
    (
      await request('/appointments/1002/actions', 'POST', {
        action: 'start',
        expected_version: 0,
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request('/appointments/1002/actions', 'POST', {
        action: 'call',
        expected_version: 0,
      })
    ).status,
    200,
  );
});

test('el fixture aplica la hora minima a citas nuevas, cancelaciones y reprogramaciones y conserva notas antes del inicio', async (context) => {
  let current = Date.parse('2026-11-26T07:00:00-05:00');
  const server = createLayoutServer({ now: () => current, log: () => {} });
  context.after(() => server.close());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const request = async (
    path: string,
    role = 'patient',
    method = 'GET',
    body?: unknown,
  ) => {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        Authorization: `Bearer layout-${role}`,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };
  const available = await request(
    '/appointments/availability/day?clinic_id=1&doctor_id=85&date=2026-11-26',
  );
  assert.equal(available.status, 200);
  assert.equal(available.body.server_now, new Date(current).toISOString());
  assert.equal(available.body.minimum_advance_minutes, 60);
  assert.equal(available.body.time_zone, 'America/Bogota');
  assert.equal(available.body.slots[0].status, 'available');
  current += 1;
  const aged = await request(
    '/appointments/availability/day?clinic_id=1&doctor_id=85&date=2026-11-26',
  );
  assert.equal(aged.body.slots[0].status, 'too_soon');
  const create = (start: string, end: string) =>
    request('/appointments/scheduleAppointment', 'patient', 'POST', {
      clinic_id: 1,
      doctor_id: 85,
      start_date_time: start,
      end_date_time: end,
    });
  assert.equal(
    (await create('2026-11-26T08:00:00-05:00', '2026-11-26T08:30:00-05:00'))
      .status,
    400,
  );
  assert.equal(
    (await create('2026-11-26T08:15:00-05:00', '2026-11-26T08:45:00-05:00'))
      .status,
    400,
  );
  assert.equal(
    (await create('2026-11-26T12:00:00-05:00', '2026-11-26T12:30:00-05:00'))
      .status,
    400,
  );
  assert.equal(
    (await create('2026-11-26T08:30:00-05:00', '2026-11-26T09:00:00-05:00'))
      .status,
    201,
  );
  const detail = await request('/appointments/1000');
  assert.equal(detail.body.can_reschedule, false);
  assert.equal(detail.body.can_edit_notes, true);
  assert.ok(!detail.body.allowed_actions.includes('cancel'));
  for (const role of ['patient', 'admin', 'employee']) {
    assert.equal(
      (
        await request('/appointments/1000/actions', role, 'POST', {
          action: 'cancel',
          expected_version: 0,
        })
      ).status,
      400,
    );
  }
  assert.equal(
    (await request('/appointments/1000', 'patient', 'DELETE')).status,
    400,
  );
  assert.equal(
    (
      await request('/appointments/1000', 'patient', 'PUT', {
        start_date_time: '2026-11-27T09:00:00-05:00',
        end_date_time: '2026-11-27T09:30:00-05:00',
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request('/appointments/1000', 'patient', 'PUT', {
        appointment_description: 'Notas aun editables',
      })
    ).status,
    200,
  );
  current = Date.parse('2026-11-26T08:00:00-05:00');
  assert.equal(
    (
      await request('/appointments/1000', 'patient', 'PUT', {
        appointment_description: 'Despues del inicio',
      })
    ).status,
    400,
  );
});

test('la disponibilidad del fixture incluye otras clinicas y ausencias sin publicar datos personales y excluye solo la cita propia', async (context) => {
  const current = Date.parse('2026-11-26T07:00:00-05:00');
  const server = createLayoutServer({ now: () => current, log: () => {} });
  context.after(() => server.close());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const request = async (
    path: string,
    method = 'GET',
    body?: unknown,
    role = 'patient',
  ) => {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        Authorization: `Bearer layout-${role}`,
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };
  assert.equal(
    (
      await request('/__qa/appointment', 'POST', {
        appointment_id: 1001,
        clinic_id: 2,
      })
    ).status,
    200,
  );
  assert.equal(
    (
      await request('/__qa/absence', 'POST', {
        clinic_id: 1,
        doctor_id: 84,
        start_date_time: '2026-11-26T14:00:00-05:00',
        end_date_time: '2026-11-26T15:00:00-05:00',
      })
    ).status,
    201,
  );
  const publicPath =
    '/appointments/availability/day?clinic_id=1&doctor_id=84&date=2026-11-26';
  const result = await request(publicPath);
  assert.equal(result.status, 200);
  assert.equal(result.body.slots[1].status, 'booked');
  assert.equal(
    result.body.slots.find(
      (slot: any) => slot.start_date_time === '2026-11-26T19:00:00.000Z',
    ).status,
    'booked',
  );
  for (const slot of result.body.slots) {
    assert.deepEqual(Object.keys(slot).sort(), [
      'end_date_time',
      'start_date_time',
      'status',
    ]);
  }
  const own = await request('/appointments/1000/availability?date=2026-11-26');
  assert.equal(own.status, 200);
  assert.equal(own.body.slots[0].status, 'current');
  assert.equal(
    (
      await request(
        '/appointments/1000/availability?date=2026-11-26',
        'GET',
        undefined,
        'doctor',
      )
    ).status,
    404,
  );
  assert.equal(
    (await request(`${publicPath}&exclude_appointment_id=1001`)).status,
    400,
  );
  assert.equal(
    (
      await request(
        '/appointments/availability/day?clinic_id=1&doctor_id=84&date=2026-02-30',
      )
    ).status,
    400,
  );
  const weekend = await request(
    '/appointments/availability/day?clinic_id=1&doctor_id=84&date=2026-11-28',
  );
  assert.equal(weekend.body.unavailable_reason, 'weekend');
  assert.deepEqual(weekend.body.slots, []);
  await request('/__qa/clinic', 'POST', { clinic_id: 1, is_open: false });
  const closed = await request(publicPath);
  assert.equal(closed.body.unavailable_reason, 'closed');
  assert.deepEqual(closed.body.slots, []);
  await request('/__qa/clinic', 'POST', {
    clinic_id: 1,
    is_open: true,
    clinic_average_appointment_time: '0',
  });
  assert.equal((await request(publicPath)).status, 400);
});
