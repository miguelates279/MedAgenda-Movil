import React from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Field, ScreenHeader, SelectModal } from '../../components';
import { useCreateClinic } from './useCreateClinic';

export function CreateClinicScreen() {
  const {
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
  } = useCreateClinic();

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScreenHeader title="Nueva clínica" />
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <View className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 items-center justify-center mb-3">
            <Ionicons name="lock-closed-outline" size={26} color="#b45309" />
          </View>
          <Text className="text-base font-bold text-neutral-900 text-center mb-2">
            Inicio de sesión requerido
          </Text>
          <Text className="text-xs text-gray-600 text-center max-w-[260px] mb-4">
            Debes iniciar sesión con una cuenta autorizada para registrar una nueva clínica.
          </Text>
          <Button text="Volver" onPress={() => router.back()} className="min-w-[160px]" />
        </View>
      </SafeAreaView>
    );
  }

  if (createdClinicId !== null) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScreenHeader title="Nueva clínica" canGoBack={false} />
        <View className="flex-1 items-center justify-center px-6 bg-gray-50">
          <View className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 items-center justify-center mb-4">
            <Ionicons name="checkmark-circle" size={36} color="#059669" />
          </View>
          <Text className="text-xl font-bold text-neutral-900 text-center">
            ¡Clínica creada correctamente!
          </Text>
          <Text className="text-sm text-gray-600 text-center mt-2">
            La clínica ya fue registrada y está disponible en el catálogo de sedes.
          </Text>
          <Text className="text-xs text-gray-400 text-center mt-2">
            Identificador: #{createdClinicId}
          </Text>
          <Button
            text="Ver clínicas"
            onPress={() => router.replace('/clinics' as any)}
            className="mt-6 w-full max-w-xs"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Nueva clínica" />

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="p-4 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-xs text-gray-600 mb-4">
          Completa la información básica de la clínica y su ubicación geográfica.
        </Text>

        {submitError ? (
          <View className="bg-red-50 border border-red-200 p-3 mb-4 rounded-md">
            <Text className="text-red-700 text-xs font-medium">{submitError}</Text>
          </View>
        ) : null}

        <Field
          control={control}
          name="clinic_name"
          label="Nombre de la clínica *"
          placeholder="Centro Médico Santa Fe"
          rules={{
            required: 'El nombre es obligatorio',
            minLength: { value: 3, message: 'Mínimo 3 caracteres' },
            maxLength: { value: 30, message: 'Máximo 30 caracteres' },
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
          placeholder="Información adicional o servicios ofrecidos"
          multiline
          numberOfLines={4}
        />

        <Text className="text-xs font-semibold mb-1 text-gray-700">Ubicación Geográfica *</Text>
        <Pressable
          className="border border-gray-300 rounded-md px-3 py-2.5 mb-2.5 bg-white active:bg-gray-50"
          onPress={() => setModalType('country')}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar país"
        >
          <Text className="text-[11px] text-gray-600 font-medium uppercase">País</Text>
          <Text className="text-sm text-neutral-900 mt-0.5">
            {selectedCountry?.country_name || 'Selecciona un país'}
          </Text>
        </Pressable>

        <Pressable
          className={`border rounded-md px-3 py-2.5 mb-2.5 ${
            countryId ? 'border-gray-300 bg-white active:bg-gray-50' : 'border-gray-200 bg-gray-100'
          }`}
          onPress={() => countryId && setModalType('state')}
          disabled={!countryId}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar departamento o estado"
        >
          <Text className="text-[11px] text-gray-600 font-medium uppercase">Estado / Depto</Text>
          <Text className={`text-sm mt-0.5 ${countryId ? 'text-neutral-900' : 'text-gray-400'}`}>
            {selectedState?.state_name || 'Selecciona un estado'}
          </Text>
        </Pressable>

        <Pressable
          className={`border rounded-md px-3 py-2.5 mb-4 ${
            stateId ? 'border-gray-300 bg-white active:bg-gray-50' : 'border-gray-200 bg-gray-100'
          }`}
          onPress={() => stateId && setModalType('city')}
          disabled={!stateId}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar ciudad"
        >
          <Text className="text-[11px] text-gray-600 font-medium uppercase">Ciudad</Text>
          <Text className={`text-sm mt-0.5 ${stateId ? 'text-neutral-900' : 'text-gray-400'}`}>
            {selectedCity?.city_name || 'Selecciona una ciudad'}
          </Text>
        </Pressable>

        <Button
          text={isSubmitting ? 'Guardando...' : 'Crear Clínica'}
          onPress={handleSubmit(onSubmit)}
          loading={isSubmitting}
          className="mt-2"
        />

        <SelectModal
          title="Selecciona un país"
          items={countryOptions}
          selectedValue={countryId}
          isOpen={modalType === 'country'}
          onClose={() => setModalType(null)}
          onSelect={(selected) => {
            setCountryId(selected);
            setModalType(null);
          }}
        />

        <SelectModal
          title="Selecciona un estado"
          items={stateOptions}
          selectedValue={stateId}
          isOpen={modalType === 'state'}
          onClose={() => setModalType(null)}
          onSelect={(selected) => {
            setStateId(selected);
            setModalType(null);
          }}
        />

        <SelectModal
          title="Selecciona una ciudad"
          items={cityOptions}
          selectedValue={cityId}
          isOpen={modalType === 'city'}
          onClose={() => setModalType(null)}
          onSelect={(selected) => {
            setCityId(selected);
            setModalType(null);
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

export default CreateClinicScreen;
