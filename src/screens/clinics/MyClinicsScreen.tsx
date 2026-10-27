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
import { Badge, Button, Card, ConfirmModal, ScreenHeader } from '../../components';
import { useMyClinics } from './useMyClinics';

export function MyClinicsScreen() {
  const {
    router,
    isAuthenticated,
    activeMode,
    adminClinics,
    loading,
    error,
    clinicPendingDelete,
    setClinicPendingDelete,
    deleting,
    loadAdminClinics,
    confirmDelete,
  } = useMyClinics();

  if (!isAuthenticated || activeMode !== 'admin') {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScreenHeader title="Mis Clínicas" />
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <View className="w-14 h-14 rounded-full bg-amber-50 border border-amber-100 items-center justify-center mb-3">
            <Ionicons name="lock-closed-outline" size={26} color="#b45309" />
          </View>
          <Text className="text-base font-bold text-neutral-900 text-center mb-2">
            Acceso Administrativo Requerido
          </Text>
          <Text className="text-xs text-gray-600 text-center max-w-[260px] mb-4">
            Esta sección es exclusiva para la gestión de sedes clínicas en el modo Administrador.
          </Text>
          <Button
            text="Volver al inicio"
            onPress={() => router.replace('/' as any)}
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
            Sedes asignadas para administración directa. Solo puedes eliminar las sedes de las que eres propietario verificado.
          </Text>
        </View>

        {error ? (
          <View className="bg-red-50 border border-red-200 p-3 m-4 rounded-md">
            <Text className="text-red-700 text-xs font-medium">{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={adminClinics}
          keyExtractor={(item) => String(item.clinic_id)}
          contentContainerClassName="p-4 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadAdminClinics}
              tintColor="#259487"
              colors={['#259487']}
            />
          }
          renderItem={({ item }) => {
            const isOwner = item.role_within_clinic === 'Owner';

            return (
              <Card className="mb-3">
                <Pressable
                  onPress={() => router.push(`/clinics/${item.clinic_id}` as any)}
                  className="active:opacity-90"
                  accessibilityRole="button"
                  accessibilityLabel={`Ver detalles de ${item.clinic_name}`}
                >
                  <View className="flex-row justify-between items-start mb-1.5">
                    <Text className="text-base font-bold text-neutral-900 flex-1 mr-2">
                      {item.clinic_name}
                    </Text>
                    <Badge
                      text={isOwner ? 'Propietario' : 'Administrador'}
                      variant={isOwner ? 'primary' : 'info'}
                    />
                  </View>

                  <View className="flex-row items-center mb-1">
                    <Ionicons name="business-outline" size={14} color="#4b5563" />
                    <Text className="text-xs text-gray-600 ml-1">
                      Sede ID #{item.clinic_id}
                    </Text>
                  </View>

                  {item.role_description ? (
                    <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={2}>
                      {item.role_description}
                    </Text>
                  ) : null}
                </Pressable>

                <View className="mt-3 pt-2.5 border-t border-gray-100 flex-row justify-between items-center">
                  <Pressable
                    onPress={() => router.push(`/clinics/${item.clinic_id}` as any)}
                    className="flex-row items-center"
                    accessibilityRole="button"
                    accessibilityLabel={`Ver detalles de ${item.clinic_name}`}
                  >
                    <Text className="text-xs font-semibold text-primary mr-1">
                      Ver detalles
                    </Text>
                    <Ionicons name="chevron-forward" size={14} color="#259487" />
                  </Pressable>

                  {/* Únicamente se muestra control de eliminación si el usuario es Owner verificado */}
                  {isOwner && (
                    <Button
                      text="Eliminar clínica"
                      variant="danger"
                      className="py-1 px-3"
                      onPress={() => setClinicPendingDelete(item)}
                    />
                  )}
                </View>
              </Card>
            );
          }}
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
                    Sin sedes asignadas
                  </Text>
                  <Text className="text-xs text-gray-500 text-center max-w-[260px] mb-4">
                    No tienes sedes vinculadas para administración. Puedes registrar una nueva sede clínica.
                  </Text>
                  <Button
                    text="Registrar nueva clínica"
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
