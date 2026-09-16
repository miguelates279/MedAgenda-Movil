import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import appointmentsApi from '../src/api/appointments';
import { DoctorAppointmentView } from '../src/api/types';
import Button from '../src/components/Button';
import Card from '../src/components/Card';
import Badge from '../src/components/Badge';
import NavBar from '../src/components/NavBar';

export default function HomeScreen() {
  const router = useRouter();
  const { user, roles, signOut } = useAuth();
  const [upcomingAppt, setUpcomingAppt] = useState<DoctorAppointmentView | null>(null);
  const [loadingAppt, setLoadingAppt] = useState(false);

  const loadNextAppointment = async () => {
    setLoadingAppt(true);
    try {
      const list = await appointmentsApi.getPatientAppointments();
      const now = new Date();
      const upcoming = list
        .filter((a) => new Date(a.start_date_time) >= now)
        .sort((a, b) => new Date(a.start_date_time).getTime() - new Date(b.start_date_time).getTime())[0];
      setUpcomingAppt(upcoming || null);
    } catch {
    } finally {
      setLoadingAppt(false);
    }
  };

  useEffect(() => {
    loadNextAppointment();
  }, []);

  const handleLogout = () => {
    signOut();
    router.replace('/clinics' as any);
  };

  const fullName = user
    ? [user.first_name, user.second_name, user.first_last_name, user.second_last_name]
        .filter(Boolean)
        .join(' ')
    : 'Paciente';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        className="bg-gray-50"
        refreshControl={
          <RefreshControl
            refreshing={loadingAppt}
            onRefresh={loadNextAppointment}
            tintColor="#259487"
          />
        }
      >
        <View className="flex-row justify-between items-center mb-5 bg-white p-4 rounded-lg border border-gray-200">
          <View className="flex-1">
            <Text className="text-xs font-bold text-primary uppercase tracking-wide">
              MedAgenda
            </Text>
            <Text className="text-lg font-bold text-neutral-900 mt-0.5">
              Hola, {user?.first_name || 'Bienvenido'}
            </Text>
          </View>
          <Badge
            text={roles?.isAdmin ? 'Admin' : roles?.isDoctor ? 'Médico' : 'Paciente'}
            variant="primary"
          />
        </View>

        <View className="mb-5">
          <Text className="text-[15px] font-bold text-neutral-900 mb-2.5">Acciones Rápidas</Text>
          <View className="flex-row gap-2.5 mb-2.5">
            <TouchableOpacity
              className="flex-1 bg-primary rounded-lg p-3.5"
              onPress={() => router.push('/appointments/new' as any)}
              activeOpacity={0.7}
            >
              <Text className="text-2xl mb-1.5">📅</Text>
              <Text className="text-sm font-bold text-white">Agendar Cita</Text>
              <Text className="text-[11px] text-teal-100 mt-0.5">Busca horario disponible</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-white border border-gray-200 rounded-lg p-3.5"
              onPress={() => router.push('/clinics' as any)}
              activeOpacity={0.7}
            >
              <Text className="text-2xl mb-1.5">🏥</Text>
              <Text className="text-sm font-bold text-neutral-900">Buscar Clínicas</Text>
              <Text className="text-[11px] text-gray-500 mt-0.5">Filtra por ciudad y doctor</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="flex-row items-center justify-between bg-white border border-gray-200 rounded-lg p-3.5"
            onPress={() => router.push('/appointments' as any)}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center flex-1">
              <Text className="text-2xl">📋</Text>
              <View className="flex-1 ml-2.5">
                <Text className="text-sm font-bold text-neutral-900">Mis Citas Médicas</Text>
                <Text className="text-[11px] text-gray-500">Consulta tus citas activas e historial</Text>
              </View>
            </View>
            <Text className="text-lg text-primary font-bold ml-2">→</Text>
          </TouchableOpacity>
        </View>

        <View className="mb-5">
          <View className="flex-row justify-between items-center mb-2.5">
            <Text className="text-[15px] font-bold text-neutral-900">Próxima Cita</Text>
            <TouchableOpacity onPress={() => router.push('/appointments' as any)} activeOpacity={0.7}>
              <Text className="text-xs text-primary font-semibold">Ver todas</Text>
            </TouchableOpacity>
          </View>

          {loadingAppt ? (
            <Card className="p-5 items-center justify-center">
              <ActivityIndicator size="small" color="#259487" />
            </Card>
          ) : upcomingAppt ? (
            <Card
              onPress={() =>
                router.push(`/appointments/${upcomingAppt.appointment_id}` as any)
              }
              className="bg-white border-l-4 border-l-primary"
            >
              <View className="flex-row justify-between items-center mb-1.5">
                <Badge text="Confirmada" variant="success" />
                <Text className="text-xs font-semibold text-primary capitalize">
                  {new Date(upcomingAppt.start_date_time).toLocaleDateString('es-ES', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
              <Text className="text-[15px] font-bold text-neutral-900 mb-0.5">
                Dr(a). {upcomingAppt.first_name} {upcomingAppt.first_last_name}
              </Text>
              <Text className="text-xs text-gray-600">📍 {upcomingAppt.clinic_name}</Text>
              <Text className="text-xs text-primary font-semibold mt-2">
                Toca para gestionar o ver detalles →
              </Text>
            </Card>
          ) : (
            <Card className="p-5 items-center justify-center">
              <Text className="text-xs text-gray-600 text-center">
                No tienes citas médicas programadas.
              </Text>
              <Button
                text="Agendar una Cita"
                onPress={() => router.push('/appointments/new' as any)}
                className="mt-2.5"
              />
            </Card>
          )}
        </View>

        <View className="mb-5">
          <Text className="text-[15px] font-bold text-neutral-900 mb-2.5">Perfil de Usuario</Text>
          <Card>
            <View className="flex-row justify-between py-1.5 border-b border-gray-100">
              <Text className="text-xs text-gray-500">Nombre:</Text>
              <Text className="text-xs font-semibold text-neutral-900">{fullName}</Text>
            </View>
            <View className="flex-row justify-between py-1.5 border-b border-gray-100">
              <Text className="text-xs text-gray-500">Correo:</Text>
              <Text className="text-xs font-semibold text-neutral-900">{user?.user_email_address}</Text>
            </View>
            <View className="flex-row justify-between py-1.5 border-b border-gray-100">
              <Text className="text-xs text-gray-500">Cédula:</Text>
              <Text className="text-xs font-semibold text-neutral-900">{user?.legal_id || '-'}</Text>
            </View>
            <View className="flex-row justify-between py-1.5">
              <Text className="text-xs text-gray-500">Teléfono:</Text>
              <Text className="text-xs font-semibold text-neutral-900">{user?.user_phone_number || '-'}</Text>
            </View>
          </Card>
        </View>

        <Button
          text="Cerrar Sesión"
          variant="outline"
          onPress={handleLogout}
          className="mt-1"
        />
      </ScrollView>

      <NavBar active="home" />
    </SafeAreaView>
  );
}
