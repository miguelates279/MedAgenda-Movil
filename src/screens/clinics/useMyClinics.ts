import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import adminApi from '../../api/admin';
import clinicsApi from '../../api/clinics';
import { AdminClinic } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

export function useMyClinics() {
  const router = useRouter();
  const {
    isAuthenticated,
    activeMode,
    refreshRoleAccess,
    removeAdminClinic,
    getSessionId,
  } = useAuth();
  const [adminClinics, setAdminClinics] = useState<AdminClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [clinicPendingDelete, setClinicPendingDelete] = useState<AdminClinic | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAdminClinics = useCallback(async () => {
    const currentSessionId = getSessionId();
    if (!isAuthenticated || activeMode !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getMyClinics();
      // Guard against stale closures across await: verify active session generation
      if (getSessionId() !== currentSessionId) {
        return;
      }
      setAdminClinics(Array.isArray(data) ? data : []);
    } catch (err: any) {
      if (getSessionId() !== currentSessionId) {
        return;
      }
      setError(err?.message || 'No se pudieron cargar tus clínicas de administración.');
    } finally {
      if (getSessionId() === currentSessionId) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, activeMode, getSessionId]);

  useEffect(() => {
    loadAdminClinics();
  }, [loadAdminClinics]);

  const handleSyncRoles = useCallback(
    async (expectedSessionId?: number) => {
      const targetSessionId = expectedSessionId ?? getSessionId();
      if (getSessionId() !== targetSessionId) {
        return;
      }
      setIsSyncing(true);
      setSyncError(null);
      try {
        const updatedClinics = await refreshRoleAccess();
        // Guard against stale closures: verify active session generation
        if (getSessionId() !== targetSessionId) {
          return;
        }
        const verifiedList = Array.isArray(updatedClinics) ? updatedClinics : [];
        setAdminClinics(verifiedList);
        if (verifiedList.length === 0) {
          // Al confirmarse cero membresías verificadas, el modo Admin se revoca y redirige vía '/'
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
        // Advertencia precisa de sincronización separada de errores de eliminación
        setSyncError(
          syncErr?.message ||
            'La clínica fue eliminada, pero ocurrió un problema al sincronizar los permisos de administración. Puedes reintentar la sincronización.'
        );
      } finally {
        if (getSessionId() === targetSessionId) {
          setIsSyncing(false);
        }
      }
    },
    [refreshRoleAccess, router, getSessionId]
  );

  const confirmDelete = async () => {
    if (!clinicPendingDelete) return;
    const targetSessionId = getSessionId();
    if (!isAuthenticated || activeMode !== 'admin') return;

    const cid = clinicPendingDelete.clinic_id;
    setDeleting(true);
    setError(null);
    setSyncError(null);

    // 1. Ejecutar DELETE en el backend
    try {
      await clinicsApi.deleteClinic(cid);
    } catch (deleteErr: any) {
      setDeleting(false);
      setError(deleteErr?.message || 'No se pudo eliminar la clínica.');
      return;
    }

    // Verify session has not been invalidated or switched while awaiting DELETE
    if (getSessionId() !== targetSessionId) return;

    // 2. El DELETE fue exitoso: retirar inmediatamente la clínica del listado local y del AuthContext compartido
    setAdminClinics((prev) => prev.filter((item) => item.clinic_id !== cid));
    removeAdminClinic(cid);
    setClinicPendingDelete(null);
    setDeleting(false);

    // 3. Sincronizar capacidades de rol de forma separada sin repetir el DELETE ante fallo
    await handleSyncRoles(targetSessionId);
  };

  return {
    router,
    isAuthenticated,
    activeMode,
    adminClinics,
    loading,
    error,
    syncError,
    isSyncing,
    handleRetrySync: () => handleSyncRoles(),
    clinicPendingDelete,
    setClinicPendingDelete,
    deleting,
    loadAdminClinics,
    confirmDelete,
  };
}

export default useMyClinics;
