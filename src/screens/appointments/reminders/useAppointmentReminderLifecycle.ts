import { useEffect, useRef, useState } from 'react';
import { Alert, AppState } from 'react-native';
import { useRootNavigationState, useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import {
  appointmentReminders,
  refreshAppointmentReminders,
} from './appointmentReminders';
import {
  clearReminderResponse,
  observeReminderResponses,
} from './deviceNotifications';
import type { ReminderResponse } from './deviceNotifications';
import {
  reminderNavigationAction,
  reminderResponseKey,
} from './reminderNavigation';

export function useAppointmentReminderLifecycle(): void {
  const {
    user,
    isAuthenticated,
    isLoading,
    isResolvingModes,
    activeMode,
    availableModes,
    setActiveMode,
    getSessionId,
  } = useAuth();
  const router = useRouter();
  const navigation = useRootNavigationState();
  const [pending, setPending] = useState<ReminderResponse | null>(null);
  const consumed = useRef(new Set<string>());
  const loginRedirect = useRef<string | null>(null);
  const wasAuthenticated = useRef(false);
  const patientId = user?.user_id;
  const sessionId = getSessionId();

  useEffect(() => {
    let active = true;
    const session =
      isAuthenticated && patientId ? { patientId, sessionId } : null;
    void appointmentReminders
      .setSession(session, !session && sessionId > 0)
      .then(() => {
        if (active && session) void refreshAppointmentReminders();
      })
      .catch(() =>
        console.warn(
          'No fue posible limpiar los recordatorios de la sesión anterior.',
        ),
      );
    return () => {
      active = false;
    };
  }, [isAuthenticated, patientId, sessionId]);

  useEffect(() => {
    try {
      return observeReminderResponses((response) => {
        if (
          !consumed.current.has(
            reminderResponseKey(response.identifier, response.data),
          )
        )
          setPending(response);
      });
    } catch {
      console.warn('No fue posible leer el aviso de la cita.');
    }
  }, []);

  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      setPending(null);
      clearReminderResponse();
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!pending) return;
    const key = reminderResponseKey(pending.identifier, pending.data);
    const action = reminderNavigationAction(pending.data, {
      ready: !!navigation?.key,
      authenticated: isAuthenticated,
      loading: isLoading,
      resolvingModes: isResolvingModes,
      patientId,
      activeMode,
      availableModes,
    });
    if (action === 'wait') return;
    if (action === 'login') {
      if (loginRedirect.current !== key) {
        loginRedirect.current = key;
        router.replace('/profile');
      }
      return;
    }
    if (action === 'wrong-account') {
      consumed.current.add(key);
      setPending(null);
      clearReminderResponse();
      Alert.alert(
        'Recordatorio de otra cuenta',
        'Iniciaste sesión con una cuenta diferente a la de esta cita.',
      );
      return;
    }
    if (action === 'patient-mode') {
      setActiveMode('patient');
      return;
    }
    consumed.current.add(key);
    setPending(null);
    clearReminderResponse();
    router.push({
      pathname: '/appointments/[id]',
      params: { id: String(pending.data.appointmentId) },
    });
  }, [
    pending,
    navigation?.key,
    isAuthenticated,
    isLoading,
    isResolvingModes,
    patientId,
    activeMode,
    availableModes,
    setActiveMode,
    router,
  ]);

  useEffect(() => {
    if (!isAuthenticated || !patientId) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshAppointmentReminders();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === 'active')
        void refreshAppointmentReminders();
    }, 60_000);
    return () => {
      subscription.remove();
      clearInterval(timer);
    };
  }, [isAuthenticated, patientId, sessionId]);
}
