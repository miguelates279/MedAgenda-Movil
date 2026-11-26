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
  const newStart = '2026-11-30T08:00:00-05:00';
  const rescheduled = await request('/appointments/1', 'PUT', {
    start_date_time: newStart,
    end_date_time: '2026-11-30T08:30:00-05:00',
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
