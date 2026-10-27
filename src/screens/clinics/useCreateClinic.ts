import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import clinicsApi from '../../api/clinics';
import { CreateClinicDto } from '../../api/types';
import { useAuth } from '../../context/AuthContext';
import { useClinicSearch } from '../../hooks/useClinicSearch';
import { SelectOption } from '../../components';

export type ClinicFormValues = Omit<CreateClinicDto, 'clinic_city_id'>;

export function useCreateClinic() {
  const router = useRouter();
  const { isAuthenticated, refreshRoleAccess, setActiveMode } = useAuth();
  const {
    countries,
    states,
    cities,
    countryId,
    stateId,
    cityId,
    setCountryId,
    setStateId,
    setCityId,
  } = useClinicSearch();

  const [modalType, setModalType] = useState<'country' | 'state' | 'city' | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdClinicId, setCreatedClinicId] = useState<number | null>(null);
  const [isVerifyingRole, setIsVerifyingRole] = useState(false);
  const [roleVerificationError, setRoleVerificationError] = useState<string | null>(null);

  const { control, handleSubmit } = useForm<ClinicFormValues>({
    defaultValues: {
      clinic_name: '',
      clinic_address: '',
      clinic_phone_number: '',
      clinic_description: '',
    },
  });

  const selectedCountry = countries.find((item) => item.country_id === countryId);
  const selectedState = states.find((item) => item.state_id === stateId);
  const selectedCity = cities.find((item) => item.city_id === cityId);

  const countryOptions: SelectOption[] = countries.map((item) => ({
    label: item.country_name,
    value: item.country_id,
  }));
  const stateOptions: SelectOption[] = states.map((item) => ({
    label: item.state_name,
    value: item.state_id,
  }));
  const cityOptions: SelectOption[] = cities.map((item) => ({
    label: item.city_name,
    value: item.city_id,
  }));

  /**
   * Verifica que la nueva clínica aparezca en las membresías administrativas del backend,
   * confirma el rol de Owner y realiza la transición al Modo Administrador (Deliverable E).
   * NO repite el POST de creación.
   */
  const verifyRoleAndTransition = useCallback(
    async (clinicId: number) => {
      setIsVerifyingRole(true);
      setRoleVerificationError(null);
      try {
        const verifiedClinics = await refreshRoleAccess();
        if (!isAuthenticated) return;
        const createdClinic = (Array.isArray(verifiedClinics) ? verifiedClinics : []).find(
          (c) => c.clinic_id === clinicId
        );

        if (!createdClinic) {
          setRoleVerificationError(
            'La clínica fue creada correctamente, pero aún no se refleja en tus membresías de administración. Reintenta la verificación de acceso.'
          );
          return;
        }

        if (createdClinic.role_within_clinic !== 'Owner') {
          setRoleVerificationError(
            'La clínica fue creada, pero tu rol reportado no es Propietario. Reintenta la verificación.'
          );
          return;
        }

        // 1. Membresía de propietario verificada.
        // 2. Seleccionar modo administrador solo tras refresco exitoso.
        setActiveMode('admin');
        // 3. Redirigir a través del enrutador central '/' hacia el Administrator Home.
        router.replace('/' as any);
      } catch (err: any) {
        if (
          err?.message?.includes('canceled') ||
          err?.message?.includes('invalidated') ||
          err?.message?.includes('superseded') ||
          !isAuthenticated
        ) {
          return;
        }
        setRoleVerificationError(
          err?.message || 'Error al verificar las membresías de administración tras la creación.'
        );
      } finally {
        setIsVerifyingRole(false);
      }
    },
    [refreshRoleAccess, setActiveMode, router, isAuthenticated]
  );

  const onSubmit = async (data: ClinicFormValues) => {
    if (!cityId) {
      setSubmitError('Selecciona una ciudad para registrar la clínica.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const response = await clinicsApi.createClinic({ ...data, clinic_city_id: cityId });
      const newClinicId = response.clinic_id;
      setCreatedClinicId(newClinicId);
      // Iniciar inmediatamente la verificación de membresía y transición de rol
      await verifyRoleAndTransition(newClinicId);
    } catch (error: any) {
      setSubmitError(error?.message || 'No se pudo crear la clínica.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetryVerification = useCallback(() => {
    if (createdClinicId !== null) {
      verifyRoleAndTransition(createdClinicId);
    }
  }, [createdClinicId, verifyRoleAndTransition]);

  return {
    router,
    isAuthenticated,
    control,
    handleSubmit,
    isSubmitting,
    submitError,
    createdClinicId,
    isVerifyingRole,
    roleVerificationError,
    handleRetryVerification,
    modalType,
    setModalType,
    countryId,
    stateId,
    cityId,
    setCountryId,
    setStateId,
    setCityId,
    selectedCountry,
    selectedState,
    selectedCity,
    countryOptions,
    stateOptions,
    cityOptions,
    onSubmit,
  };
}

export default useCreateClinic;
