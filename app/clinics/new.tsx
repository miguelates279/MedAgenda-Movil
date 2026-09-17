import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { Button, Field, SelectModal, SelectOption } from '../../src/components';
import clinicsApi from '../../src/api/clinics';
import { CreateClinicDto } from '../../src/api/types';
import { useAuth } from '../../src/context/AuthContext';
import { useClinicSearch } from '../../src/hooks/useClinicSearch';

type ClinicFormValues = Omit<CreateClinicDto, 'clinic_city_id'>;

export default function NewClinicScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { countries, states, cities, countryId, stateId, cityId, setCountryId, setStateId, setCityId } =
    useClinicSearch();
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

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-6">
        <Text className="text-base font-semibold text-neutral-900 text-center">
          Debes iniciar sesión para crear una clínica.
        </Text>
        <Button text="Volver" onPress={() => router.back()} className="mt-4" />
      </SafeAreaView>
    );
  }

  if (createdClinicId !== null) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
          <Text className="text-lg font-bold text-neutral-900">Nueva clínica</Text>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-4">
            <Text className="text-3xl text-green-700">✓</Text>
          </View>
          <Text className="text-xl font-bold text-neutral-900 text-center">
            ¡Clínica creada correctamente!
          </Text>
          <Text className="text-sm text-gray-600 text-center mt-2">
            La clínica ya fue registrada y está disponible en el listado.
          </Text>
          <Text className="text-xs text-gray-400 text-center mt-2">
            Identificador: {createdClinicId}
          </Text>
          <Button
            text="Ver clínicas"
            onPress={() => router.replace('/clinics' as any)}
            className="mt-6 w-full"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="py-1 pr-3" activeOpacity={0.7}>
          <Text className="text-primary text-sm font-semibold">← Volver</Text>
        </TouchableOpacity>
        <Text className="text-lg font-bold text-neutral-900">Nueva clínica</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text className="text-sm text-gray-600 mb-4">
          Completa la información básica de la clínica y su ubicación.
        </Text>

        {submitError ? (
          <View className="bg-red-50 border border-red-200 p-3 mb-4 rounded-md">
            <Text className="text-red-700 text-sm">{submitError}</Text>
          </View>
        ) : null}

        <Field
          control={control}
          name="clinic_name"
          label="Nombre de la clínica *"
          placeholder="Clínica Central"
          rules={{
            required: 'El nombre es obligatorio',
            maxLength: { value: 25, message: 'Máximo 25 caracteres' },
          }}
        />
        <Field
          control={control}
          name="clinic_address"
          label="Dirección *"
          placeholder="Calle 10 # 20-30"
          rules={{
            required: 'La dirección es obligatoria',
            maxLength: { value: 30, message: 'Máximo 30 caracteres' },
          }}
        />
        <Field
          control={control}
          name="clinic_phone_number"
          label="Teléfono *"
          placeholder="+50378901234"
          keyboardType="phone-pad"
          autoCapitalize="none"
          rules={{
            required: 'El teléfono es obligatorio',
            pattern: {
              value: /^\+[1-9]\d{7,14}$/,
              message: 'Usa formato internacional, por ejemplo +50378901234',
            },
          }}
        />
        <Field
          control={control}
          name="clinic_description"
          label="Descripción"
          placeholder="Información adicional"
          multiline
          numberOfLines={4}
        />

        <Text className="text-sm font-medium mb-1 text-gray-700">Ubicación *</Text>
        <TouchableOpacity
          className="border border-gray-300 rounded-md px-3 py-2 mb-2 bg-white"
          onPress={() => setModalType('country')}
          activeOpacity={0.7}
        >
          <Text className="text-[11px] text-gray-600 font-medium uppercase">País</Text>
          <Text className="text-sm text-neutral-900 mt-0.5">
            {selectedCountry?.country_name || 'Selecciona un país'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`border rounded-md px-3 py-2 mb-2 bg-white ${
            countryId ? 'border-gray-300' : 'border-gray-200 bg-gray-100'
          }`}
          onPress={() => countryId && setModalType('state')}
          disabled={!countryId}
          activeOpacity={0.7}
        >
          <Text className="text-[11px] text-gray-600 font-medium uppercase">Estado / Depto</Text>
          <Text className={`text-sm mt-0.5 ${countryId ? 'text-neutral-900' : 'text-gray-400'}`}>
            {selectedState?.state_name || 'Selecciona un estado'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`border rounded-md px-3 py-2 mb-4 bg-white ${
            stateId ? 'border-gray-300' : 'border-gray-200 bg-gray-100'
          }`}
          onPress={() => stateId && setModalType('city')}
          disabled={!stateId}
          activeOpacity={0.7}
        >
          <Text className="text-[11px] text-gray-600 font-medium uppercase">Ciudad</Text>
          <Text className={`text-sm mt-0.5 ${stateId ? 'text-neutral-900' : 'text-gray-400'}`}>
            {selectedCity?.city_name || 'Selecciona una ciudad'}
          </Text>
        </TouchableOpacity>

        <Button
          text={isSubmitting ? 'Guardando...' : 'Crear clínica'}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          disabled={isSubmitting}
        />
      </ScrollView>

      <SelectModal
        title="Selecciona un país"
        items={countryOptions}
        selectedValue={countryId}
        isOpen={modalType === 'country'}
        onClose={() => setModalType(null)}
        onSelect={setCountryId}
      />
      <SelectModal
        title="Selecciona un estado"
        items={stateOptions}
        selectedValue={stateId}
        isOpen={modalType === 'state'}
        onClose={() => setModalType(null)}
        onSelect={setStateId}
      />
      <SelectModal
        title="Selecciona una ciudad"
        items={cityOptions}
        selectedValue={cityId}
        isOpen={modalType === 'city'}
        onClose={() => setModalType(null)}
        onSelect={setCityId}
      />
    </SafeAreaView>
  );
}
