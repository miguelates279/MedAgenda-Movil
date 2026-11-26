import assert from 'node:assert/strict';
import test from 'node:test';
import apiClient from '../src/api/client';
import adminApi from '../src/api/admin';
import clinicsApi from '../src/api/clinics';
import type { ClinicManagement, ClinicMember } from '../src/api/types';
import {
  canManageClinicMember,
  clinicChanges,
  clinicEditorValues,
  clinicPayload,
  newClinicValues,
} from '../src/screens/clinics/clinicManagement';

const clinic = (): ClinicManagement => ({
  clinic_id: 12,
  clinic_name: 'Centro de salud',
  clinic_address: 'Calle 10',
  clinic_phone_number: '+573001234567',
  clinic_description: '',
  clinic_city_id: 4,
  city_id: 4,
  city_name: 'Manizales',
  state_id: 3,
  state_name: 'Caldas',
  country_id: 1,
  country_name: 'Colombia',
  is_open: true,
  role_within_clinic: 'Owner',
  clinic_opening_time: '08:00',
  clinic_close_time: '18:00',
  clinic_average_appointment_time: 30,
  clinic_break_time: '12:00',
  clinic_break_duration: 60,
  specialty_ids: [2, 3],
});
const member = (
  role: ClinicMember['role_within_clinic'],
  id = 9,
): ClinicMember => ({
  user_id: id,
  clinic_id: 12,
  first_name: 'Ana',
  first_last_name: 'Pérez',
  email: 'ana@example.com',
  role_within_clinic: role,
  is_member: role !== null,
  isDoctor: role === 'Doctor',
  isAdmin: role === 'Admin',
  specialties: [],
});

test('aplica permisos por clínica sin permitir modificar propiedad, autoasignación ni pares de administrador', () => {
  assert.equal(canManageClinicMember('Owner', 1, member('Admin')), true);
  assert.equal(canManageClinicMember('Owner', 1, member('Owner')), false);
  assert.equal(canManageClinicMember('Owner', 1, member('Doctor', 1)), false);
  assert.equal(canManageClinicMember('Admin', 1, member('Admin')), false);
  assert.equal(canManageClinicMember('Admin', 1, member('Doctor')), true);
  assert.equal(canManageClinicMember('Admin', 1, member('Employee')), true);
  assert.equal(canManageClinicMember('Admin', 1, member(null)), true);
});

test('convierte el formulario sin descanso a una configuración explícita y conserva los campos verticales independientes', () => {
  const values = clinicEditorValues(clinic());
  values.break_enabled = false;
  values.clinic_description = ' Atención general ';
  const payload = clinicPayload(values);
  assert.equal(payload.clinic_break_time, null);
  assert.equal(payload.clinic_break_duration, 0);
  assert.equal(payload.clinic_average_appointment_time, 30);
  assert.equal(payload.clinic_description, 'Atención general');
  assert.equal(payload.clinic_city_id, 4);
  assert.equal('clinic_owner' in payload, false);
  assert.equal('country_id' in payload, false);
});

test('rechaza horario invertido, horas inválidas, duración no entera y descanso fuera de atención antes de enviar', () => {
  for (const change of [
    { clinic_opening_time: '19:00' },
    { clinic_opening_time: '8:60' },
    { clinic_close_time: '24:01' },
    { clinic_average_appointment_time: '0' },
    { clinic_average_appointment_time: '1.5' },
    { clinic_average_appointment_time: '10000' },
    { clinic_break_time: '07:00' },
    { clinic_break_duration: '400' },
    { clinic_city_id: null },
  ])
    assert.throws(() =>
      clinicPayload({ ...clinicEditorValues(clinic()), ...change }),
    );
  const midnight = clinicPayload({
    ...clinicEditorValues(clinic()),
    clinic_opening_time: '00:00',
    clinic_close_time: '24:00',
    clinic_average_appointment_time: '1000',
    break_enabled: false,
  });
  assert.equal(midnight.clinic_average_appointment_time, 1000);
});

