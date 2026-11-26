import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import type { UseFormReturn } from 'react-hook-form';
import {
  Button,
  Card,
  ClayPressable,
  Field,
  SelectModal,
} from '../../../components';
import clinicsApi from '../../../api/clinics';
import apiClient from '../../../api/client';
import type {
  City,
  ClinicManagement,
  Country,
  Specialty,
  State,
} from '../../../api/types';
import type { ClinicEditorValues } from '../clinicManagement';

interface Props {
  form: UseFormReturn<ClinicEditorValues>;
  specialties: Specialty[];
  disabled?: boolean;
  initialLocation?: ClinicManagement | null;
}

export function ClinicEditorFields({
  form,
  specialties,
  disabled = false,
  initialLocation,
}: Props) {
  const { control, watch, setValue } = form;
  const countryId = watch('country_id');
  const stateId = watch('state_id');
  const cityId = watch('clinic_city_id');
  const isOpen = watch('is_open');
  const hasBreak = watch('break_enabled');
  const specialtyIds = watch('specialty_ids');
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [modal, setModal] = useState<
    'country' | 'state' | 'city' | 'specialty' | null
  >(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    let active = true;
    const session = apiClient.getSessionId();
    setLoadingCountries(true);
    setLocationError(null);
    clinicsApi
      .getCountries()
      .then((data) => {
        if (active && session === apiClient.getSessionId()) setCountries(data);
      })
      .catch((cause) => {
        if (active && session === apiClient.getSessionId())
          setLocationError(
            cause?.message || 'No se pudieron cargar los países.',
          );
      })
      .finally(() => {
        if (active && session === apiClient.getSessionId())
          setLoadingCountries(false);
      });
    return () => {
      active = false;
    };
  }, [retry]);

  useEffect(() => {
    let active = true;
    const session = apiClient.getSessionId();
    setStates([]);
    if (!countryId) {
      setLoadingStates(false);
      return;
    }
    setLoadingStates(true);
    clinicsApi
      .getStates(countryId)
      .then((data) => {
        if (active && session === apiClient.getSessionId()) setStates(data);
      })
      .catch((cause) => {
        if (active && session === apiClient.getSessionId())
          setLocationError(
            cause?.message || 'No se pudieron cargar los departamentos.',
          );
      })
      .finally(() => {
        if (active && session === apiClient.getSessionId())
          setLoadingStates(false);
      });
    return () => {
      active = false;
    };
  }, [countryId, retry]);

  useEffect(() => {
    let active = true;
    const session = apiClient.getSessionId();
    setCities([]);
    if (!stateId) {
      setLoadingCities(false);
      return;
    }
    setLoadingCities(true);
    clinicsApi
      .getCities(stateId)
      .then((data) => {
        if (active && session === apiClient.getSessionId()) setCities(data);
      })
      .catch((cause) => {
        if (active && session === apiClient.getSessionId())
          setLocationError(
            cause?.message || 'No se pudieron cargar las ciudades.',
          );
      })
      .finally(() => {
        if (active && session === apiClient.getSessionId())
          setLoadingCities(false);
      });
    return () => {
      active = false;
    };
  }, [stateId, retry]);

  const location = [
    {
      key: 'country' as const,
      label: 'País',
      value:
        countries.find((item) => item.country_id === countryId)?.country_name ||
        (initialLocation?.country_id === countryId
          ? initialLocation.country_name
          : 'Selecciona un país'),
      enabled: true,
    },
    {
      key: 'state' as const,
      label: 'Departamento o estado',
      value:
        states.find((item) => item.state_id === stateId)?.state_name ||
        (initialLocation?.state_id === stateId
          ? initialLocation.state_name
          : 'Selecciona un departamento'),
      enabled: !!countryId,
    },
    {
      key: 'city' as const,
      label: 'Ciudad',
      value:
        cities.find((item) => item.city_id === cityId)?.city_name ||
        (initialLocation?.clinic_city_id === cityId
          ? initialLocation.city_name
          : 'Selecciona una ciudad'),
      enabled: !!stateId,
    },
  ];
  return (
    <>
      <Card className="mb-4">
        <Text className="text-base font-bold text-med-text-main mb-3">
          Datos de la clínica
        </Text>
        <Field
          control={control}
          name="clinic_name"
          label="Nombre de la clínica *"
          placeholder="Centro Médico Santa Fe"
          editable={!disabled}
          rules={{
            required: 'El nombre es obligatorio.',
            maxLength: { value: 25, message: 'Máximo 25 caracteres.' },
            validate: (value) => !!value.trim() || 'El nombre es obligatorio.',
          }}
        />
        <Field
          control={control}
          name="clinic_address"
          label="Dirección *"
          placeholder="Calle 10 # 20-30"
          editable={!disabled}
          rules={{
            required: 'La dirección es obligatoria.',
            maxLength: { value: 30, message: 'Máximo 30 caracteres.' },
            validate: (value) =>
              !!value.trim() || 'La dirección es obligatoria.',
          }}
        />
        <Field
          control={control}
          name="clinic_phone_number"
          label="Teléfono *"
          placeholder="+573001234567"
          keyboardType="phone-pad"
          autoCapitalize="none"
          editable={!disabled}
          rules={{
            required: 'El teléfono es obligatorio.',
            pattern: {
              value: /^\+[1-9]\d{7,14}$/,
              message: 'Usa formato internacional, por ejemplo +573001234567.',
            },
          }}
        />
        <Field
          control={control}
          name="clinic_description"
          label="Descripción"
          placeholder="Información o servicios ofrecidos"
          multiline
          numberOfLines={4}
          editable={!disabled}
        />
        {location.map((item) => (
          <ClayPressable
            key={item.key}
            onPress={() => setModal(item.key)}
            disabled={disabled || !item.enabled}
            accessibilityRole="button"
            accessibilityLabel={`Seleccionar ${item.label.toLowerCase()} de la clínica`}
            accessibilityState={{ disabled: disabled || !item.enabled }}
            className={`min-h-touch max-w-full rounded-control border border-med-border bg-med-bg p-3 mb-3 ${disabled || !item.enabled ? 'opacity-50' : ''}`}
          >
            <Text className="text-xs font-semibold text-med-text-muted">
              {item.label} *
            </Text>
            <Text className="text-sm text-med-text-main mt-1">
              {item.value}
            </Text>
          </ClayPressable>
        ))}
        {locationError && (
          <View className="mb-3">
            <Text className="text-xs text-med-error-text mb-2">
              {locationError}
            </Text>
            <Button
              text="Reintentar ubicaciones"
              variant="secondary"
              disabled={disabled}
              onPress={() => setRetry((value) => value + 1)}
            />
          </View>
        )}
        <ClayPressable
          onPress={() => setModal('specialty')}
          disabled={disabled}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar especialidades de la clínica"
          className="min-h-touch max-w-full rounded-control border border-med-border bg-med-bg p-3"
        >
          <Text className="text-xs font-semibold text-med-text-muted">
            Especialidades ofrecidas
          </Text>
          <Text className="text-sm text-med-text-main mt-1">
            {specialtyIds.length
              ? specialties
                  .filter((item) => specialtyIds.includes(item.specialty_id))
                  .map((item) => item.specialty_name)
                  .join(', ')
              : 'Sin especialidades seleccionadas'}
          </Text>
        </ClayPressable>
      </Card>
      <Card className="mb-4">
        <Text className="text-base font-bold text-med-text-main mb-2">
          Horario de atención
        </Text>
        <Text className="text-xs text-med-text-muted mb-3">
          De lunes a viernes, en hora de Colombia. Las nuevas reservas requieren
          al menos 1 hora de anticipación.
        </Text>
        <View className="gap-2 mb-4">
          {[
            { value: false, label: 'Clínica cerrada' },
            { value: true, label: 'Clínica abierta' },
          ].map((option) => (
            <ClayPressable
              key={option.label}
              onPress={() =>
                setValue('is_open', option.value, { shouldDirty: true })
              }
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{
                checked: isOpen === option.value,
                disabled,
              }}
              accessibilityLabel={option.label}
              className={`min-h-touch max-w-full rounded-control border p-3 ${isOpen === option.value ? 'bg-med-primary-surface border-med-primary' : 'bg-med-bg border-med-border'}`}
            >
              <Text className="text-sm text-med-text-main">{option.label}</Text>
            </ClayPressable>
          ))}
        </View>
        <Text className="text-xs text-med-text-muted mb-3">
          Al cerrar se detienen las nuevas reservas; las citas existentes
          conservan su horario.
        </Text>
        <Field
          control={control}
          name="clinic_opening_time"
          label="Apertura (HH:mm) *"
          placeholder="08:00"
          autoCapitalize="none"
          editable={!disabled}
          rules={{ required: 'Indica la apertura.' }}
        />
        <Field
          control={control}
          name="clinic_close_time"
          label="Cierre (HH:mm) *"
          placeholder="18:00"
          autoCapitalize="none"
          editable={!disabled}
          rules={{ required: 'Indica el cierre.' }}
        />
        <Field
          control={control}
          name="clinic_average_appointment_time"
          label="Duración de las nuevas citas (minutos) *"
          placeholder="30"
          keyboardType="number-pad"
          editable={!disabled}
          rules={{ required: 'Indica la duración.' }}
        />
        <View className="gap-2 mb-4">
          {[
            { value: false, label: 'Sin descanso' },
            { value: true, label: 'Con descanso' },
          ].map((option) => (
            <ClayPressable
              key={option.label}
              onPress={() =>
                setValue('break_enabled', option.value, { shouldDirty: true })
              }
              disabled={disabled}
              accessibilityRole="radio"
              accessibilityState={{
                checked: hasBreak === option.value,
                disabled,
              }}
              accessibilityLabel={option.label}
              className={`min-h-touch max-w-full rounded-control border p-3 ${hasBreak === option.value ? 'bg-med-primary-surface border-med-primary' : 'bg-med-bg border-med-border'}`}
            >
              <Text className="text-sm text-med-text-main">{option.label}</Text>
            </ClayPressable>
          ))}
        </View>
        {hasBreak && (
          <>
            <Field
              control={control}
              name="clinic_break_time"
              label="Inicio del descanso (HH:mm) *"
              placeholder="12:00"
              autoCapitalize="none"
              editable={!disabled}
              rules={{ required: 'Indica el inicio del descanso.' }}
            />
            <Field
              control={control}
              name="clinic_break_duration"
              label="Duración del descanso (minutos) *"
              placeholder="60"
              keyboardType="number-pad"
              editable={!disabled}
              rules={{ required: 'Indica la duración del descanso.' }}
            />
          </>
        )}
        <Text className="text-xs text-med-text-muted">
          Los cambios de duración se aplican a nuevas reservas y
          reprogramaciones. La duración guardada de las citas existentes se
          conserva.
        </Text>
      </Card>
      <SelectModal
        title="País de la clínica"
        isOpen={modal === 'country'}
        onClose={() => setModal(null)}
        items={countries.map((item) => ({
          label: item.country_name,
          value: item.country_id,
        }))}
        loading={loadingCountries}
        selectedValue={countryId}
        onSelect={(value) => {
          if (disabled) return;
          setValue('country_id', value, { shouldDirty: true });
          setValue('state_id', null, { shouldDirty: true });
          setValue('clinic_city_id', null, { shouldDirty: true });
        }}
      />
      <SelectModal
        title="Departamento de la clínica"
        isOpen={modal === 'state'}
        onClose={() => setModal(null)}
        items={states.map((item) => ({
          label: item.state_name,
          value: item.state_id,
        }))}
        loading={loadingStates}
        selectedValue={stateId}
        onSelect={(value) => {
          if (disabled) return;
          setValue('state_id', value, { shouldDirty: true });
          setValue('clinic_city_id', null, { shouldDirty: true });
        }}
      />
      <SelectModal
        title="Ciudad de la clínica"
        isOpen={modal === 'city'}
        onClose={() => setModal(null)}
        items={cities.map((item) => ({
          label: item.city_name,
          value: item.city_id,
        }))}
        loading={loadingCities}
        selectedValue={cityId}
        onSelect={(value) => {
          if (!disabled)
            setValue('clinic_city_id', value, { shouldDirty: true });
        }}
      />
      <SelectModal
        title="Especialidades de la clínica"
        isOpen={modal === 'specialty'}
        onClose={() => setModal(null)}
        multiple
        items={specialties.map((item) => ({
          label: item.specialty_name,
          value: item.specialty_id,
        }))}
        selectedValue={specialtyIds}
        onSelect={(value) => {
          if (!disabled)
            setValue('specialty_ids', value, { shouldDirty: true });
        }}
      />
    </>
  );
}
