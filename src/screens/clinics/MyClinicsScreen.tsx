import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, ClinicCard, ConfirmModal, ScreenHeader } from '../../components';
import { useMyClinics } from './useMyClinics';

export function MyClinicsScreen() {
  const {
    router,
    isAuthenticated,
    userClinics,
    loading,
    error,
    clinicPendingDelete,
    setClinicPendingDelete,
    deleting,
    loadUserClinics,
    confirmDelete,
  } = useMyClinics();

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScreenHeader title="Mis Clínicas" />
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <View className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 items-center justify-center mb-3">
            <Ionicons name="lock-closed-outline" size={26} color="#b45309" />
          </View>
          <Text className="text-base font-bold text-neutral-900 text-center mb-2">
            Inicio de sesión requerido
          </Text>
          <Text className="text-xs text-gray-600 text-center max-w-[260px] mb-4">
            Debes iniciar sesión para consultar y gestionar tus clínicas registradas.
          </Text>
          <Button
            text="Iniciar Sesión / Registrarse"
            onPress={() => router.push('/profile' as any)}
            className="min-w-[200px]"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader
        title="Mis Clínicas"
        rightAction={
          <Pressable
            onPress={() => router.push('/clinics/new' as any)}
            className="flex-row items-center py-1 px-2.5 bg-teal-50 border border-teal-100 rounded-md active:bg-teal-100"
            accessibilityRole="button"
            accessibilityLabel="Nueva clínica"
          >
            <Ionicons name="add" size={16} color="#259487" />
            <Text className="text-xs font-semibold text-primary ml-0.5">Nueva</Text>
          </Pressable>
        }
      />

      <View className="flex-1 bg-gray-50">
        <View className="bg-white border-b border-gray-200 px-4 py-3">
          <Text className="text-xs text-gray-600">
            Administra las sedes de las que eres propietario. Puedes ver sus detalles o eliminarlas.
          </Text>
        </View>

        {error ? (
          <View className="bg-red-50 border border-red-200 p-3 m-4 rounded-md">
            <Text className="text-red-700 text-xs font-medium">{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={userClinics}
          keyExtractor={(item) => String(item.clinic_id)}
          contentContainerClassName="p-4 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadUserClinics}
              tintColor="#259487"
              colors={['#259487']}
            />
          }
          renderItem={({ item }) => (
            <ClinicCard
              clinic={item}
              onPress={() => router.push(`/clinics/${item.clinic_id}` as any)}
              className="mb-3"
              footer={
                <Button
                  text="Eliminar clínica"
                  variant="danger"
                  onPress={() => setClinicPendingDelete(item)}
                />
              }
            />
          )}
          ListEmptyComponent={
            <View className="py-12 px-6 items-center justify-center">
              {loading ? (
                <Text className="text-sm text-gray-400 text-center">Cargando tus clínicas...</Text>
              ) : (
                <View className="items-center">
                  <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center mb-3">
                    <Ionicons name="business-outline" size={28} color="#9ca3af" />
                  </View>
                  <Text className="text-base font-bold text-neutral-900 mb-1 text-center">
                    Aún no tienes clínicas
                  </Text>
                  <Text className="text-xs text-gray-500 text-center max-w-[260px] mb-4">
                    Registra tu primera clínica médica para empezar a asignar médicos y gestionar citas.
                  </Text>
                  <Button
                    text="Crear mi primera clínica"
                    onPress={() => router.push('/clinics/new' as any)}
                    className="min-w-[200px]"
                  />
                </View>
              )}
            </View>
          }
        />
      </View>

      <ConfirmModal
        isOpen={clinicPendingDelete !== null}
        title="Eliminar clínica"
        message={`¿Estás seguro de que deseas eliminar "${clinicPendingDelete?.clinic_name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        iconName="trash-outline"
        loading={deleting}
        onClose={() => setClinicPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </SafeAreaView>
  );
}

export default MyClinicsScreen;