test('guarda únicamente cambios reales y no sobrescribe los demás campos al editar una clínica', () => {
  const original = clinic();
  const values = clinicEditorValues(original);
  values.clinic_name = 'Nombre nuevo';
  values.specialty_ids = [3, 2];
  assert.deepEqual(clinicChanges(values, original), {
    clinic_name: 'Nombre nuevo',
  });
  assert.deepEqual(clinicChanges(clinicEditorValues(original), original), {});
});

test('permite completar una clínica antigua sin horario sin adivinar su configuración original', () => {
  const original = {
    ...clinic(),
    clinic_opening_time: null,
    clinic_close_time: null,
    clinic_average_appointment_time: null,
    clinic_break_time: null,
    clinic_break_duration: null,
    specialty_ids: [],
    is_open: false,
  };
  const values = clinicEditorValues(original);
  assert.equal(values.clinic_opening_time, '');
  assert.equal(values.clinic_average_appointment_time, '');
  assert.throws(() => clinicPayload(values));
  const changes = clinicChanges(
    {
      ...values,
      clinic_opening_time: '08:00',
      clinic_close_time: '17:00',
      clinic_average_appointment_time: '30',
    },
    original,
  );
  assert.equal(changes.clinic_opening_time, '08:00');
  assert.equal(changes.clinic_average_appointment_time, 30);
  assert.equal('is_open' in changes, false);
});

test('nuevas clínicas comienzan cerradas con configuración visible y sin ciudad preseleccionada', () => {
  const values = newClinicValues();
  assert.equal(values.is_open, false);
  assert.equal(values.clinic_city_id, null);
  assert.equal(values.break_enabled, false);
  assert.equal(values.clinic_average_appointment_time, '30');
});

test('cada operación administrativa lleva la clínica explícita y no publica datos sensibles adicionales', async () => {
  const originalFetch = globalThis.fetch;
  const calls: { path: string; options: RequestInit }[] = [];
  apiClient.setSession('clinic-admin-session', 311);
  globalThis.fetch = async (input, options) => {
    calls.push({ path: String(input), options: options ?? {} });
    return new Response(JSON.stringify({ clinic_id: 12 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
  try {
    await clinicsApi.getManagement(12);
    await clinicsApi.updateClinic(12, { is_open: false });
    await adminApi.getClinicMembers(12);
    await adminApi.findUser(12, ' ana+clinic@example.com ');
    await adminApi.saveMember({
      clinic_id: 12,
      email: 'ana@example.com',
      isDoctor: true,
      isAdmin: false,
      specialty_id: 3,
    });
    await adminApi.removeMember(12, 9);
    await clinicsApi.updateOwnerProvider(12, {
      isDoctor: true,
      specialty_id: 3,
    });
    assert.deepEqual(
      calls.map(
        (call) => new URL(call.path).pathname + new URL(call.path).search,
      ),
      [
        '/clinics/12/management',
        '/clinics/12/management',
        '/admin/clinic-users?clinic_id=12',
        '/admin/search-user?clinic_id=12&email=ana%2Bclinic%40example.com',
        '/admin/update-user-role',
        '/admin/clinics/12/members/9',
        '/clinics/12/owner-provider',
      ],
    );
    assert.deepEqual(JSON.parse(String(calls[1].options.body)), {
      is_open: false,
    });
    assert.equal(JSON.parse(String(calls[4].options.body)).clinic_id, 12);
    assert.deepEqual(JSON.parse(String(calls[6].options.body)), {
      isDoctor: true,
      specialty_id: 3,
    });
    assert.ok(
      calls.every(
        (call) =>
          (call.options.headers as Record<string, string>).Authorization ===
          'Bearer clinic-admin-session',
      ),
    );
    await clinicsApi.createClinic(
      clinicPayload({
        ...newClinicValues(),
        clinic_city_id: 4,
        clinic_name: 'Nueva',
        clinic_address: 'Calle 1',
        clinic_phone_number: '+573001234567',
      }),
    );
    const created = JSON.parse(String(calls.at(-1)?.options.body));
    assert.equal(created.is_open, false);
    assert.equal(created.clinic_average_appointment_time, 30);
    assert.equal('clinic_owner' in created, false);
  } finally {
    globalThis.fetch = originalFetch;
    apiClient.setSession(null, 312);
  }
});
