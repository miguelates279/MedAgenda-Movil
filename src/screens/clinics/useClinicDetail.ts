import { useCallback, useEffect, useMemo, useState } from 'react';
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
    removeAdminClinic,
    getSessionId,
  } = useAuth();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [rules, setRules] = useState<ClinicScheduleRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isDeletedLocally, setIsDeletedLocally] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ID del doctor para agendamiento pendiente tras confirmar cambio al modo Paciente (Fix 3)
  const [pendingBookingDoctorId, setPendingBookingDoctorId] = useState<number | null>(null);

  // Navegar a la ruta protegida de agendamiento solo tras haber completado la transición al modo Paciente
  useEffect(() => {
    if (pendingBookingDoctorId !== null && activeMode === 'patient') {
      const targetDoctorId = pendingBookingDoctorId;
      setPendingBookingDoctorId(null);
      router.push({
        pathname: '/appointments/new',
        params: { clinic_id: clinicId, doctor_id: targetDoctorId },
      } as any);
    }
  }, [pendingBookingDoctorId, activeMode, clinicId, router]);

  // Verificación estricta de propiedad clínica (Deliverable D - 8.1):
  // Solo se muestra control de eliminación si está autenticado, en activeMode === 'admin',
  // la clínica figura en adminClinics verificadas y su rol es 'Owner'.
  // Al confirmarse la eliminación local, el control se retira inmediatamente sin esperar al refresco.
  const isOwner = useMemo(() => {
    if (isDeletedLocally || !isAuthenticated || activeMode !== 'admin') return false;
    return adminClinics.some(
      (c) => c.clinic_id === clinicId && c.role_within_clinic === 'Owner'
    );
  }, [isDeletedLocally, isAuthenticated, activeMode, adminClinics, clinicId]);

  useEffect(() => {
    if (!clinicId) return;
    const currentSessionId = getSessionId();

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cData, dList, rData] = await Promise.all([
          clinicsApi.getClinicDetails(clinicId),
          clinicsApi.getClinicDoctors(clinicId),
          clinicsApi.getClinicScheduleRules(clinicId).catch(() => null),
        ]);
        if (getSessionId() === currentSessionId) {
          setClinic(cData);
          setDoctors(dList);
          setRules(rData);
        }
      } catch (err: any) {
        if (getSessionId() === currentSessionId) {
          setError(err.message || 'Error al cargar detalles de la clínica');
        }
      } finally {
        if (getSessionId() === currentSessionId) {
          setLoading(false);
        }
      }
    })();
  }, [clinicId, getSessionId]);

  // Manejo coherente de agendamiento público según modo y sesión (Fix 3)
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
            {
              text: 'Cancelar',
              style: 'cancel',
              onPress: () => {
                setPendingBookingDoctorId(null);
              },
            },
            {
              text: 'Cambiar a Paciente',
              onPress: () => {
                // Registrar el doctor seleccionado y solicitar transición al modo Paciente
                // El useEffect se encargará de navegar una vez que el guard de ruta sea válido
                setPendingBookingDoctorId(doctorId);
                setActiveMode('patient');
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

  // Separación estricta de eliminación de clínica y sincronización de roles (Fix 2 & Stage 4 Carryover B)
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
            const targetSessionId = getSessionId();
            setDeleting(true);

            // 1. Ejecutar DELETE en el backend
            try {
              await clinicsApi.deleteClinic(clinicId);
            } catch (deleteErr: any) {
              setDeleting(false);
              Alert.alert('No se pudo eliminar', deleteErr?.message || 'Intenta nuevamente.');
              return;
            }

            // Verify active session generation has not changed while awaiting DELETE
            if (getSessionId() !== targetSessionId) return;

            // 2. El DELETE fue exitoso: retirar la clínica de AuthContext y de la vista inmediatamente
            setIsDeletedLocally(true);
            removeAdminClinic(clinicId);
            setDeleting(false);

            // 3. Sincronizar membresías y capacidades de rol de forma separada
            const syncRoleAccess = async () => {
              if (getSessionId() !== targetSessionId) {
                return;
              }
              try {
                const refreshedClinics = await refreshRoleAccess();
                if (getSessionId() !== targetSessionId) {
                  return;
                }
                const verifiedList = Array.isArray(refreshedClinics) ? refreshedClinics : [];
                if (verifiedList.length > 0) {
                  // Aún cuenta con otras sedes administrables: preservar la experiencia admin
                  router.replace('/clinics/mine' as any);
                } else {
                  // No quedan sedes administrables: enrutador central '/' revoca admin y navega
                  router.replace('/' as any);
                }
              } catch (syncErr: any) {
                if (
                  getSessionId() !== targetSessionId ||
                  syncErr?.message?.includes('canceled') ||
                  syncErr?.message?.includes('invalidated') ||
                  syncErr?.message?.includes('superseded')
                ) {
                  return;
                }
                // Al fallar la sincronización, NUNCA asumir 0 clínicas restantes ni reportar fallo de eliminación
                Alert.alert(
                  'Clínica eliminada',
                  'La clínica se eliminó correctamente, pero ocurrió un problema al sincronizar los permisos de administración. Puedes reintentar la sincronización de tus permisos.',
                  [
                    {
                      text: 'Reintentar sincronización',
                      onPress: () => syncRoleAccess(),
                    },
                    {
                      text: 'Ir a Mis Clínicas',
                      onPress: () => router.replace('/clinics/mine' as any),
                    },
                  ]
                );
              }
            };

            await syncRoleAccess();
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
