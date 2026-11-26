import React from 'react';
import { ActivityIndicator, Text, View, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Field,
  KeyboardAwareScrollView,
  ScreenHeader,
  SelectModal,
} from '../../components';
import { useCreateClinic } from './useCreateClinic';
import { ClaySurface, ClayPressable } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';

export function CreateClinicScreen() {
  const {
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
  } = useCreateClinic();

  if (!isAuthenticated) {
    return (
      <View className="min-w-0 max-w-full flex-1 bg-med-bg">
        <ScreenHeader title="Nueva clínica" />
        <ScrollView
          className="min-w-0 max-w-full flex-1 bg-med-surface"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: tokens.spacing.lg,
          }}
        >
          <ClaySurface
            depth="badge"
            className="w-14 h-14 rounded-full bg-med-warning-bg border border-med-warning-border items-center justify-center mb-3"
          >
            <Ionicons
              name="lock-closed-outline"
              size={tokens.iconSize[26]}
              color={tokens.colors.warning.badgeText}
            />
          </ClaySurface>
          <Text className="text-base font-bold text-med-text-main text-center mb-2">
            Inicio de sesión requerido
          </Text>
          <Text className="text-xs text-med-text-muted text-center max-w-copy-sm mb-4">
            Debes iniciar sesión con una cuenta autorizada para registrar una
            nueva clínica.
          </Text>
          <Button
            text="Volver"
            onPress={() => router.back()}
            className="min-w-action-sm"
          />
        </ScrollView>
      </View>
    );
  }

  if (createdClinicId !== null) {
    return (
      <View className="min-w-0 max-w-full flex-1 bg-med-bg">
        <ScreenHeader title="Nueva clínica" canGoBack={false} />
        {isVerifyingRole ? (
          <ScrollView
            className="min-w-0 max-w-full flex-1 bg-med-surface"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: tokens.spacing.lg,
            }}
          >
            <ActivityIndicator
              size={tokens.indicator.lg}
              color={tokens.colors.primary}
              className="mb-4"
            />
            <Text className="text-lg font-bold text-med-text-main text-center">
              Verificando permisos de administración...
            </Text>
            <Text className="text-xs text-med-text-muted text-center mt-2 max-w-xs leading-relaxed">
              Tu clínica #{createdClinicId} fue creada con éxito. Estamos
              confirmando tu rol de Propietario para habilitar el Modo
              Administrador.
            </Text>
          </ScrollView>
        ) : (
          <ScrollView
            className="min-w-0 max-w-full flex-1 bg-med-surface"
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: 'center',
              alignItems: 'center',
              padding: tokens.spacing.lg,
            }}
          >
            <ClaySurface
              depth="badge"
              className="w-16 h-16 rounded-full bg-med-success-bg border border-med-success-border items-center justify-center mb-3"
            >
              <Ionicons
                name="checkmark-circle"
                size={tokens.iconSize[36]}
                color={tokens.colors.success.accent}
              />
            </ClaySurface>
            <Text className="text-xl font-bold text-med-text-main text-center">
              ¡Clínica creada correctamente!
            </Text>
            <Text className="text-xs text-med-text-soft text-center mt-1">
              Identificador asignado: #{createdClinicId}
            </Text>

            {roleVerificationError ? (
              <ClaySurface className="w-full max-w-xs bg-med-warning-bg border border-med-warning-border rounded-clay p-3.5 mt-4 mb-4">
                <View className="flex-row items-center mb-1">
                  <Ionicons
                    name="alert-circle-outline"
                    size={tokens.iconSize[16]}
                    color={tokens.colors.warning.badgeText}
                  />
                  <Text className="min-w-0 max-w-full shrink text-xs font-bold text-med-warning-text ml-1.5">
                    Verificación de rol pendiente
                  </Text>
                </View>
                <Text className="text-xs text-med-warning-text leading-relaxed">
                  {roleVerificationError}
                </Text>
              </ClaySurface>
            ) : null}

            <View className="w-full max-w-xs gap-3 mt-4">
              <Button
                text="Reintentar verificación de acceso"
                onPress={handleRetryVerification}
                loading={isVerifyingRole}
                disabled={isVerifyingRole}
                className="w-full"
              />
              <Button
                text="Ir al inicio"
                variant="outline"
                onPress={() => router.replace('/' as any)}
                className="w-full"
              />
            </View>
          </ScrollView>
        )}
      </View>
    );
  }

  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <ScreenHeader title="Nueva clínica" />

      <KeyboardAwareScrollView
        className="min-w-0 max-w-full flex-1 bg-med-surface"
        contentContainerClassName="p-4 pb-16"
      >
        <Text className="text-xs text-med-text-muted mb-4">
          Completa la información básica de la clínica y su ubicación
          geográfica.
        </Text>

        {submitError ? (
          <ClaySurface className="bg-med-error-bg border border-med-error-border p-3 mb-4 rounded-clay">
            <Text className="text-med-error-badge-text text-xs font-medium">
              {submitError}
            </Text>
          </ClaySurface>
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

        <Text className="text-xs font-semibold mb-1 text-med-text-strong">
          Ubicación Geográfica *
        </Text>
        <ClayPressable
          className="min-h-touch max-w-full border border-med-border rounded-control px-3 py-2.5 mb-2.5 bg-med-bg active:bg-med-surface"
          onPress={() => setModalType('country')}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar país"
        >
          <Text className="text-xs text-med-text-muted font-semibold uppercase">
            País
          </Text>
          <Text className="text-sm text-med-text-main mt-0.5">
            {selectedCountry?.country_name || 'Selecciona un país'}
          </Text>
        </ClayPressable>

        <ClayPressable
          className={`min-h-touch max-w-full border rounded-control px-3 py-2.5 mb-2.5 ${
            countryId
              ? 'border-med-border bg-med-bg active:bg-med-surface'
              : 'border-med-border-light bg-med-surface-muted'
          }`}
          onPress={() => countryId && setModalType('state')}
          disabled={!countryId}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar departamento o estado"
        >
          <Text className="text-xs text-med-text-muted font-semibold uppercase">
            Estado / Depto
          </Text>
          <Text
            className={`text-sm mt-0.5 ${countryId ? 'text-med-text-main' : 'text-med-text-light'}`}
          >
            {selectedState?.state_name || 'Selecciona un estado'}
          </Text>
        </ClayPressable>

        <ClayPressable
          className={`min-h-touch max-w-full border rounded-control px-3 py-2.5 mb-4 ${
            stateId
              ? 'border-med-border bg-med-bg active:bg-med-surface'
              : 'border-med-border-light bg-med-surface-muted'
          }`}
          onPress={() => stateId && setModalType('city')}
          disabled={!stateId}
          accessibilityRole="button"
          accessibilityLabel="Seleccionar ciudad"
        >
          <Text className="text-xs text-med-text-muted font-semibold uppercase">
            Ciudad
          </Text>
          <Text
            className={`text-sm mt-0.5 ${stateId ? 'text-med-text-main' : 'text-med-text-light'}`}
          >
            {selectedCity?.city_name || 'Selecciona una ciudad'}
          </Text>
        </ClayPressable>

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
      </KeyboardAwareScrollView>
    </View>
  );
}

export default CreateClinicScreen;
