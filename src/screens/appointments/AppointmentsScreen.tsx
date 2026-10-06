import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppointmentCard, Button, ScreenHeader } from '../../components';
import { useAppointmentsScreen } from './useAppointmentsScreen';

export function AppointmentsScreen() {
  const {
    router,
    isAuthenticated,
    loading,
    search,
    setSearch,
    tab,
    setTab,
    error,
    loadAppointments,
    filteredAppointments,
  } = useAppointmentsScreen();

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScreenHeader title="Mis Citas" canGoBack={false} />
        <View className="flex-1 items-center justify-center p-8 bg-gray-50">
          <View className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 items-center justify-center mb-3">
            <Ionicons name="lock-closed-outline" size={26} color="#b45309" />
          </View>
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
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader
        title="Mis Citas"
        canGoBack={false}
        rightAction={
          <Button
            text="+ Agendar en Clínica"
            onPress={() => router.push('/clinics' as any)}
            className="py-1 px-2.5 text-xs"
          />
        }
      />

      <View className="flex-1 bg-gray-50">
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

        <View className="flex-row bg-white border-b border-gray-200">
          <Pressable
            onPress={() => setTab('upcoming')}
            className={`flex-1 py-3 items-center border-b-2 ${
              tab === 'upcoming' ? 'border-primary' : 'border-transparent'
            }`}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'upcoming' }}
          >
            <Text
              className={`text-sm ${
                tab === 'upcoming' ? 'text-primary font-bold' : 'text-gray-500 font-medium'
              }`}
            >
              Próximas Citas
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setTab('past')}
            className={`flex-1 py-3 items-center border-b-2 ${
              tab === 'past' ? 'border-primary' : 'border-transparent'
            }`}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === 'past' }}
          >
            <Text
              className={`text-sm ${
                tab === 'past' ? 'text-primary font-bold' : 'text-gray-500 font-medium'
              }`}
            >
              Historial
            </Text>
          </Pressable>
        </View>

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
          contentContainerClassName="p-4 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadAppointments}
              tintColor="#259487"
              colors={['#259487']}
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
                  ? 'Busca una clínica en el catálogo para ver sus médicos disponibles y agendar tu cita.'
                  : 'Las citas finalizadas aparecerán aquí.'}
              </Text>
              {tab === 'upcoming' && (
                <Button
                  text="Buscar Clínica y Agendar"
                  onPress={() => router.push('/clinics' as any)}
                  className="mt-4"
                />
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

export default AppointmentsScreen;
