import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import adminApi from '../../api/admin';
import clinicsApi from '../../api/clinics';
import { AdminClinic } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

export function useMyClinics() {
  const router = useRouter();
  const { isAuthenticated, activeMode, refreshRoleAccess } = useAuth();
  const [adminClinics, setAdminClinics] = useState<AdminClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [clinicPendingDelete, setClinicPendingDelete] = useState<AdminClinic | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadAdminClinics = useCallback(async () => {
    if (!isAuthenticated || activeMode !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getMyClinics();
      setAdminClinics(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar tus clínicas de administración.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, activeMode]);

  useEffect(() => {
    loadAdminClinics();
  }, [loadAdminClinics]);

  const handleSyncRoles = useCallback(async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const updatedClinics = await refreshRoleAccess();
      const verifiedList = Array.isArray(updatedClinics) ? updatedClinics : [];
      setAdminClinics(verifiedList);
      if (verifiedList.length === 0) {
        // Al confirmarse cero membresías verificadas, el modo Admin se revoca y redirige vía '/'
        router.replace('/' as any);
      }
    } catch (syncErr: any) {
      // Advertencia precisa de sincronización separada de errores de eliminación
      setSyncError(
        syncErr?.message ||
          'La clínica fue eliminada, pero ocurrió un problema al sincronizar los permisos de administración. Puedes reintentar la sincronización.'
      );
    } finally {
      setIsSyncing(false);
    }
  }, [refreshRoleAccess, router]);

  const confirmDelete = async () => {
    if (!clinicPendingDelete) return;
    const cid = clinicPendingDelete.clinic_id;
    setDeleting(true);
    setError(null);
    setSyncError(null);

    // 1. Ejecutar DELETE en el backend
    try {
      await clinicsApi.deleteClinic(cid);
    } catch (deleteErr: any) {
      setError(deleteErr?.message || 'No se pudo eliminar la clínica.');
      setDeleting(false);
      return;
    }

    // 2. El DELETE fue exitoso: retirar inmediatamente la clínica del listado local y limpiar selección
    setAdminClinics((prev) => prev.filter((item) => item.clinic_id !== cid));
    setClinicPendingDelete(null);
    setDeleting(false);

    // 3. Sincronizar capacidades de rol de forma separada sin repetir el DELETE ante fallo
    await handleSyncRoles();
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
    handleRetrySync: handleSyncRoles,
    clinicPendingDelete,
    setClinicPendingDelete,
    deleting,
    loadAdminClinics,
    confirmDelete,
  };
}

export default useMyClinics;
