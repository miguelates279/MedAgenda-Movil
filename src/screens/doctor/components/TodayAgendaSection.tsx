import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card } from '../../../components';
import { DoctorAppointmentView } from '../../../api/types';
import { ClaySurface } from '../../../components/ClaySurface';
import { tokens } from '../../../theme/tokens';

export interface TodayAgendaSectionProps {
  todayAppointments: DoctorAppointmentView[];
  todayFormattedDate: string;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

export const TodayAgendaSection: React.FC<TodayAgendaSectionProps> = ({
  todayAppointments,
  todayFormattedDate,
  loading,
  error,
  onRetry,
}) => {
  return (
    <View className="mb-5">
      {/* Encabezado de la Agenda de Hoy */}
      <ClaySurface className="bg-med-bg p-4 rounded-clay border border-med-border-light mb-3">
        <View className="flex-row flex-wrap gap-2 items-center justify-between">
          <View
            className="grow min-w-0 max-w-full"
            style={{ flexBasis: tokens.layout.cardMinWidth }}
          >
            <View className="flex-row items-center">
              <Ionicons
                name="calendar"
                size={tokens.iconSize[15]}
                color={tokens.colors.primary}
              />
              <Text className="min-w-0 max-w-full shrink text-xs font-bold text-med-primary uppercase tracking-wider ml-1.5">
                Agenda de Hoy
              </Text>
            </View>
            <Text className="text-base font-bold text-med-text-main mt-1 capitalize">
              {todayFormattedDate}
            </Text>
          </View>
          <Badge
            text={`${todayAppointments.length} ${todayAppointments.length === 1 ? 'cita' : 'citas'}`}
            variant="primary"
          />
        </View>
      </ClaySurface>

      {/* Estados: Carga, Error, Vacío o Listado de Citas de Hoy */}
      {loading && todayAppointments.length === 0 && !error ? (
        <Card className="p-6 items-center justify-center">
          <ActivityIndicator
            size={tokens.indicator.sm}
            color={tokens.colors.primary}
          />
          <Text className="text-xs text-med-text-soft mt-2">
            Cargando agenda de hoy...
          </Text>
        </Card>
      ) : error ? (
        <Card className="p-5 items-center justify-center border-med-error-border bg-med-error-bg/50">
          <ClaySurface
            depth="badge"
            className="w-10 h-10 rounded-full bg-med-error-bg border border-med-error-border items-center justify-center mb-2"
          >
            <Ionicons
              name="alert-circle-outline"
              size={tokens.iconSize[22]}
              color={tokens.colors.error.text}
            />
          </ClaySurface>
          <Text className="text-sm font-bold text-med-text-main text-center mb-1">
            No se pudo cargar la agenda de hoy
          </Text>
          <Text className="text-xs text-med-error-badge-text text-center mb-3">
            {error}
          </Text>
          <Button
            text="Reintentar agenda"
            variant="outline"
            onPress={onRetry}
            className="py-1.5 px-4"
          />
        </Card>
      ) : todayAppointments.length === 0 ? (
        <Card className="p-6 items-center justify-center">
          <ClaySurface
            depth="badge"
            className="w-12 h-12 rounded-full bg-med-surface-muted items-center justify-center mb-3"
          >
            <Ionicons
              name="calendar-outline"
              size={tokens.iconSize[24]}
              color={tokens.colors.textLight}
            />
          </ClaySurface>
          <Text className="text-sm font-semibold text-med-text-main text-center mb-1">
            Sin citas hoy
          </Text>
          <Text className="text-xs text-med-text-soft text-center">
            No tienes citas programadas para hoy.
          </Text>
        </Card>
      ) : (
        <View className="gap-2.5">
          {todayAppointments.map((appt) => {
            const startDate = new Date(appt.start_date_time);
            const endDate = new Date(appt.end_date_time);

            const hasValidStart = !isNaN(startDate.getTime());
            const hasValidEnd = !isNaN(endDate.getTime());

            const timeStr = hasValidStart
              ? `${startDate.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}${
                  hasValidEnd
                    ? ` - ${endDate.toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                    : ''
                }`
              : 'Horario no especificado';

            const patientName =
              [
                appt.first_name,
                appt.second_name,
                appt.first_last_name,
                appt.second_last_name,
              ]
                .filter(Boolean)
                .join(' ')
                .trim() || 'Paciente';

            return (
              <Card
                key={appt.appointment_id}
                className="border-l-4 border-l-med-primary"
              >
                <View className="flex-row flex-wrap gap-2 justify-between items-start mb-1.5">
                  <View
                    className="flex-row items-center grow min-w-0 max-w-full"
                    style={{ flexBasis: tokens.layout.cardMinWidth }}
                  >
                    <Ionicons
                      name="time-outline"
                      size={tokens.iconSize[14]}
                      color={tokens.colors.primary}
                    />
                    <Text className="min-w-0 max-w-full shrink text-xs font-bold text-med-primary ml-1">
                      {timeStr}
                    </Text>
                  </View>
                  <Badge text="Cita de Hoy" variant="info" />
                </View>

                <View className="flex-row items-center mt-1">
                  <Ionicons
                    name="person-outline"
                    size={tokens.iconSize[15]}
                    color={tokens.colors.textMuted}
                  />
                  <Text className="min-w-0 max-w-full shrink text-sm font-bold text-med-text-main ml-1.5">
                    {patientName}
                  </Text>
                </View>

                <View className="flex-row items-center mt-1">
                  <Ionicons
                    name="business-outline"
                    size={tokens.iconSize[15]}
                    color={tokens.colors.textMuted}
                  />
                  <Text className="min-w-0 max-w-full shrink text-xs text-med-text-muted ml-1.5">
                    {appt.clinic_name}
                  </Text>
                </View>

                {appt.appointment_description ? (
                  <View className="mt-2 pt-2 border-t border-med-border-light">
                    <Text
                      className="text-xs text-med-text-soft italic"
                      numberOfLines={2}
                    >
                      Motivo: {appt.appointment_description}
                    </Text>
                  </View>
                ) : null}
              </Card>
            );
          })}
        </View>
      )}
    </View>
  );
};

export default TodayAgendaSection;
