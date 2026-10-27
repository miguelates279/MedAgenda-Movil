import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card } from '../../components';
import { useAdminLanding } from './useAdminLanding';

export const AdminLandingScreen: React.FC = () => {
  const {
    user,
    adminClinics,
    isResolvingModes,
    modeResolutionError,
    handleRefresh,
    navigateToMyClinics,
    navigateToNewClinic,
    navigateToClinicDetail,
  } = useAdminLanding();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Encabezado Principal */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
        <View>
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={14} color="#259487" />
            <Text className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
              MedAgenda
            </Text>
          </View>
          <Text className="text-xl font-bold text-neutral-900 mt-0.5">
            Administración
          </Text>
        </View>
        <Badge text="Modo Administrador" variant="primary" />
      </View>

      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={isResolvingModes}
            onRefresh={handleRefresh}
            tintColor="#259487"
            colors={['#259487']}
          />
        }
      >
        {/* Tarjeta de Bienvenida y Contexto de Administración */}
        <View className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
          <Text className="text-xs text-gray-600">Sesión Administrativa</Text>
          <Text className="text-base font-bold text-neutral-900 mt-0.5">
            Hola, {user?.first_name || 'Administrador'}
          </Text>
          <Text className="text-xs text-gray-600 mt-1 leading-relaxed">
            Desde este espacio puedes gestionar las sedes clínicas asignadas a tu cargo, consultar sus detalles o registrar nuevas sedes.
          </Text>
        </View>

        {/* Error en resolución de capacidades/sedes */}
        {modeResolutionError ? (
          <View className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <View className="flex-row items-center mb-1">
              <Ionicons name="alert-circle-outline" size={16} color="#991b1b" />
              <Text className="text-xs font-bold text-red-800 ml-1.5">
                Error de sincronización de permisos
              </Text>
            </View>
            <Text className="text-xs text-red-700 mb-3 leading-relaxed">
              {modeResolutionError}
            </Text>
            <Button
              text="Reintentar verificación"
              variant="outline"
              onPress={handleRefresh}
              className="py-1 px-3 self-start"
            />
          </View>
        ) : null}

        {/* Sección de Sedes Clínicas Asignadas */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-bold text-neutral-900">
              Sedes Asignadas ({adminClinics.length})
            </Text>
            {adminClinics.length > 0 && (
              <Pressable
                onPress={navigateToMyClinics}
                accessibilityRole="button"
                accessibilityLabel="Ver todas las clínicas"
              >
                <Text className="text-xs font-semibold text-primary">
                  Ver todas
                </Text>
              </Pressable>
            )}
          </View>

          {isResolvingModes && adminClinics.length === 0 && !modeResolutionError ? (
            <Card className="items-center p-6">
              <ActivityIndicator size="small" color="#259487" />
              <Text className="text-xs text-gray-500 mt-2">
                Cargando sedes administrativas...
              </Text>
            </Card>
          ) : adminClinics.length === 0 ? (
            <Card className="items-center p-6">
              <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-3">
                <Ionicons name="business-outline" size={24} color="#9ca3af" />
              </View>
              <Text className="text-sm font-semibold text-neutral-900 mb-1 text-center">
                Sin sedes vinculadas actualmente
              </Text>
              <Text className="text-xs text-gray-600 text-center max-w-[260px] mb-4">
                Aún no tienes sedes asignadas para administración directa. Puedes registrar una nueva sede clínica.
              </Text>
              <Button
                text="Registrar Nueva Clínica"
                onPress={navigateToNewClinic}
                className="min-w-[180px]"
              />
            </Card>
          ) : (
            adminClinics.map((clinic) => {
              const isOwner = clinic.role_within_clinic === 'Owner';
              return (
                <Card key={clinic.clinic_id} className="mb-3">
                  <View className="flex-row justify-between items-start mb-2">
                    <View className="flex-1 mr-2">
                      <Text className="text-sm font-bold text-neutral-900">
                        {clinic.clinic_name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="business-outline" size={13} color="#4b5563" />
                        <Text className="text-xs text-gray-600 ml-1">
                          Sede ID #{clinic.clinic_id}
                        </Text>
                      </View>
                      {clinic.role_description ? (
                        <Text className="text-xs text-gray-500 mt-1">
                          {clinic.role_description}
                        </Text>
                      ) : null}
                    </View>
                    <Badge
                      text={isOwner ? 'Propietario' : 'Administrador'}
                      variant={isOwner ? 'primary' : 'info'}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                    <Pressable
                      onPress={() => navigateToClinicDetail(clinic.clinic_id)}
                      className="flex-row items-center"
                      accessibilityRole="button"
                      accessibilityLabel={`Ver detalles de ${clinic.clinic_name}`}
                    >
                      <Text className="text-xs font-semibold text-primary mr-1">
                        Ver detalles de sede
                      </Text>
                      <Ionicons name="chevron-forward" size={14} color="#259487" />
                    </Pressable>
                  </View>
                </Card>
              );
            })
          )}
        </View>

        {/* Acciones Rápidas Administrativas */}
        <View className="mb-4">
          <Text className="text-base font-bold text-neutral-900 mb-3">
            Acciones de Gestión
          </Text>

          <View className="flex-row gap-3">
            <Pressable
              onPress={navigateToNewClinic}
              className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
              accessibilityRole="button"
              accessibilityLabel="Registrar nueva sede clínica"
            >
              <View className="w-9 h-9 rounded-full bg-teal-50 items-center justify-center mb-2">
                <Ionicons name="add-circle-outline" size={20} color="#259487" />
              </View>
              <Text className="text-sm font-bold text-neutral-900">
                Nueva Sede
              </Text>
              <Text className="text-xs text-gray-600 mt-0.5">
                Registra una sede clínica
              </Text>
            </Pressable>

            <Pressable
              onPress={navigateToMyClinics}
              className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
              accessibilityRole="button"
              accessibilityLabel="Consultar listado de mis clínicas"
            >
              <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center mb-2">
                <Ionicons name="business-outline" size={20} color="#4b5563" />
              </View>
              <Text className="text-sm font-bold text-neutral-900">
                Mis Clínicas
              </Text>
              <Text className="text-xs text-gray-600 mt-0.5">
                Ver todas mis sedes
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AdminLandingScreen;
