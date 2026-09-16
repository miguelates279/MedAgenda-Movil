import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import clinicsApi from '../../src/api/clinics';
import { Clinic, ClinicScheduleRules, PublicDoctor } from '../../src/api/types';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import DoctorCard from '../../src/components/DoctorCard';

export default function ClinicDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clinicId = Number(id);

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [doctors, setDoctors] = useState<PublicDoctor[]>([]);
  const [rules, setRules] = useState<ClinicScheduleRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clinicId) return;
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cData, dList, rData] = await Promise.all([
          clinicsApi.getClinicDetails(clinicId),
          clinicsApi.getClinicDoctors(clinicId),
          clinicsApi.getClinicScheduleRules(clinicId).catch(() => null),
        ]);
        if (active) {
          setClinic(cData);
          setDoctors(dList);
          setRules(rData);
        }
      } catch (err: any) {
        if (active) setError(err.message || 'Error al cargar detalles de la clínica');
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [clinicId]);

  const handleBookWithDoctor = (doctorId: number) => {
    router.push({
      pathname: '/appointments/new',
      params: { clinic_id: clinicId, doctor_id: doctorId },
    } as any);
  };

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
      <View className="flex-1 bg-gray-50">
        <View className="flex-row items-center px-4 py-3 bg-white border-b border-gray-200">
          <TouchableOpacity onPress={() => router.back()} className="py-1 pr-3" activeOpacity={0.7}>
            <Text className="text-primary text-sm font-semibold">← Volver</Text>
          </TouchableOpacity>
          <Text className="text-base font-bold text-neutral-900 flex-1" numberOfLines={1}>
            {clinic?.clinic_name || 'Detalles de la Clínica'}
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16 }}>
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
      </View>
    </SafeAreaView>
  );
}
