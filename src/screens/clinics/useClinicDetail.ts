import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import clinicsApi from '../../api/clinics';
import { Clinic, ClinicScheduleRules, PublicDoctor } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

export function useClinicDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clinicId = Number(id);
  const { roles } = useAuth();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [rules, setRules] = useState<ClinicScheduleRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cData, dList, rData] = await Promise.all([
          clinicsApi.getClinicDetails(clinicId),
          clinicsApi.getClinicDoctors(clinicId),
          clinicsApi.getClinicScheduleRules(clinicId).catch(() => null),
        ]);
        if (active) {
          setClinic(cData);
          setDoctors(dList);
          setRules(rData);
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Error al cargar detalles de la clínica');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [clinicId]);

  const handleBookWithDoctor = (doctorId: number) => {
    router.push({
      pathname: '/appointments/new',
      params: { clinic_id: clinicId, doctor_id: doctorId },
    } as any);
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar clínica',
      'Esta acción no se puede deshacer. ¿Quieres continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await clinicsApi.deleteClinic(clinicId);
              Alert.alert('Clínica eliminada', 'La clínica se eliminó correctamente.', [
                { text: 'Continuar', onPress: () => router.replace('/clinics' as any) },
              ]);
            } catch (err: any) {
              Alert.alert('No se pudo eliminar', err.message || 'Intenta nuevamente.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  return {
    router,
    roles,
    clinic,
    doctors,
    rules,
    loading,
    deleting,
    error,
    handleBookWithDoctor,
    handleDelete,
  };
}
