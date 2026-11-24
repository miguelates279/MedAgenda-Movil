import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  MAX_PENDING_REMINDERS,
  REMINDER_CHANNEL,
  readReminderData,
} from './reminderPlan';
import type { ReminderDevice } from './reminderService';
import type { ReminderData } from './reminderPlan';
import exactAlarmAccess from '../../../../modules/medagenda-reminder-access';
import { appAlerts } from '../../../utils/appAlerts';

export const remindersSupported =
  Platform.OS === 'android' || Platform.OS === 'ios';

if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function createChannel(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: 'Recordatorios de citas',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
    });
  }
}

function permitted(
  status: Notifications.NotificationPermissionsStatus,
): boolean {
  return (
    status.granted ||
    status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    status.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL
  );
}

export async function hasReminderPermission(): Promise<boolean> {
  return (
    remindersSupported && permitted(await Notifications.getPermissionsAsync())
  );
}

let permissionRequest: Promise<boolean> | null = null;

export function hasPreciseReminderAccess(): boolean {
  if (!remindersSupported) return false;
  if (Platform.OS !== 'android' || Number(Platform.Version) < 31) return true;
  try {
    return exactAlarmAccess?.canScheduleExactAlarms() ?? false;
  } catch {
    return false;
  }
}

async function offerPreciseReminders(): Promise<void> {
  if (hasPreciseReminderAccess()) return;
  if (!exactAlarmAccess) {
    appAlerts.alert(
      'Recordatorios puntuales',
      'Para autorizar avisos a la hora programada, utiliza un APK de MedAgenda con este módulo instalado.',
      undefined,
      { variant: 'warning' },
    );
    return;
  }
  const accepted = await new Promise<boolean>((resolve) =>
    appAlerts.alert(
      'Recordatorios a tiempo',
      'Android necesita que permitas las alarmas y recordatorios para avisarte a la hora programada. Los avisos se activarán cuando lo autorices. Puedes seguir usando tus citas sin este permiso.',
      [
        { text: 'Ahora no', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Abrir ajustes', onPress: () => resolve(true) },
      ],
      { variant: 'primary', cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
  if (accepted) await exactAlarmAccess.openExactAlarmSettings();
}

async function askPermission(): Promise<boolean> {
  if (!remindersSupported) return false;
  await createChannel();
  const status = await Notifications.getPermissionsAsync();
  if (permitted(status)) {
    await offerPreciseReminders();
    return hasPreciseReminderAccess();
  }
  const accepted = await new Promise<boolean>((resolve) =>
    appAlerts.alert(
      'Recordatorios de tus citas',
      'MedAgenda puede avisarte 24 horas y 1 hora antes de cada cita. Al tocar el aviso abrirás esa cita. Puedes seguir usando la app sin permitir las notificaciones.',
      [
        { text: 'Ahora no', style: 'cancel', onPress: () => resolve(false) },
        {
          text: status.canAskAgain ? 'Continuar' : 'Abrir ajustes',
          onPress: () => resolve(true),
        },
      ],
      { variant: 'primary', cancelable: true, onDismiss: () => resolve(false) },
    ),
  );
  if (!accepted) return false;
  if (!status.canAskAgain) {
    await Linking.openSettings();
    return false;
  }
  const allowed = permitted(
    await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowSound: true, allowBadge: false },
    }),
  );
  if (allowed) await offerPreciseReminders();
  return allowed && hasPreciseReminderAccess();
}

export const reminderDevice: ReminderDevice = {
  maximumPending:
    Platform.OS === 'ios' ? MAX_PENDING_REMINDERS : Number.POSITIVE_INFINITY,
  async hasPermission() {
    return (await hasReminderPermission()) && hasPreciseReminderAccess();
  },
  async precision() {
    return hasPreciseReminderAccess() ? 'exact' : 'inexact';
  },
  requestPermission() {
    if (!permissionRequest)
      permissionRequest = askPermission().finally(() => {
        permissionRequest = null;
      });
    return permissionRequest;
  },
  async scheduled() {
    if (!remindersSupported) return [];
    return (await Notifications.getAllScheduledNotificationsAsync()).map(
      (r) => ({
        identifier: r.identifier,
        title: r.content.title,
        body: r.content.body,
        data: r.content.data,
      }),
    );
  },
  async presented() {
    if (!remindersSupported) return [];
    return (await Notifications.getPresentedNotificationsAsync()).map((n) => ({
      identifier: n.request.identifier,
      title: n.request.content.title,
      body: n.request.content.body,
      data: n.request.content.data,
    }));
  },
  async schedule(reminder) {
    if (!remindersSupported) return;
    await createChannel();
    await Notifications.scheduleNotificationAsync({
      identifier: reminder.identifier,
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { ...reminder.data },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(reminder.data.firesAt),
        channelId: REMINDER_CHANNEL,
      },
    });
  },
  async cancel(identifier) {
    if (remindersSupported)
      await Notifications.cancelScheduledNotificationAsync(identifier);
  },
  async dismiss(identifier) {
    if (remindersSupported)
      await Notifications.dismissNotificationAsync(identifier);
  },
};

export interface ReminderResponse {
  identifier: string;
  data: ReminderData;
}

function parseResponse(
  response: Notifications.NotificationResponse | null,
): ReminderResponse | null {
  if (response?.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER)
    return null;
  const data = readReminderData(response.notification.request.content.data);
  return data
    ? { identifier: response.notification.request.identifier, data }
    : null;
}

export function observeReminderResponses(
  listener: (response: ReminderResponse) => void,
): () => void {
  if (!remindersSupported) return () => {};
  const last = parseResponse(Notifications.getLastNotificationResponse());
  if (last) listener(last);
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const parsed = parseResponse(response);
      if (parsed) listener(parsed);
    },
  );
  return () => subscription.remove();
}

export function clearReminderResponse(): void {
  if (remindersSupported) Notifications.clearLastNotificationResponse();
}
