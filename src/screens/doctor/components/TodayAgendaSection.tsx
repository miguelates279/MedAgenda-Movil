import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card } from '../../../components';
import { DoctorAppointmentView } from '../../../api/types';

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
      <View className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={15} color="#259487" />
              <Text className="text-xs font-bold text-primary uppercase tracking-wider ml-1.5">
                Agenda de Hoy
              </Text>
            </View>
            <Text className="text-base font-bold text-neutral-900 mt-1 capitalize">
              {todayFormattedDate}
            </Text>
          </View>
          <Badge
            text={`${todayAppointments.length} ${todayAppointments.length === 1 ? 'cita' : 'citas'}`}
            variant="primary"
          />
        </View>
      </View>

      {/* Estados: Carga, Error, Vacío o Listado de Citas de Hoy */}
      {loading && todayAppointments.length === 0 && !error ? (
        <Card className="p-6 items-center justify-center">
          <ActivityIndicator size="small" color="#259487" />
          <Text className="text-xs text-gray-500 mt-2">Cargando agenda de hoy...</Text>
        </Card>
      ) : error ? (
        <Card className="p-5 items-center justify-center border-red-200 bg-red-50/50">
          <View className="w-10 h-10 rounded-full bg-red-50 border border-red-200 items-center justify-center mb-2">
            <Ionicons name="alert-circle-outline" size={22} color="#991b1b" />
          </View>
          <Text className="text-sm font-bold text-neutral-900 text-center mb-1">
            No se pudo cargar la agenda de hoy
          </Text>
          <Text className="text-xs text-red-700 text-center mb-3">
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
          <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-3">
            <Ionicons name="calendar-outline" size={24} color="#9ca3af" />
          </View>
          <Text className="text-sm font-semibold text-neutral-900 text-center mb-1">
            Sin citas hoy
          </Text>
          <Text className="text-xs text-gray-500 text-center">
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

            const patientName = [
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
                className="border-l-4 border-l-primary"
              >
                <View className="flex-row justify-between items-start mb-1.5">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Ionicons name="time-outline" size={14} color="#259487" />
                    <Text className="text-xs font-bold text-primary ml-1">
                      {timeStr}
                    </Text>
                  </View>
                  <Badge text="Cita de Hoy" variant="info" />
                </View>

                <View className="flex-row items-center mt-1">
                  <Ionicons name="person-outline" size={15} color="#4b5563" />
                  <Text className="text-sm font-bold text-neutral-900 ml-1.5">
                    {patientName}
                  </Text>
                </View>

                <View className="flex-row items-center mt-1">
                  <Ionicons name="business-outline" size={15} color="#4b5563" />
                  <Text className="text-xs text-gray-600 ml-1.5">
                    {appt.clinic_name}
                  </Text>
                </View>

                {appt.appointment_description ? (
                  <View className="mt-2 pt-2 border-t border-gray-100">
                    <Text className="text-xs text-gray-500 italic" numberOfLines={2}>
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
