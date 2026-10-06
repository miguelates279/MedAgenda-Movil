import { useState } from 'react';
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
  const { isAuthenticated } = useAuth();
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

  const onSubmit = async (data: ClinicFormValues) => {
    if (!cityId) {
      setSubmitError('Selecciona una ciudad para registrar la clínica.');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const response = await clinicsApi.createClinic({ ...data, clinic_city_id: cityId });
      setCreatedClinicId(response.clinic_id);
    } catch (error: any) {
      setSubmitError(error.message || 'No se pudo crear la clínica.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    router,
    isAuthenticated,
    control,
    handleSubmit,
    isSubmitting,
    submitError,
    createdClinicId,
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
