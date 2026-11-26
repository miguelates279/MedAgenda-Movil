import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import prescriptionsApi from '../../api/prescriptions';
import apiClient from '../../api/client';
import { PrescriptionUserView } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { usePrescriptionExport } from '../../hooks/usePrescriptionExport';
import { appAlerts } from '../../utils/appAlerts';

export interface PrescriptionGroup {
  clinicId: number;
  clinicName: string;
  items: PrescriptionUserView[];
}

export function usePrescriptionsScreen() {
  const { token } = useAuth();
  const [loaded, setLoaded] = useState<{
    sessionId: number;
    items: PrescriptionUserView[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const focused = useRef(false);
  const mounted = useRef(true);
  const requestGeneration = useRef(0);
  const { pdfPending, requestPdfExport } = usePrescriptionExport();
  const prescriptions =
    token && loaded?.sessionId === apiClient.getSessionId() ? loaded.items : [];

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      ++requestGeneration.current;
    };
  }, []);

  const loadPrescriptions = useCallback(async () => {
    if (!token || !focused.current) return;
    const sessionId = apiClient.getSessionId();
    const request = ++requestGeneration.current;
    const current = () =>
      mounted.current &&
      focused.current &&
      requestGeneration.current === request &&
      apiClient.getSessionId() === sessionId &&
      apiClient.getToken() === token;
    setLoading(true);
    try {
      const data = await prescriptionsApi.getUserPrescriptions();
      if (current()) setLoaded({ sessionId, items: data || [] });
    } catch (err: any) {
      if (!current()) return;
      appAlerts.alert(
        'Error',
        err?.message || 'No se pudieron cargar tus fórmulas médicas.',
        undefined,
        { variant: 'error' },
      );
    } finally {
      if (current()) setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      setLoading(false);
      void loadPrescriptions();
      return () => {
        focused.current = false;
        ++requestGeneration.current;
      };
    }, [loadPrescriptions]),
  );

  const groups = useMemo<PrescriptionGroup[]>(() => {
    const grouped: Record<number, PrescriptionGroup> = {};

    prescriptions.forEach((p) => {
      const cid = Number(p.clinic_id);
      if (!grouped[cid]) {
        grouped[cid] = {
          clinicId: cid,
          clinicName: p.clinic_name || `Clínica #${cid}`,
          items: [],
        };
      }
      grouped[cid].items.push(p);
    });

    return Object.values(grouped)
      .map((g) => ({
        ...g,
        items: [...g.items].sort(
          (a, b) =>
            new Date(b.date_emitted).getTime() -
            new Date(a.date_emitted).getTime(),
        ),
      }))
      .sort((a, b) => a.clinicName.localeCompare(b.clinicName, 'es'));
  }, [prescriptions]);

  return {
    prescriptions,
    loading,
    groups,
    loadPrescriptions,
    pdfPending,
    requestPdfExport,
  };
}
