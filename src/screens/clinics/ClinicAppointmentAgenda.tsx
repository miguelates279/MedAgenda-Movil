import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Button, Card } from '../../components';
import { AppointmentDispatchCard } from '../../components/AppointmentDispatchCard';
import { useClinicAppointmentAgenda } from './useClinicAppointmentAgenda';
import { groupAppointmentsByHour } from '../../utils/appointmentStatus';
import { tokens } from '../../theme/tokens';

export function ClinicAppointmentAgenda({ clinicId }: { clinicId: number }) {
  const {
    enabled,
    appointments,
    date,
    loading,
    error,
    load,
    pending,
    requestAction,
  } = useClinicAppointmentAgenda(clinicId);
  if (!enabled) return null;
  return (
    <View className="mb-5 min-w-0 max-w-full">
      <Card className="mb-3">
        <Text className="text-lg font-bold text-med-text-main">
          Recepción · Agenda de hoy
        </Text>
        <Text className="text-sm text-med-text-muted mt-1">
          {date} · Horario de Colombia
        </Text>
        <Text className="text-sm text-med-text-muted mt-2">
          Registra la llegada de los pacientes y llama a consulta. El médico
          inicia y finaliza la atención.
        </Text>
        <Button
          text="Actualizar agenda"
          variant="outline"
          loading={loading}
          disabled={!!pending}
          onPress={() => {
            void load();
          }}
          className="mt-3"
        />
      </Card>
      {error ? (
        <Card className="mb-3 border-med-error-border bg-med-error-bg">
          <Text className="text-sm text-med-error-badge-text">{error}</Text>
        </Card>
      ) : null}
      {loading && !appointments.length ? (
        <ActivityIndicator
          size={tokens.indicator.sm}
          color={tokens.colors.primary}
        />
      ) : null}
      {!loading && !error && !appointments.length ? (
        <Card className="mb-3">
          <Text className="text-sm text-med-text-muted">
            No hay citas registradas para hoy.
          </Text>
        </Card>
      ) : null}
      {groupAppointmentsByHour(appointments).map((section) => (
        <View key={section.title}>
          <Text className="text-sm font-bold text-med-text-main mb-2 mt-2">
            {section.title}
          </Text>
          {section.data.map((appointment) => (
            <AppointmentDispatchCard
              key={appointment.appointment_id}
              appointment={appointment}
              showDoctor
              pendingAction={
                pending?.appointmentId === appointment.appointment_id
                  ? pending.action
                  : null
              }
              disabled={loading || !!pending}
              onAction={(action) => requestAction(appointment, action)}
            />
          ))}
        </View>
      ))}
    </View>
  );
}
