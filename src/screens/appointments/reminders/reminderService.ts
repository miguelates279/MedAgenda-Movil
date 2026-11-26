import type { DoctorAppointmentView } from '../../../api/types';
import {
  buildReminderPlan,
  needsAppointmentReminder,
  readReminderData,
  REMINDER_PREFIX,
} from './reminderPlan';
import type { AppointmentReminder, StoredReminder } from './reminderPlan';

export interface ReminderSession {
  patientId: number;
  sessionId: number;
}

export interface ReminderDevice {
  maximumPending?: number;
  precision?(): Promise<'exact' | 'inexact'>;
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
  scheduled(): Promise<StoredReminder[]>;
  presented(): Promise<StoredReminder[]>;
  schedule(reminder: AppointmentReminder): Promise<void>;
  cancel(identifier: string): Promise<void>;
  dismiss(identifier: string): Promise<void>;
}

export class AppointmentReminderService {
  private session: ReminderSession | null = null;
  private generation = 0;
  private revision = 0;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly device: ReminderDevice,
    private readonly loadAppointments: () => Promise<DoctorAppointmentView[]>,
    private readonly sessionIsValid: (session: ReminderSession) => boolean,
    private readonly now = Date.now,
    private readonly onError: () => void = () => {},
  ) {}

  private enqueue<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work);
    this.queue = result.catch(() => {});
    return result;
  }

  private current(session: ReminderSession, generation: number): boolean {
    return (
      generation === this.generation &&
      this.session === session &&
      this.sessionIsValid(session)
    );
  }

  async setSession(
    session: ReminderSession | null,
    clearUnknown = false,
  ): Promise<void> {
    if (
      session?.patientId === this.session?.patientId &&
      session?.sessionId === this.session?.sessionId &&
      !(clearUnknown && !session)
    )
      return;
    const previous = this.session;
    this.session = session;
    const generation = ++this.generation;
    ++this.revision;
    // At a cold start the OS must retain the signed-in patient's previously scheduled reminders.
    if (!session && !previous && !clearUnknown) return;
    await this.enqueue(async () => {
      const scheduled = await this.device.scheduled();
      const presented = await this.device.presented();
      for (const [items, remove] of [
        [scheduled, this.device.cancel.bind(this.device)],
        [presented, this.device.dismiss.bind(this.device)],
      ] as const) {
        for (const item of items) {
          if (generation !== this.generation) return;
          const data = readReminderData(item.data);
          if (
            item.identifier.startsWith(REMINDER_PREFIX) &&
            (!session || data?.patientId !== session.patientId)
          ) {
            await remove(item.identifier);
          }
        }
      }
    });
  }

  async refresh(
    requestPermission = false,
    options: { throwOnDeviceError?: boolean } = {},
  ): Promise<DoctorAppointmentView[]> {
    const session = this.session;
    const generation = this.generation;
    const revision = ++this.revision;
    // A failed fetch never means that appointments were cancelled: keep the offline reminders.
    const appointments = await this.loadAppointments();
    if (
      !session ||
      !this.current(session, generation) ||
      revision !== this.revision
    )
      return appointments;
    try {
      const allowed = requestPermission
        ? await this.device.requestPermission()
        : await this.device.hasPermission();
      const precision =
        allowed && this.device.precision
          ? await this.device.precision()
          : 'exact';
      await this.enqueue(async () => {
        const valid = () =>
          this.current(session, generation) && revision === this.revision;
        if (!valid()) return;
        const plan = allowed
          ? buildReminderPlan(
              appointments,
              session.patientId,
              this.now(),
              this.device.maximumPending,
              precision,
            )
          : [];
        const desired = new Map(
          plan.map((reminder) => [reminder.identifier, reminder]),
        );
        const existing = await this.device.scheduled();
        const retained = new Set<string>();
        for (const item of existing) {
          if (!valid()) return;
          if (!item.identifier.startsWith(REMINDER_PREFIX)) continue;
          const expected = desired.get(item.identifier);
          const data = readReminderData(item.data);
          if (
            expected &&
            data?.startsAt === expected.data.startsAt &&
            data.firesAt === expected.data.firesAt &&
            data.patientId === session.patientId &&
            data.deliveryMode === expected.data.deliveryMode &&
            item.title === expected.title &&
            item.body === expected.body
          ) {
            retained.add(item.identifier);
          } else {
            await this.device.cancel(item.identifier);
          }
        }
        const presented = await this.device.presented();
        const starts = new Map(
          appointments
            .filter(needsAppointmentReminder)
            .map((a) => [a.appointment_id, Date.parse(a.start_date_time)]),
        );
        for (const item of presented) {
          if (!valid()) return;
          if (!item.identifier.startsWith(REMINDER_PREFIX)) continue;
          const data = readReminderData(item.data);
          if (
            !allowed ||
            !data ||
            data.patientId !== session.patientId ||
            starts.get(data.appointmentId) !== data.startsAt ||
            data.startsAt <= this.now()
          ) {
            await this.device.dismiss(item.identifier);
          }
        }
        for (const reminder of plan) {
          if (!valid()) return;
          if (
            retained.has(reminder.identifier) ||
            reminder.data.firesAt <= this.now()
          )
            continue;
          await this.device.schedule(reminder);
          if (!this.current(session, generation)) {
            await this.device.cancel(reminder.identifier);
            return;
          }
        }
      });
    } catch (error) {
      // The appointment operation must still succeed when the OS notification service is unavailable.
      this.onError();
      if (options.throwOnDeviceError) throw error;
    }
    return appointments;
  }

  async cancelAppointment(appointmentId: number): Promise<void> {
    const session = this.session;
    const generation = this.generation;
    ++this.revision;
    if (!session) return;
    await this.enqueue(async () => {
      for (const [items, remove] of [
        [await this.device.scheduled(), this.device.cancel.bind(this.device)],
        [await this.device.presented(), this.device.dismiss.bind(this.device)],
      ] as const) {
        for (const item of items) {
          if (!this.current(session, generation)) return;
          const data = readReminderData(item.data);
          if (
            item.identifier.startsWith(REMINDER_PREFIX) &&
            data?.patientId === session.patientId &&
            data.appointmentId === appointmentId
          )
            await remove(item.identifier);
        }
      }
    });
  }
}
