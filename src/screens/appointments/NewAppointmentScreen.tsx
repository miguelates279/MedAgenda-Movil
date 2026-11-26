import React from 'react';
import { ActivityIndicator, Text, View, ScrollView } from 'react-native';
import {
  Button,
  Card,
  Field,
  KeyboardAwareScrollView,
  ScreenHeader,
} from '../../components';
import { useNewAppointment } from './useNewAppointment';
import { AppointmentSchedulePicker } from './components/AppointmentSchedulePicker';
import { ClaySurface } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';

export function NewAppointmentScreen() {
  const appointmentForm = useNewAppointment();
  const {
    router,
    isAuthenticated,
    clinicId,
    doctorId,
    clinic,
    doctorFullName,
    doctorSpecialtyName,
    loadingDetails,
    control,
    handleSubmit,
    selectedSlot,
    submitting,
    scheduleError,
    onSubmit,
  } = appointmentForm;

  if (!isAuthenticated) {
    return (
      <View className="min-w-0 max-w-full flex-1 bg-med-bg">
        <ScreenHeader title="Nueva Cita Médica" />
        <ScrollView
          className="min-w-0 max-w-full flex-1 bg-med-surface"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: tokens.spacing.lg,
          }}
        >
          <Text className="text-5xl mb-3">🔒</Text>
          <Text className="text-lg font-bold text-med-text-main mb-2 text-center">
            Inicio de sesión requerido
          </Text>
          <Text className="text-sm text-med-text-soft text-center leading-5 max-w-copy">
            Debes iniciar sesión o crear una cuenta para poder agendar una cita
            médica.
          </Text>
          <Button
            text="Iniciar Sesión / Registrarse"
            onPress={() => router.push('/profile' as any)}
            className="mt-5 min-w-action-lg"
          />
        </ScrollView>
      </View>
    );
  }

  if (!clinicId || !doctorId) {
    return (
      <View className="min-w-0 max-w-full flex-1 bg-med-bg">
        <ScreenHeader title="Agendar Cita" />
        <ScrollView
          className="min-w-0 max-w-full flex-1 bg-med-surface"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: tokens.spacing.lg,
          }}
        >
          <Text className="text-5xl mb-3">🏥</Text>
          <Text className="text-lg font-bold text-med-text-main mb-2 text-center">
            Selecciona una Clínica y Especialista
          </Text>
          <Text className="text-sm text-med-text-soft text-center leading-5 max-w-copy-lg">
            Para agendar tu cita, utiliza el buscador de clínicas para encontrar
            tu centro médico y seleccionar el doctor disponible.
          </Text>
          <Button
            text="Ir al Buscador de Clínicas"
            onPress={() => router.replace('/clinics' as any)}
            className="mt-5 min-w-action-xl"
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <ScreenHeader title="Agendar Cita Médica" />

      <KeyboardAwareScrollView contentContainerClassName="p-4 pb-16">
        <Card className="mb-4 bg-med-primary-surface/70 border border-med-primary-border p-4">
          <Text className="text-xs font-bold text-med-primary-dark uppercase tracking-wider mb-2">
            Información de la Cita
          </Text>

          {loadingDetails ? (
            <ActivityIndicator
              size={tokens.indicator.sm}
              color={tokens.colors.primary}
              className="py-2"
            />
          ) : (
            <>
              <View className="flex-row items-start mb-2">
                <Text className="min-w-0 max-w-full shrink text-lg mr-2 mt-0.5">
                  🏢
                </Text>
                <View className="min-w-0 max-w-full flex-1">
                  <Text className="text-xs text-med-text-soft uppercase font-semibold">
                    Clínica
                  </Text>
                  <Text className="text-sm font-bold text-med-text-main">
                    {clinic?.clinic_name || `Clínica #${clinicId}`}
                  </Text>
                  {clinic?.clinic_address && (
                    <Text className="text-xs text-med-text-muted mt-0.5">
                      📍 {clinic.clinic_address}
                    </Text>
                  )}
                </View>
              </View>

              <View className="flex-row items-start border-t border-med-primary-border/70 pt-2 mt-1">
                <Text className="min-w-0 max-w-full shrink text-lg mr-2 mt-0.5">
                  👨‍⚕️
                </Text>
                <View className="min-w-0 max-w-full flex-1">
                  <Text className="text-xs text-med-text-soft uppercase font-semibold">
                    Especialista
                  </Text>
                  <Text className="text-sm font-bold text-med-text-main">
                    Dr(a). {doctorFullName}
                    <Text className="text-med-primary font-semibold">
                      {doctorSpecialtyName}
                    </Text>
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        <AppointmentSchedulePicker
          availability={appointmentForm}
          disabled={submitting}
        />

        {selectedSlot ? (
          <Card className="mb-4">
            <Text className="text-sm font-bold text-med-text-main mb-2">
              Motivo o Nota (Opcional)
            </Text>
            <Field
              control={control}
              name="appointment_description"
              label="Notas para el médico"
              placeholder="Ej. Control de rutina, dolor de cabeza, etc."
              multiline
              numberOfLines={3}
              className="mb-0"
            />
          </Card>
        ) : null}

        {scheduleError ? (
          <ClaySurface className="bg-med-error-bg border border-med-error-border p-2.5 rounded-clay mb-2.5">
            <Text className="text-med-error-text text-xs">{scheduleError}</Text>
          </ClaySurface>
        ) : null}

        <Button
          text={submitting ? 'Agendando cita...' : 'Confirmar y Guardar Cita'}
          onPress={handleSubmit(onSubmit)}
          loading={submitting}
          disabled={!selectedSlot || submitting}
          className="mt-2"
        />
      </KeyboardAwareScrollView>
    </View>
  );
}

export default NewAppointmentScreen;
