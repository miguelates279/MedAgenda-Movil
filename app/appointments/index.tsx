import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import appointmentsApi from '../../src/api/appointments';
import { DoctorAppointmentView } from '../../src/api/types';
import Button from '../../src/components/Button';
import AppointmentCard from '../../src/components/AppointmentCard';
import NavBar from '../../src/components/NavBar';

export default function AppointmentsIndexScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [appointments, setAppointments] = useState<DoctorAppointmentView[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentsApi.getPatientAppointments();
      setAppointments(data || []);
    } catch (err: any) {
      setError(err.message || 'Error al cargar las citas');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const now = new Date();

  const filteredAppointments = appointments
    .filter((appt) => {
      const apptDate = new Date(appt.start_date_time);
      if (tab === 'upcoming') {
        return apptDate >= now;
      }
      return apptDate < now;
    })
    .filter((appt) => {
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const doctorName = `${appt.first_name} ${appt.first_last_name}`.toLowerCase();
      const clinicName = (appt.clinic_name || '').toLowerCase();
      const desc = (appt.appointment_description || '').toLowerCase();
      return (
        doctorName.includes(term) ||
        clinicName.includes(term) ||
        desc.includes(term)
      );
    })
    .sort((a, b) => {
      const timeA = new Date(a.start_date_time).getTime();
      const timeB = new Date(b.start_date_time).getTime();
      return tab === 'upcoming' ? timeA - timeB : timeB - timeA;
    });

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 bg-gray-50">
          <View className="px-4 py-3 bg-white border-b border-gray-200">
            <Text className="text-lg font-bold text-neutral-900">Mis Citas</Text>
          </View>
          <View className="p-8 items-center justify-center flex-1">
            <Text className="text-4xl mb-3">🔒</Text>
            <Text className="text-base font-bold text-neutral-900 mb-1.5 text-center">
              Inicia sesión para ver tus citas
            </Text>
            <Text className="text-xs text-gray-500 text-center leading-5 max-w-[280px]">
              Debes tener una sesión activa para consultar tu historial y próximas citas médicas.
            </Text>
            <Button
              text="Iniciar Sesión / Registrarse"
              onPress={() => router.push('/profile' as any)}
              className="mt-4"
            />
          </View>
        </View>
        <NavBar active="appointments" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <Text className="text-lg font-bold text-neutral-900">Mis Citas</Text>
          <Button
            text="+ Nueva"
            onPress={() => router.push('/appointments/new' as any)}
            className="py-1.5 px-3"
          />
        </View>

        {/* Search Bar */}
        <View className="px-4 py-2.5 bg-white border-b border-gray-200">
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar por doctor, clínica o motivo..."
            placeholderTextColor="#9ca3af"
            className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-neutral-900"
            clearButtonMode="while-editing"
          />
        </View>

        {/* Tabs */}
        <View className="flex-row bg-white border-b border-gray-200">
          <TouchableOpacity
            onPress={() => setTab('upcoming')}
            className={`flex-1 py-3 items-center border-b-2 ${
              tab === 'upcoming' ? 'border-primary' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-sm ${
                tab === 'upcoming' ? 'text-primary font-bold' : 'text-gray-500 font-medium'
              }`}
            >
              Próximas Citas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setTab('past')}
            className={`flex-1 py-3 items-center border-b-2 ${
              tab === 'past' ? 'border-primary' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-sm ${
                tab === 'past' ? 'text-primary font-bold' : 'text-gray-500 font-medium'
              }`}
            >
              Historial
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Content */}
        {error ? (
          <View className="bg-red-50 border border-red-200 p-3 m-4 rounded-md">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => String(item.appointment_id)}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onPress={() => router.push(`/appointments/${item.appointment_id}` as any)}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadAppointments}
              tintColor="#259487"
            />
          }
          ListEmptyComponent={
            <View className="py-8 px-4 items-center justify-center">
              <Text className="text-base font-bold text-neutral-900 mb-1.5 text-center">
                {tab === 'upcoming'
                  ? 'No tienes citas próximas'
                  : 'No tienes citas en tu historial'}
              </Text>
              <Text className="text-xs text-gray-400 text-center leading-5">
                {tab === 'upcoming'
                  ? 'Agenda una nueva cita médica con un doctor disponible.'
                  : 'Las citas finalizadas aparecerán aquí.'}
              </Text>
              {tab === 'upcoming' && (
                <Button
                  text="Agendar Cita Ahora"
                  onPress={() => router.push('/appointments/new' as any)}
                  className="mt-4"
                />
              )}
            </View>
          }
        />

        {/* Bottom Navigation Bar */}
        <NavBar active="appointments" />
      </View>
    </SafeAreaView>
  );
}
