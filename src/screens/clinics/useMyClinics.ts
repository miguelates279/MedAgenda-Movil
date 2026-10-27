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

  const confirmDelete = async () => {
    if (!clinicPendingDelete) return;
    const cid = clinicPendingDelete.clinic_id;
    setDeleting(true);
    try {
      await clinicsApi.deleteClinic(cid);
      setAdminClinics((prev) => prev.filter((item) => item.clinic_id !== cid));
      setClinicPendingDelete(null);
      // Sincronizar capacidades de rol en AuthContext en segundo plano
      refreshRoleAccess().catch(() => {});
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar la clínica.');
    } finally {
      setDeleting(false);
    }
  };

  return {
    router,
    isAuthenticated,
    activeMode,
    adminClinics,
    loading,
    error,
    clinicPendingDelete,
    setClinicPendingDelete,
    deleting,
    loadAdminClinics,
    confirmDelete,
  };
}

export default useMyClinics;
