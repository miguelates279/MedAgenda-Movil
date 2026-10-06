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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge, Button, ConfirmModal } from '../../components';
import { useHome } from '../../hooks/useHome';

export const HomeScreen: React.FC = () => {
  const {
    user,
    roles,
    isAuthenticated,
    roleBadgeText,
    upcomingAppt,
    loadingAppt,
    loadNextAppointment,
    isLogoutModalOpen,
    isLoggingOut,
    handleCancelLogout,
    handleConfirmLogout,
    navigateToClinics,
    navigateToAppointments,
    navigateToPrescriptions,
    navigateToDoctorPanel,
    navigateToNewClinic,
    navigateToMyClinics,
    navigateToAppointmentDetail,
  } = useHome();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1 bg-gray-50"
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={loadingAppt}
            onRefresh={loadNextAppointment}
            tintColor="#259487"
            colors={['#259487']}
          />
        }
      >
        {/* Encabezado / Saludo */}
        <View className="flex-row justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-sm mb-4">
          <View className="flex-1 pr-2">
            <View className="flex-row items-center">
              <Ionicons name="pulse" size={14} color="#259487" />
              <Text className="text-xs font-bold text-primary uppercase tracking-wider ml-1">
                MedAgenda
              </Text>
            </View>
            <Text className="text-lg font-bold text-neutral-900 mt-1">
              Hola, {user?.first_name || 'Bienvenido'}
            </Text>
          </View>
          <Badge text={roleBadgeText} variant="primary" />
        </View>

        {/* Sección de Acciones Rápidas */}
        <View className="mb-4">
          <Text className="text-base font-bold text-neutral-900 mb-3">
            Acciones Rápidas
          </Text>

          {/* Tarjetas Principales en Fila */}
          <View className="flex-row gap-3 mb-3">
            {/* Buscar Clínicas */}
            <Pressable
              onPress={navigateToClinics}
              className="flex-1 bg-primary rounded-lg p-4 shadow-sm active:opacity-90"
              accessibilityRole="button"
              accessibilityLabel="Buscar Clínicas y Agendar"
            >
              <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mb-2">
                <Ionicons name="business" size={20} color="#ffffff" />
              </View>
              <Text className="text-sm font-bold text-white">
                Buscar Clínicas
              </Text>
              <Text className="text-xs text-teal-100 mt-1 leading-tight">
                Encuentra especialistas disponibles
              </Text>
            </Pressable>

            {/* Mis Citas */}
            <Pressable
              onPress={navigateToAppointments}
              className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
              accessibilityRole="button"
              accessibilityLabel="Mis Citas"
            >
              <View className="w-10 h-10 rounded-full bg-teal-50 items-center justify-center mb-2">
                <Ionicons name="calendar" size={20} color="#259487" />
              </View>
              <Text className="text-sm font-bold text-neutral-900">
                Mis Citas
              </Text>
              <Text className="text-xs text-gray-600 mt-1 leading-tight">
                Consulta próximas y pasadas
              </Text>
            </Pressable>
          </View>

          {/* Fórmulas Médicas */}
          <Pressable
            onPress={navigateToPrescriptions}
            className="flex-row items-center justify-between bg-white border border-gray-200 rounded-lg p-4 mb-3 shadow-sm active:bg-gray-50"
            accessibilityRole="button"
            accessibilityLabel="Mis Fórmulas Médicas"
          >
            <View className="flex-row items-center flex-1 pr-2">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                <MaterialCommunityIcons name="pill" size={20} color="#4682B4" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-bold text-neutral-900">
                  Mis Fórmulas Médicas
                </Text>
                <Text className="text-xs text-gray-600 mt-0.5">
                  Revisa tus recetas emitidas por clínica
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#259487" />
          </Pressable>

          {/* Panel Médico (solo para doctores) */}
          {roles?.isDoctor && (
            <Pressable
              onPress={navigateToDoctorPanel}
              className="flex-row items-center justify-between bg-teal-50/70 border border-teal-200 rounded-lg p-4 mb-3 shadow-sm active:bg-teal-100/70"
              accessibilityRole="button"
              accessibilityLabel="Panel Médico del Doctor"
            >
              <View className="flex-row items-center flex-1 pr-2">
                <View className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3">
                  <MaterialCommunityIcons
                    name="stethoscope"
                    size={20}
                    color="#ffffff"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-neutral-900">
                    Panel Médico del Doctor
                  </Text>
                  <Text className="text-xs text-primary mt-0.5">
                    Gestiona citas, historial y recetas
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#259487" />
            </Pressable>
          )}
        </View>

        {/* Sección de Clínicas (para usuarios autenticados) */}
        {isAuthenticated && (
          <View className="mb-4">
            <Text className="text-base font-bold text-neutral-900 mb-3">
              Mis Clínicas
            </Text>
            <View className="flex-row gap-3">
              <Pressable
                onPress={navigateToNewClinic}
                className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
                accessibilityRole="button"
                accessibilityLabel="Nueva clínica"
              >
                <View className="w-9 h-9 rounded-full bg-teal-50 items-center justify-center mb-2">
                  <Ionicons name="add-circle-outline" size={20} color="#259487" />
                </View>
                <Text className="text-sm font-bold text-neutral-900">
                  Nueva clínica
                </Text>
                <Text className="text-xs text-gray-600 mt-0.5">
                  Registra una sede
                </Text>
              </Pressable>

              <Pressable
                onPress={navigateToMyClinics}
                className="flex-1 bg-white border border-gray-200 rounded-lg p-4 shadow-sm active:bg-gray-50"
                accessibilityRole="button"
                accessibilityLabel="Ver mis clínicas"
              >
                <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center mb-2">
                  <Ionicons name="business-outline" size={20} color="#4b5563" />
                </View>
                <Text className="text-sm font-bold text-neutral-900">
                  Ver mis clínicas
                </Text>
                <Text className="text-xs text-gray-600 mt-0.5">
                  Consulta el listado
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Sección Próxima Cita */}
        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-base font-bold text-neutral-900">
              Próxima Cita
            </Text>
            <Pressable
              onPress={navigateToAppointments}
              accessibilityRole="button"
              accessibilityLabel="Ver todas las citas"
            >
              <Text className="text-xs font-semibold text-primary">
                Ver todas
              </Text>
            </Pressable>
          </View>

          {loadingAppt ? (
            <View className="bg-white border border-gray-200 rounded-lg p-6 items-center justify-center shadow-sm">
              <ActivityIndicator size="small" color="#259487" />
            </View>
          ) : upcomingAppt ? (
            <Pressable
              onPress={() =>
                navigateToAppointmentDetail(upcomingAppt.appointment_id)
              }
              className="bg-white border border-gray-200 border-l-4 border-l-primary rounded-lg p-4 shadow-sm active:bg-gray-50"
              accessibilityRole="button"
              accessibilityLabel="Ver detalles de la próxima cita"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Badge text="Confirmada" variant="success" />
                <View className="flex-row items-center">
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color="#259487"
                  />
                  <Text className="text-xs font-semibold text-primary ml-1 capitalize">
                    {new Date(upcomingAppt.start_date_time).toLocaleDateString(
                      'es-ES',
                      {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      }
                    )}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mt-1">
                <Ionicons name="person-outline" size={15} color="#4b5563" />
                <Text className="text-sm font-bold text-neutral-900 ml-1.5">
                  Dr(a). {upcomingAppt.first_name} {upcomingAppt.first_last_name}
                </Text>
              </View>

              <View className="flex-row items-center mt-1.5">
                <Ionicons name="location-outline" size={15} color="#4b5563" />
                <Text className="text-xs text-gray-600 ml-1.5">
                  {upcomingAppt.clinic_name}
                </Text>
              </View>

              <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-gray-100">
                <Text className="text-xs font-semibold text-primary">
                  Gestionar o ver detalles
                </Text>
                <Ionicons name="chevron-forward" size={15} color="#259487" />
              </View>
            </Pressable>
          ) : (
            <View className="bg-white border border-gray-200 rounded-lg p-6 items-center justify-center shadow-sm">
              <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-3">
                <Ionicons name="calendar-outline" size={24} color="#9ca3af" />
              </View>
              <Text className="text-xs text-gray-600 text-center mb-3">
                No tienes citas médicas programadas.
              </Text>
              <Button
                text="Buscar Clínica y Agendar"
                onPress={navigateToClinics}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal de confirmación para cerrar sesión */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Cerrar Sesión"
        message="¿Estás seguro de que deseas salir de tu cuenta de MedAgenda?"
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
        variant="danger"
        iconName="log-out-outline"
        loading={isLoggingOut}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />
    </SafeAreaView>
  );
};

export default HomeScreen;
