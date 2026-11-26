import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import {
  Button,
  Card,
  KeyboardAwareScrollView,
  ScreenHeader,
} from '../../components';
import { tokens } from '../../theme/tokens';
import { useCreateClinic } from './useCreateClinic';
import { ClinicEditorFields } from './components/ClinicEditorFields';

export function CreateClinicScreen() {
  const state = useCreateClinic();
  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <ScreenHeader title="Nueva clínica" />
      <KeyboardAwareScrollView
        className="min-w-0 max-w-full flex-1"
        contentContainerClassName="p-4 pb-16"
      >
        {!state.isAuthenticated ? (
          <Card>
            <Text className="text-sm text-med-text-main mb-3">
              Debes iniciar sesión para registrar una clínica.
            </Text>
            <Button
              text="Volver al inicio"
              onPress={() => state.router.replace('/' as any)}
            />
          </Card>
        ) : state.createdClinicId !== null ? (
          <Card>
            <Text className="text-lg font-bold text-med-text-main mb-3">
              Clínica creada correctamente
            </Text>
            {state.isVerifyingRole ? (
              <>
                <ActivityIndicator
                  color={tokens.colors.primary}
                  size={tokens.indicator.lg}
                />
                <Text className="text-sm text-med-text-muted mt-3">
                  Verificando tu acceso como propietario...
                </Text>
              </>
            ) : (
              <>
                <Text className="text-sm text-med-text-muted mb-3">
                  {state.roleVerificationError ||
                    'Abre la administración para revisar los datos y el equipo de tu clínica.'}
                </Text>
                <Button
                  text="Reintentar verificación de acceso"
                  onPress={state.handleRetryVerification}
                  disabled={state.isVerifyingRole}
                />
                <Button
                  text="Volver al inicio"
                  variant="outline"
                  onPress={() => state.router.replace('/' as any)}
                  className="mt-3"
                />
              </>
            )}
          </Card>
        ) : (
          <>
            <Text className="text-sm text-med-text-muted mb-4">
              Completa los datos, la ubicación y el horario. Elige si la clínica
              quedará abierta para recibir reservas.
            </Text>
            {state.submitError && (
              <Card className="mb-4 bg-med-error-bg border-med-error-border">
                <Text className="text-sm text-med-error-text mb-3">
                  {state.submitError}
                </Text>
                <Button
                  text="Reintentar especialidades"
                  variant="secondary"
                  onPress={state.retrySpecialties}
                  disabled={state.isSubmitting}
                />
              </Card>
            )}
            <ClinicEditorFields
              form={state.form}
              specialties={state.specialties}
              disabled={state.isSubmitting}
            />
            <Button
              text="Crear clínica"
              onPress={state.form.handleSubmit(state.onSubmit)}
              disabled={state.isSubmitting}
              loading={state.isSubmitting}
            />
          </>
        )}
      </KeyboardAwareScrollView>
    </View>
  );
}

export default CreateClinicScreen;
