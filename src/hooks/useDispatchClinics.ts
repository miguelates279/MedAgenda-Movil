import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import appointmentsApi from '../api/appointments';
import apiClient from '../api/client';
import type { DispatchClinic } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useFocusedRefresh } from './useFocusedRefresh';

export function useDispatchClinics() {
  const { isAuthenticated, activeMode, token } = useAuth();
  const [clinics, setClinics] = useState<DispatchClinic[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const active = useRef(false);
  const generation = useRef(0);
  const loadedSession = useRef(-1);
  const load = useCallback(async () => {
    if (!isAuthenticated || !active.current) return;
    const session = apiClient.getSessionId();
    const request = ++generation.current;
    const current = () =>
      active.current &&
      session === apiClient.getSessionId() &&
      request === generation.current;
    setLoading(true);
    try {
      const data = await appointmentsApi.getDispatchClinics();
      if (current()) {
        loadedSession.current = session;
        setClinics(data);
        setError(null);
      }
    } catch (cause: any) {
      if (current()) {
        setError(
          cause?.message || 'No se pudieron cargar tus clínicas de recepción.',
        );
      }
    } finally {
      if (current()) setLoading(false);
    }
  }, [isAuthenticated, activeMode, token]);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      void load();
      return () => {
        active.current = false;
        ++generation.current;
      };
    }, [load]),
  );
  useFocusedRefresh(load, isAuthenticated);
  return {
    clinics:
      isAuthenticated && loadedSession.current === apiClient.getSessionId()
        ? clinics
        : [],
    loading,
    error,
    load,
  };
}
