import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import clinicsApi from '../../api/clinics';
import { Clinic } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

export function useMyClinics() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [userClinics, setUserClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [clinicPendingDelete, setClinicPendingDelete] = useState<Clinic | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadUserClinics = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await clinicsApi.getUserClinics();
      setUserClinics(data || []);
    } catch (err: any) {
      setError(err.message || 'No se pudieron cargar tus clínicas.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadUserClinics();
  }, [loadUserClinics]);

  const confirmDelete = async () => {
    if (!clinicPendingDelete) return;
    const cid = clinicPendingDelete.clinic_id;
    setDeleting(true);
    try {
      await clinicsApi.deleteClinic(cid);
      setUserClinics((prev) => prev.filter((item) => item.clinic_id !== cid));
      setClinicPendingDelete(null);
    } catch (err: any) {
      setError(err.message || 'No se pudo eliminar la clínica.');
    } finally {
      setDeleting(false);
    }
  };

  return {
    router,
    isAuthenticated,
    userClinics,
    loading,
    error,
    clinicPendingDelete,
    setClinicPendingDelete,
    deleting,
    loadUserClinics,
    confirmDelete,
  };
}
