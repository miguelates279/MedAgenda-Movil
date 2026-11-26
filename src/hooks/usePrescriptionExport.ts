import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import apiClient from '../api/client';
import { exportPrescriptionPdf } from '../utils/prescriptionPdf';
import { appAlerts } from '../utils/appAlerts';

export type PrescriptionPdfAction = 'save' | 'share';

export interface PrescriptionPdfPending {
  prescriptionId: number;
  action: PrescriptionPdfAction;
}

export function usePrescriptionExport() {
  const [pdfPending, setPdfPending] = useState<PrescriptionPdfPending | null>(
    null,
  );
  const busy = useRef(false);
  const mounted = useRef(true);
  const focused = useRef(false);
  const focusGeneration = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      focused.current = true;
      ++focusGeneration.current;
      return () => {
        focused.current = false;
        ++focusGeneration.current;
      };
    }, []),
  );

  const requestPdfExport = async (
    prescriptionId: number,
    action: PrescriptionPdfAction,
  ) => {
    if (
      busy.current ||
      !focused.current ||
      !Number.isSafeInteger(prescriptionId) ||
      prescriptionId <= 0
    )
      return;

    const token = apiClient.getToken();
    if (!token) return;
    const sessionId = apiClient.getSessionId();
    const generation = focusGeneration.current;
    const current = () =>
      mounted.current &&
      focused.current &&
      focusGeneration.current === generation &&
      apiClient.getSessionId() === sessionId &&
      apiClient.getToken() === token;

    busy.current = true;
    setPdfPending({ prescriptionId, action });
    try {
      const result = await exportPrescriptionPdf(
        prescriptionId,
        action,
        current,
      );
      if (current() && result === 'completed' && action === 'save') {
        appAlerts.alert(
          'PDF guardado',
          'Tu receta está disponible en la ubicación que elegiste.',
          undefined,
          { variant: 'success' },
        );
      }
    } catch (error: unknown) {
      if (current()) {
        appAlerts.alert(
          'No se pudo exportar la receta',
          error instanceof Error
            ? error.message
            : 'Vuelve a intentarlo en un momento.',
          undefined,
          { variant: 'error' },
        );
      }
    } finally {
      busy.current = false;
      if (mounted.current) setPdfPending(null);
    }
  };

  return { pdfPending, requestPdfExport };
}
