import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import clinicsApi from '../../api/clinics';
import type { Specialty } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { clinicPayload, newClinicValues } from './clinicManagement';
import type { ClinicEditorValues } from './clinicManagement';
import { appAlerts } from '../../utils/appAlerts';

export type ClinicFormValues = ClinicEditorValues;

export function useCreateClinic() {
  const router = useRouter();
  const {
    isAuthenticated,
    activeMode,
    refreshRoleAccess,
    setActiveMode,
    getSessionId,
  } = useAuth();
  const form = useForm<ClinicEditorValues>({
    defaultValues: newClinicValues(),
  });
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdClinicId, setCreatedClinicId] = useState<number | null>(null);
  const [verifiedClinicId, setVerifiedClinicId] = useState<number | null>(null);
  const [isVerifyingRole, setIsVerifyingRole] = useState(false);
  const [roleVerificationError, setRoleVerificationError] = useState<
    string | null
  >(null);
  const [retry, setRetry] = useState(0);
  const mounted = useRef(true);
  const busy = useRef(false);
  const verificationBusy = useRef(false);
  const session = getSessionId();
  const liveSession = useRef(session);
  liveSession.current = session;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    clinicsApi
      .getAllSpecialties()
      .then((data) => {
        if (active && getSessionId() === session) setSpecialties(data);
      })
      .catch((cause) => {
        if (active && getSessionId() === session)
          setSubmitError(
            cause?.message || 'No se pudieron cargar las especialidades.',
          );
      });
    return () => {
      active = false;
    };
  }, [retry, session, getSessionId]);

  useEffect(() => {
    if (activeMode === 'admin' && verifiedClinicId !== null && mounted.current)
      router.replace(`/clinics/manage/${verifiedClinicId}` as any);
  }, [activeMode, verifiedClinicId, router]);

  const verifyRoleAndTransition = useCallback(
    async (clinicId: number) => {
      const targetSession = getSessionId();
      const current = () =>
        mounted.current &&
        liveSession.current === targetSession &&
        getSessionId() === targetSession;
      if (!current() || verificationBusy.current) return;
      verificationBusy.current = true;
      setIsVerifyingRole(true);
      setRoleVerificationError(null);
      try {
        const clinics = await refreshRoleAccess();
        if (!current()) return;
        if (
          !clinics.some(
            (item) =>
              item.clinic_id === clinicId &&
              item.role_within_clinic === 'Owner',
          )
        ) {
          setRoleVerificationError(
            'La clínica se creó, pero falta confirmar tu acceso como propietario. Reintenta la verificación sin volver a crearla.',
          );
          return;
        }
        setVerifiedClinicId(clinicId);
        setActiveMode('admin');
      } catch (cause: any) {
        if (current())
          setRoleVerificationError(
            cause?.message ||
              'La clínica se creó. Reintenta la verificación de permisos.',
          );
      } finally {
        if (current()) {
          verificationBusy.current = false;
          setIsVerifyingRole(false);
        }
      }
    },
    [refreshRoleAccess, getSessionId, setActiveMode],
  );

  const onSubmit = async (values: ClinicEditorValues) => {
    if (!isAuthenticated || busy.current || createdClinicId !== null) return;
    const targetSession = getSessionId();
    const current = () =>
      mounted.current &&
      liveSession.current === targetSession &&
      getSessionId() === targetSession;
    try {
      const payload = clinicPayload(values);
      busy.current = true;
      setSubmitError(null);
      setIsSubmitting(true);
      const result = await clinicsApi.createClinic(payload);
      if (!current()) return;
      setCreatedClinicId(result.clinic_id);
      await verifyRoleAndTransition(result.clinic_id);
    } catch (cause: any) {
      if (current()) {
        const message = cause?.message || 'No se pudo crear la clínica.';
        setSubmitError(message);
        appAlerts.alert('No se pudo crear la clínica', message, undefined, {
          variant: 'error',
        });
      }
    } finally {
      if (current()) {
        busy.current = false;
        setIsSubmitting(false);
      }
    }
  };

  return {
    router,
    isAuthenticated,
    form,
    specialties,
    isSubmitting,
    submitError,
    createdClinicId,
    isVerifyingRole,
    roleVerificationError,
    retrySpecialties: () => {
      setSubmitError(null);
      setRetry((value) => value + 1);
    },
    handleRetryVerification: () => {
      if (createdClinicId !== null)
        void verifyRoleAndTransition(createdClinicId);
    },
    onSubmit,
  };
}

export default useCreateClinic;
