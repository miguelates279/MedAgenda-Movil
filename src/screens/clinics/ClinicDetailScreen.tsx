import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Badge, Button, Card, DoctorCard, ScreenHeader } from '../../components';
import { useClinicDetail } from './useClinicDetail';

export function ClinicDetailScreen() {
  const {
    roles,
    clinic,
    doctors,
    rules,
    loading,
    deleting,
    error,
    handleBookWithDoctor,
    handleDelete,
  } = useClinicDetail();

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <ActivityIndicator size="large" color="#259487" />
          <Text className="mt-3 text-sm text-gray-600">Cargando información de la clínica...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title={clinic?.clinic_name || 'Detalles de la Clínica'} />

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="p-4 pb-8"
      >
        {error ? (
          <View className="bg-red-50 border border-red-200 p-3 mb-4 rounded-md">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        ) : null}

        {clinic && (
          <Card className="mb-4">
            <View className="flex-row justify-between items-start mb-2">
              <Text className="text-lg font-bold text-neutral-900 flex-1 mr-2">
                {clinic.clinic_name}
              </Text>
              <Badge
                text={clinic.is_open ? 'Abierta' : 'Cerrada'}
                variant={clinic.is_open ? 'success' : 'error'}
              />
            </View>

            <Text className="text-sm text-gray-600 mb-1">📍 {clinic.clinic_address}</Text>
            <Text className="text-sm text-gray-600 mb-1">📞 {clinic.clinic_phone_number}</Text>

            {clinic.clinic_description ? (
              <Text className="text-sm text-neutral-900 mt-2 leading-5">
                {clinic.clinic_description}
              </Text>
            ) : null}

            {roles?.isAdmin ? (
              <Button
                text={deleting ? 'Eliminando...' : 'Eliminar clínica'}
                variant="danger"
                loading={deleting}
                disabled={deleting}
                onPress={handleDelete}
                className="mt-4"
              />
            ) : null}

            {rules && (
              <View className="bg-gray-50 border border-gray-200 rounded-md p-3 mt-3">
                <Text className="text-xs font-semibold text-gray-600 uppercase mb-1.5">
                  Reglas y Horario de Atención
                </Text>
                <View className="flex-row justify-between py-0.5">
                  <Text className="text-sm text-gray-600">Apertura:</Text>
                  <Text className="text-sm font-semibold text-neutral-900">
                    {rules.clinic_opening_time}
                  </Text>
                </View>
                <View className="flex-row justify-between py-0.5">
                  <Text className="text-sm text-gray-600">Cierre:</Text>
                  <Text className="text-sm font-semibold text-neutral-900">
                    {rules.clinic_close_time}
                  </Text>
                </View>
                <View className="flex-row justify-between py-0.5">
                  <Text className="text-sm text-gray-600">Duración de cita:</Text>
                  <Text className="text-sm font-semibold text-neutral-900">
                    {rules.clinic_average_appointment_time}
                  </Text>
                </View>
                {rules.clinic_break_time && (
                  <View className="flex-row justify-between py-0.5">
                    <Text className="text-sm text-gray-600">Descanso:</Text>
                    <Text className="text-sm font-semibold text-neutral-900">
                      {rules.clinic_break_time} ({rules.clinic_break_duration || '60 min'})
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Card>
        )}

        <View className="mt-2">
          <Text className="text-base font-bold text-neutral-900 mb-3">Médicos Disponibles</Text>

          {doctors.length === 0 ? (
            <Card className="items-center p-6">
              <Text className="text-sm text-gray-400 text-center">
                No hay doctores registrados en esta clínica.
              </Text>
            </Card>
          ) : (
            doctors.map((doc) => (
              <DoctorCard
                key={doc.doctor_id}
                doctor={doc}
                onBookPress={() => handleBookWithDoctor(doc.doctor_id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
export default ClinicDetailScreen;
