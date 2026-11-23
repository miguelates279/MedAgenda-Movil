/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { DoctorAppointmentView } from '../src/api/types';
import {
  buildReminderPlan,
  readReminderData,
  REMINDER_KIND,
} from '../src/screens/appointments/reminders/reminderPlan';
import type {
  AppointmentReminder,
  StoredReminder,
} from '../src/screens/appointments/reminders/reminderPlan';
import { AppointmentReminderService } from '../src/screens/appointments/reminders/reminderService';
import type { ReminderDevice } from '../src/screens/appointments/reminders/reminderService';
import {
  reminderNavigationAction,
  reminderResponseKey,
} from '../src/screens/appointments/reminders/reminderNavigation';

const NOW = Date.parse('2026-11-20T09:00:00-05:00');
const HOUR = 3_600_000;
const appointment = (
  id = 7,
  startsAt = NOW + 48 * HOUR,
): DoctorAppointmentView => ({
  appointment_id: id,
  start_date_time: new Date(startsAt).toISOString(),
  end_date_time: new Date(startsAt + HOUR / 2).toISOString(),
  first_name: 'Ana',
  first_last_name: 'Ruiz',
  second_last_name: '',
  clinic_name: 'Clínica Centro',
});

class Device implements ReminderDevice {
  pending = new Map<string, StoredReminder>();
  visible = new Map<string, StoredReminder>();
  scheduledCalls = 0;
  permission = true;
  deliveryMode: 'exact' | 'inexact' = 'exact';
  requested = 0;
  fail = false;
  beforeSchedule?: () => Promise<void>;
  async hasPermission() {
    return this.permission;
  }
  async precision() {
    return this.deliveryMode;
  }
  async requestPermission() {
    this.requested++;
    return this.permission;
  }
  async scheduled() {
    if (this.fail) throw new Error('OS unavailable');
    return [...this.pending.values()];
  }
  async presented() {
    return [...this.visible.values()];
  }
  async schedule(reminder: AppointmentReminder) {
    await this.beforeSchedule?.();
    this.scheduledCalls++;
    this.pending.set(reminder.identifier, reminder);
  }
  async cancel(identifier: string) {
    this.pending.delete(identifier);
  }
  async dismiss(identifier: string) {
    this.visible.delete(identifier);
  }
}

