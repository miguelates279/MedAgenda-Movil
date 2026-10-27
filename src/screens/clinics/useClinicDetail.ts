import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import clinicsApi from '../../api/clinics';
import { Clinic, ClinicScheduleRules, PublicDoctor } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

export function useClinicDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clinicId = Number(id);
  const {
    isAuthenticated,
    activeMode,
    availableModes,
    adminClinics,
    setActiveMode,
    refreshRoleAccess,
  } = useAuth();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [rules, setRules] = useState<ClinicScheduleRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificación estricta de propiedad clínica (Deliverable D - 8.1):
  // Solo se muestra control de eliminación si está autenticado, en activeMode === 'admin',
  // la clínica figura en adminClinics verificadas y su rol es 'Owner'.
  const isOwner = useMemo(() => {
    if (!isAuthenticated || activeMode !== 'admin') return false;
    return adminClinics.some(
      (c) => c.clinic_id === clinicId && c.role_within_clinic === 'Owner'
    );
  }, [isAuthenticated, activeMode, adminClinics, clinicId]);

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

  // Manejo coherente de agendamiento público según modo y sesión (Deliverable D - 8.2)
  const handleBookWithDoctor = (doctorId: number) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Inicio de sesión requerido',
        'Para agendar una cita médica debes iniciar sesión con una cuenta de paciente.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Iniciar Sesión',
            onPress: () => router.push('/profile' as any),
          },
        ]
      );
      return;
    }

    if (activeMode !== 'patient') {
      if (availableModes.includes('patient')) {
        Alert.alert(
          'Función exclusiva de Paciente',
          'El agendamiento de citas está disponible en el modo Paciente. ¿Deseas cambiar al modo Paciente para continuar?',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Cambiar a Paciente',
              onPress: () => {
                setActiveMode('patient');
                router.push({
                  pathname: '/appointments/new',
                  params: { clinic_id: clinicId, doctor_id: doctorId },
                } as any);
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Modo no disponible',
          'El agendamiento de citas médicas está disponible únicamente en el modo Paciente.'
        );
      }
      return;
    }

    router.push({
      pathname: '/appointments/new',
      params: { clinic_id: clinicId, doctor_id: doctorId },
    } as any);
  };

  // Eliminación con actualización de roles y navegación coherente (Deliverable D & E)
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
              let remainingAdminClinicsCount = 0;
              try {
                const refreshedClinics = await refreshRoleAccess();
                remainingAdminClinicsCount = Array.isArray(refreshedClinics)
                  ? refreshedClinics.length
                  : 0;
              } catch {
                // Si la sincronización falla, no tratar eliminación como fallo si el DELETE tuvo éxito
              }
              Alert.alert('Clínica eliminada', 'La clínica se eliminó correctamente.', [
                {
                  text: 'Continuar',
                  onPress: () => {
                    if (remainingAdminClinicsCount > 0) {
                      router.replace('/clinics/mine' as any);
                    } else {
                      router.replace('/' as any);
                    }
                  },
                },
              ]);
            } catch (err: any) {
              Alert.alert('No se pudo eliminar', err?.message || 'Intenta nuevamente.');
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
    isOwner,
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

export default useClinicDetail;
