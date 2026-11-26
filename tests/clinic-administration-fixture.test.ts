import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { once } from 'node:events';
import { test } from 'node:test';
import type { Server } from 'node:http';

const require = createRequire(import.meta.url);
const { createLayoutServer } = require('./fixtures/layout-server.cjs') as {
  createLayoutServer(options: { now: () => number; log: () => void }): Server;
};

async function fixture(context: { after(callback: () => void): void }) {
  const now = Date.parse('2030-11-25T07:00:00-05:00');
  const server = createLayoutServer({ now: () => now, log: () => {} });
  context.after(() => server.close());
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  return async (
    path: string,
    role = 'admin',
    method = 'GET',
    body?: unknown,
  ) => {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      method,
      headers: {
        ...(role ? { Authorization: `Bearer layout-${role}` } : {}),
        'Content-Type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return { status: response.status, body: await response.json() };
  };
}

test('el fixture administra la clinica seleccionada y conserva roles y especialidades de otras clinicas', async (context) => {
  const call = await fixture(context);
  assert.equal((await call('/clinics/1/management', '')).status, 401);
  assert.equal((await call('/clinics/1/management', 'patient')).status, 403);
  assert.equal(
    (await call('/clinics/1/management')).body.role_within_clinic,
    'Owner',
  );
  assert.equal(
    (await call('/clinics/2/management')).body.role_within_clinic,
    'Admin',
  );
  assert.equal((await call('/admin/clinic-users')).status, 400);
  const candidate = await call(
    '/admin/search-user?clinic_id=2&email=patient@layout.test',
  );
  assert.equal(candidate.body.is_member, false);
  assert.equal(
    (
      await call('/admin/update-user-role', 'admin', 'PUT', {
        clinic_id: 2,
        email: 'patient@layout.test',
        isAdmin: false,
        isDoctor: true,
        specialty_id: 1,
      })
    ).status,
    200,
  );
  const second = (await call('/admin/clinic-users?clinic_id=2')).body;
  assert.equal(
    second.find((item: any) => item.user_id === 42).role_within_clinic,
    'Doctor',
  );
  assert.equal(
    (await call('/admin/clinic-users?clinic_id=1')).body.some(
      (item: any) => item.user_id === 42,
    ),
    false,
  );
  assert.equal(
    (
      await call('/admin/update-user-role', 'admin', 'PUT', {
        clinic_id: 2,
        email: 'patient@layout.test',
        isAdmin: true,
        isDoctor: false,
      })
    ).status,
    403,
  );
  assert.equal(
    (await call('/admin/clinics/2/members/9000', 'admin', 'DELETE')).status,
    403,
  );
  assert.equal(
    (await call('/admin/clinics/1/members/126', 'admin', 'DELETE')).status,
    403,
  );
  assert.equal(
    (
      await call('/admin/update-user-role', 'admin', 'PUT', {
        clinic_id: 1,
        email: 'doctor85@layout.test',
        isAdmin: false,
        isDoctor: true,
        specialty_id: 25,
      })
    ).status,
    200,
  );
  const firstDoctors = (await call('/clinics/getClinicDoctors?clinic_id=1'))
    .body;
  const secondDoctors = (await call('/clinics/getClinicDoctors?clinic_id=2'))
    .body;
  assert.deepEqual(
    firstDoctors
      .find((item: any) => item.doctor_id === 85)
      .specialties.map((item: any) => item.specialty_id),
    [25],
  );
  assert.deepEqual(
    secondDoctors
      .find((item: any) => item.doctor_id === 85)
      .specialties.map((item: any) => item.specialty_id),
    [2],
  );
  for (const forbidden of ['password_hash', 'legal_id', 'birth_date'])
    assert.equal(JSON.stringify(firstDoctors).includes(forbidden), false);
  assert.equal(
    (await call('/admin/clinics/1/members/84', 'admin', 'DELETE')).status,
    409,
  );
  assert.equal(
    (await call('/admin/clinics/1/members/85', 'admin', 'DELETE')).status,
    200,
  );
  assert.equal(
    (await call('/clinics/getClinicDoctors?clinic_id=1')).body.some(
      (item: any) => item.doctor_id === 85,
    ),
    false,
  );
  assert.equal(
    (await call('/clinics/getClinicDoctors?clinic_id=2')).body.some(
      (item: any) => item.doctor_id === 85,
    ),
    true,
  );
});

test('el fixture preserva horas existentes al editar la duracion y bloquea borrado con historial', async (context) => {
  const call = await fixture(context);
  const before = (await call('/clinics/1/management')).body;
  assert.equal(
    (await call('/clinics/1/management', 'admin', 'PUT', {})).status,
    400,
  );
  assert.equal(
    (
      await call('/clinics/1/management', 'admin', 'PUT', {
        clinic_description: 'No debe guardarse',
        clinic_city_id: 9999,
      })
    ).status,
    400,
  );
  assert.deepEqual((await call('/clinics/1/management')).body, before);
  assert.equal(
    (
      await call('/clinics/1/management', 'admin', 'PUT', {
        specialty_ids: [30],
      })
    ).status,
    409,
  );
  const scheduled = await call(
    '/appointments/scheduleAppointment',
    'patient',
    'POST',
    {
      clinic_id: 1,
      doctor_id: 84,
      start_date_time: '2030-11-26T17:00:00-05:00',
      end_date_time: '2030-11-26T17:30:00-05:00',
      appointment_description: 'Cita con duracion conservada',
    },
  );
  assert.equal(scheduled.status, 201);
  assert.equal(
    (
      await call('/clinics/1/management', 'admin', 'PUT', {
        clinic_average_appointment_time: 45,
      })
    ).status,
    200,
  );
  const retained = await call(
    `/appointments/${scheduled.body.appointment_id}`,
    'patient',
  );
  assert.equal(retained.body.end_date_time, '2030-11-26T17:30:00-05:00');
  const privateSlots = await call(
    `/appointments/${scheduled.body.appointment_id}/availability?date=2030-11-26`,
    'patient',
  );
  assert.equal(
    privateSlots.body.slots.find(
      (item: any) => item.start_date_time === '2030-11-26T22:00:00.000Z',
    ).status,
    'current',
  );
  assert.equal(
    (
      await call(
        `/appointments/${scheduled.body.appointment_id}`,
        'patient',
        'PUT',
        {
          start_date_time: '2030-11-26T17:00:00-05:00',
          end_date_time: '2030-11-26T17:45:00-05:00',
          expected_version: 0,
        },
      )
    ).status,
    400,
  );
  assert.deepEqual(
    (await call(`/appointments/${scheduled.body.appointment_id}`, 'patient'))
      .body,
    retained.body,
  );
  const availability = await call(
    '/appointments/availability/day?clinic_id=1&doctor_id=84&date=2030-11-26',
    '',
  );
  assert.equal(availability.body.duration_minutes, 45);
  assert.equal(
    availability.body.slots.find(
      (item: any) => item.start_date_time === '2030-11-26T22:00:00.000Z',
    ).status,
    'booked',
  );
  assert.equal(
    (await call('/clinics/1/management', 'admin', 'PUT', { is_open: false }))
      .status,
    200,
  );
  assert.equal(
    (
      await call(
        '/appointments/availability/day?clinic_id=1&doctor_id=84&date=2030-11-26',
        '',
      )
    ).body.unavailable_reason,
    'closed',
  );
  assert.equal((await call('/clinics/1', 'admin', 'DELETE')).status, 409);
  assert.equal(
    (await call(`/appointments/${scheduled.body.appointment_id}`, 'patient'))
      .body.appointment_status,
    'scheduled',
  );
});

test('el fixture elimina un centro nuevo solo por su propietario y retira el acceso de recepcion', async (context) => {
  const call = await fixture(context);
  const created = await call('/clinics/createClinic', 'admin', 'POST', {
    clinic_name: 'Clinica nueva',
    clinic_address: 'Calle 5',
    clinic_city_id: 1,
    clinic_phone_number: '+573001112233',
  });
  assert.equal(created.status, 201);
  const id = created.body.clinic_id;
  assert.equal((await call(`/clinics/${id}/management`)).body.is_open, false);
  assert.equal(
    (
      await call(`/clinics/${id}/management`, 'admin', 'PUT', {
        clinic_description: 'Descripcion sin abrir reservas',
      })
    ).status,
    200,
  );
  assert.equal((await call(`/clinics/${id}`, 'patient', 'DELETE')).status, 403);
  assert.equal((await call(`/clinics/${id}`, 'admin', 'DELETE')).status, 200);
  assert.equal((await call(`/clinics/${id}/management`)).status, 404);
  assert.equal(
    (await call('/appointments/dispatch-clinics', 'employee')).body.some(
      (item: any) => item.clinic_id === 1,
    ),
    true,
  );
  assert.equal(
    (await call('/admin/clinics/1/members/168', 'admin', 'DELETE')).status,
    200,
  );
  assert.equal(
    (await call('/appointments/dispatch-clinics', 'employee')).body.some(
      (item: any) => item.clinic_id === 1,
    ),
    false,
  );
});

test('el fixture conserva la propiedad al activar un perfil medico del propietario y exige resolver sus citas para retirarlo', async (context) => {
  const call = await fixture(context);
  const created = await call('/clinics/createClinic', 'patient', 'POST', {
    clinic_name: 'Consultorio propio',
    clinic_address: 'Calle 9',
    clinic_city_id: 1,
    clinic_phone_number: '+573001112233',
    is_open: true,
    clinic_opening_time: '08:00',
    clinic_close_time: '18:00',
    clinic_average_appointment_time: 30,
    clinic_break_time: null,
    clinic_break_duration: 0,
    specialty_ids: [1],
  });
  const id = created.body.clinic_id;
  assert.equal(created.status, 201);
  const path = `/clinics/${id}/owner-provider`;
  assert.equal(
    (await call(path, 'admin', 'PUT', { isDoctor: true, specialty_id: 1 }))
      .status,
    403,
  );
  assert.equal(
    (await call(path, 'patient', 'PUT', { isDoctor: true, specialty_id: 1 }))
      .status,
    200,
  );
  assert.equal(
    (await call(`/clinics/${id}/management`, 'patient')).body
      .role_within_clinic,
    'Owner',
  );
  assert.equal(
    (await call('/doctors/isUserDoctorAnywhere', 'patient')).body,
    true,
  );
  const publicDoctors = (
    await call(`/clinics/getClinicDoctors?clinic_id=${id}`)
  ).body;
  assert.equal(
    publicDoctors.some((item: any) => item.doctor_id === 42),
    true,
  );
  const booked = await call(
    '/appointments/scheduleAppointment',
    'patient',
    'POST',
    {
      clinic_id: id,
      doctor_id: 42,
      start_date_time: '2030-11-26T10:00:00-05:00',
      end_date_time: '2030-11-26T10:30:00-05:00',
      appointment_description: 'Consulta con propietario medico',
    },
  );
  assert.equal(booked.status, 201);
  assert.equal(
    (await call(path, 'patient', 'PUT', { isDoctor: false })).status,
    409,
  );
  assert.equal(
    (
      await call('/admin/update-user-role', 'patient', 'PUT', {
        clinic_id: id,
        email: 'patient@layout.test',
        isDoctor: false,
        isAdmin: false,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        `/appointments/${booked.body.appointment_id}/actions`,
        'patient',
        'POST',
        { action: 'cancel', expected_version: 0 },
      )
    ).status,
    200,
  );
  assert.equal(
    (await call(path, 'patient', 'PUT', { isDoctor: false })).status,
    200,
  );
  assert.equal(
    (await call('/doctors/isUserDoctorAnywhere', 'patient')).body,
    false,
  );
  assert.equal(
    (await call(`/clinics/${id}/management`, 'patient')).body.clinic_owner,
    42,
  );
  assert.equal(
    (
      await call(
        `/appointments/availability/day?clinic_id=${id}&doctor_id=42&date=2030-11-26`,
        '',
      )
    ).status,
    400,
  );
});