function setup() {
  const device = new Device();
  const state = {
    appointments: [appointment()],
    now: NOW,
    errors: 0,
    load: null as null | (() => Promise<DoctorAppointmentView[]>),
  };
  const service = new AppointmentReminderService(
    device,
    () => (state.load ? state.load() : Promise.resolve(state.appointments)),
    () => true,
    () => state.now,
    () => {
      state.errors++;
    },
  );
  return { device, state, service };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test('programa 24 h y 1 h exactas usando el instante del servidor y texto útil en hora de Colombia', () => {
  const item = {
    ...appointment(),
    start_date_time: '2026-11-22T09:00:00-05:00',
  };
  const plan = buildReminderPlan([item], 42, NOW);
  assert.deepEqual(
    plan.map((r) => r.data.firesAt),
    [Date.parse('2026-11-21T14:00:00Z'), Date.parse('2026-11-22T13:00:00Z')],
  );
  assert.match(plan[0].body, /Ana Ruiz.*Clínica Centro/);
  assert.match(plan[0].body, /hora de Colombia/);
  assert.equal(plan[0].data.appointmentId, 7);
  assert.equal(plan[0].data.patientId, 42);
});

test('no dispara avisos retroactivos para citas próximas, vencidas o inválidas', () => {
  assert.deepEqual(
    buildReminderPlan(
      [appointment(1, NOW + 30 * 60_000), appointment(2, NOW - HOUR)],
      42,
      NOW,
    ),
    [],
  );
  assert.deepEqual(
    buildReminderPlan(
      [{ ...appointment(), start_date_time: 'invalid' }],
      42,
      NOW,
    ),
    [],
  );
  assert.deepEqual(buildReminderPlan([appointment(-1)], 42, NOW), []);
  assert.deepEqual(buildReminderPlan([appointment()], -1, NOW), []);
  assert.deepEqual(
    buildReminderPlan([appointment(1, NOW + 2 * HOUR)], 42, NOW).map(
      (r) => r.data.hoursBefore,
    ),
    [1],
  );
});

test('evita duplicados y conserva los 64 avisos futuros más cercanos', () => {
  const appointments = Array.from({ length: 50 }, (_, i) =>
    appointment(i + 1, NOW + (48 + i) * HOUR),
  );
  const plan = buildReminderPlan([...appointments, appointments[0]], 42, NOW);
  assert.equal(plan.length, 64);
  assert.equal(new Set(plan.map((r) => r.identifier)).size, 64);
  assert.ok(
    plan.every((r, i) => i === 0 || r.data.firesAt >= plan[i - 1].data.firesAt),
  );
  assert.equal(
    buildReminderPlan(appointments, 42, NOW, Number.POSITIVE_INFINITY).length,
    100,
  );
});

test('sincronizar varias veces y reiniciar el proceso no duplica los avisos persistidos por el SO', async () => {
  const { service, device, state } = setup();
  await service.setSession({ patientId: 42, sessionId: 1 });
  await service.refresh();
  await service.refresh();
  assert.equal(device.scheduledCalls, 2);
  const restarted = new AppointmentReminderService(
    device,
    async () => state.appointments,
    () => true,
    () => NOW,
  );
  await restarted.setSession(null);
  assert.equal(
    device.pending.size,
    2,
    'el arranque sin sesión en memoria conserva los avisos',
  );
  await restarted.setSession({ patientId: 42, sessionId: 1 });
  await restarted.refresh();
  assert.equal(device.scheduledCalls, 2);
});

test('reprogramar sustituye los dos horarios y retira avisos ya mostrados de la hora anterior', async () => {
  const { service, device, state } = setup();
  await service.setSession({ patientId: 42, sessionId: 1 });
  await service.refresh();
  const previous = [...device.pending.values()][0];
  device.visible.set(previous.identifier, previous);
  state.appointments = [appointment(7, NOW + 72 * HOUR)];
  await service.refresh();
  assert.equal(device.pending.size, 2);
  assert.equal(device.visible.size, 0);
  assert.ok(
    [...device.pending.values()].every(
      (r) => readReminderData(r.data)?.startsAt === NOW + 72 * HOUR,
    ),
  );
});

test('cancelar elimina únicamente los avisos programados y visibles de esa cita', async () => {
  const { service, device, state } = setup();
  state.appointments.push(appointment(8));
  await service.setSession({ patientId: 42, sessionId: 1 });
  await service.refresh();
  const cancelled = [...device.pending.values()].find(
    (r) => readReminderData(r.data)?.appointmentId === 7,
  )!;
  device.visible.set(cancelled.identifier, cancelled);
  device.pending.set('another-feature', {
    identifier: 'another-feature',
    data: {},
  });
  await service.cancelAppointment(7);
  assert.equal(device.visible.size, 0);
  assert.equal(device.pending.size, 3);
  assert.ok(device.pending.has('another-feature'));
  assert.ok(
    [...device.pending.values()].every(
      (r) => readReminderData(r.data)?.appointmentId !== 7,
    ),
  );
});

test('una cita eliminada del servidor o ya cumplida retira sus avisos al reconciliar', async () => {
  const { service, device, state } = setup();
  await service.setSession({ patientId: 42, sessionId: 1 });
  await service.refresh();
  state.appointments = [];
  await service.refresh();
  assert.equal(device.pending.size, 0);
  state.appointments = [appointment()];
  await service.refresh();
  state.now = NOW + 49 * HOUR;
  await service.refresh();
  assert.equal(device.pending.size, 0);
});

test('autorizar alarmas exactas reemplaza avisos anteriores y revocar permisos los retira', async () => {
  const { service, device } = setup();
  for (const reminder of buildReminderPlan(
    [appointment()],
    42,
    NOW,
    64,
    'inexact',
  )) {
    device.pending.set(reminder.identifier, reminder);
  }
  await service.setSession({ patientId: 42, sessionId: 1 });
  await service.refresh();
  assert.equal(device.scheduledCalls, 2);
  assert.ok(
    [...device.pending.values()].every(
      (r) => readReminderData(r.data)?.deliveryMode === 'exact',
    ),
  );
  await service.refresh();
  assert.equal(device.scheduledCalls, 2);
  device.permission = false;
  await service.refresh();
  assert.equal(device.pending.size, 0);
});

test('una caída de red conserva los avisos válidos y se recupera al reintentar', async () => {
  const { service, device, state } = setup();
  await service.setSession({ patientId: 42, sessionId: 1 });
  await service.refresh();
  state.load = async () => {
    throw new Error('offline');
  };
  await assert.rejects(service.refresh(), /offline/);
  assert.equal(device.pending.size, 2);
  state.load = null;
  state.appointments = [];
  await service.refresh();
  assert.equal(device.pending.size, 0);
});

test('negar permiso o fallar el servicio nativo no impide consultar ni agendar citas', async () => {
  const { service, device, state } = setup();
  await service.setSession({ patientId: 42, sessionId: 1 });
  device.permission = false;
  assert.equal((await service.refresh(true)).length, 1);
  assert.equal(device.requested, 1);
  assert.equal(device.pending.size, 0);
  device.permission = true;
  device.fail = true;
  assert.equal((await service.refresh()).length, 1);
  assert.equal(state.errors, 1);
});

test('una respuesta antigua no vuelve a programar una cita después de cancelarla', async () => {
  const { service, device, state } = setup();
  await service.setSession({ patientId: 42, sessionId: 1 });
  await service.refresh();
  const old = deferred<DoctorAppointmentView[]>();
  state.load = () => old.promise;
  const staleRefresh = service.refresh();
  await service.cancelAppointment(7);
  old.resolve([appointment()]);
  await staleRefresh;
  assert.equal(device.pending.size, 0);
});

test('cerrar sesión durante una programación en vuelo también retira el aviso recién creado', async () => {
  const { service, device } = setup();
  await service.setSession({ patientId: 42, sessionId: 1 });
  const started = deferred<void>();
  const finish = deferred<void>();
  device.beforeSchedule = async () => {
    started.resolve();
    await finish.promise;
  };
  const refresh = service.refresh();
  await started.promise;
  const logout = service.setSession(null, true);
  finish.resolve();
  await Promise.all([refresh, logout]);
  assert.equal(device.pending.size, 0);
});

test('cambiar de cuenta cancela los avisos anteriores y descarta su respuesta de red tardía', async () => {
  const { service, device, state } = setup();
  await service.setSession({ patientId: 42, sessionId: 1 });
  await service.refresh();
  const old = deferred<DoctorAppointmentView[]>();
  state.load = () => old.promise;
  const refresh = service.refresh();
  await service.setSession({ patientId: 99, sessionId: 2 });
  old.resolve([appointment()]);
  await refresh;
  assert.equal(device.pending.size, 0);
  state.load = null;
  await service.refresh();
  assert.ok(
    [...device.pending.values()].every(
      (r) => readReminderData(r.data)?.patientId === 99,
    ),
  );
});

test('el toque desde la app cerrada espera login y capacidades y luego abre la cita en modo paciente', () => {
  const data = buildReminderPlan([appointment()], 42, NOW)[0].data;
  const state = {
    ready: true,
    authenticated: false,
    loading: false,
    resolvingModes: false,
    patientId: undefined as number | undefined,
    activeMode: null as string | null,
    availableModes: ['patient', 'doctor'],
  };
  assert.equal(
    reminderNavigationAction(data, { ...state, ready: false }),
    'wait',
  );
  assert.equal(reminderNavigationAction(data, state), 'login');
  assert.equal(
    reminderNavigationAction(data, {
      ...state,
      authenticated: true,
      resolvingModes: true,
    }),
    'wait',
  );
  assert.equal(
    reminderNavigationAction(data, {
      ...state,
      authenticated: true,
      patientId: 42,
      activeMode: 'doctor',
    }),
    'patient-mode',
  );
  assert.equal(
    reminderNavigationAction(data, {
      ...state,
      authenticated: true,
      patientId: 42,
      activeMode: 'patient',
    }),
    'open',
  );
  assert.equal(
    reminderNavigationAction(data, {
      ...state,
      authenticated: true,
      patientId: 99,
      activeMode: 'patient',
    }),
    'wrong-account',
  );
});

test('rechaza datos ajenos/malformados y distingue un nuevo aviso de una cita reprogramada', () => {
  const old = buildReminderPlan([appointment()], 42, NOW)[0];
  const changed = buildReminderPlan(
    [appointment(7, NOW + 72 * HOUR)],
    42,
    NOW,
  )[0];
  assert.equal(readReminderData({ ...old.data, kind: 'other-app' }), null);
  assert.equal(readReminderData({ ...old.data, patientId: '42' }), null);
  assert.equal(readReminderData({ ...old.data, firesAt: 123 }), null);
  assert.equal(
    readReminderData({ ...old.data, deliveryMode: 'invalid' }),
    null,
  );
  assert.equal(
    readReminderData({ ...old.data, kind: REMINDER_KIND, appointmentId: -1 }),
    null,
  );
  assert.notEqual(
    reminderResponseKey(old.identifier, old.data),
    reminderResponseKey(changed.identifier, changed.data),
  );
});
