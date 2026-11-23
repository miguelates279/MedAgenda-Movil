import { requireOptionalNativeModule } from 'expo-modules-core';
import { Platform } from 'react-native';

interface ExactAlarmAccess {
  canScheduleExactAlarms(): boolean;
  openExactAlarmSettings(): Promise<void>;
}

export default Platform.OS === 'android'
  ? requireOptionalNativeModule<ExactAlarmAccess>('MedAgendaReminderAccess')
  : null;
