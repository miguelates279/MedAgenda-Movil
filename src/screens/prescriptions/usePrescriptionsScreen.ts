import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import prescriptionsApi from '../../api/prescriptions';
import { PrescriptionUserView } from '../../api/types';

export interface PrescriptionGroup {
  clinicId: number;
  clinicName: string;
  items: PrescriptionUserView[];
}

export function usePrescriptionsScreen() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionUserView[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await prescriptionsApi.getUserPrescriptions();
      setPrescriptions(data || []);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'No se pudieron cargar tus fórmulas médicas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

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
          (a, b) => new Date(b.date_emitted).getTime() - new Date(a.date_emitted).getTime()
        ),
      }))
      .sort((a, b) => a.clinicName.localeCompare(b.clinicName, 'es'));
  }, [prescriptions]);

  return {
    prescriptions,
    loading,
    groups,
    loadPrescriptions,
  };
}
