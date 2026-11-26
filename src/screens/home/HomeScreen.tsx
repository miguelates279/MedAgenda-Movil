import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Badge, Button, ConfirmModal } from '../../components';
import { useHome } from '../../hooks/useHome';
import { ClaySurface, ClayPressable } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';

export const HomeScreen: React.FC = () => {
  const {
    user,
    isAuthenticated,
    upcomingAppt,
    loadingAppt,
    apptError,
    loadNextAppointment,
    isLogoutModalOpen,
    isLoggingOut,
    handleCancelLogout,
    handleConfirmLogout,
    navigateToClinics,
    navigateToAppointments,
    navigateToPrescriptions,
    navigateToNewClinic,
    navigateToAppointmentDetail,
  } = useHome();

  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <ScrollView
        className="min-w-0 max-w-full flex-1 bg-med-surface"
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={loadingAppt}
            onRefresh={loadNextAppointment}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        }
      >
        {/* 1. Encabezado / Contexto del Paciente */}
        <ClaySurface className="flex-row flex-wrap gap-3 justify-between items-center bg-med-bg p-4 rounded-clay border border-med-border-light mb-4">
          <View className="min-w-0 max-w-full flex-1 pr-2">
            <View className="flex-row items-center">
              <Ionicons
                name="pulse"
                size={tokens.iconSize[14]}
                color={tokens.colors.primary}
              />
              <Text className="min-w-0 max-w-full shrink text-xs font-bold text-med-primary uppercase tracking-wider ml-1">
                MedAgenda
              </Text>
            </View>
            <Text className="text-lg font-bold text-med-text-main mt-1">
              Hola, {user?.first_name || 'Paciente'}
            </Text>
            <Text className="text-xs text-med-text-muted mt-0.5">
              Portal de atención y consultas de salud
            </Text>
          </View>
          <Badge text="Paciente" variant="primary" />
        </ClaySurface>

        {/* 2. Sección Principal: Próxima Cita */}
        <View className="mb-4">
          <View className="flex-row flex-wrap gap-2 justify-between items-center mb-3">
            <Text className="min-w-0 max-w-full shrink text-base font-bold text-med-text-main">
              Próxima Cita
            </Text>
            <Pressable
              onPress={navigateToAppointments}
              accessibilityRole="button"
              accessibilityLabel="Ver todas las citas"
            >
              <Text className="text-xs font-semibold text-med-primary">
                Ver todas
              </Text>
            </Pressable>
          </View>

          {loadingAppt && !upcomingAppt && !apptError ? (
            <ClaySurface className="bg-med-bg border border-med-border-light rounded-clay p-6 items-center justify-center">
              <ActivityIndicator
                size={tokens.indicator.sm}
                color={tokens.colors.primary}
              />
              <Text className="text-xs text-med-text-soft mt-2">
                Cargando tu próxima cita...
              </Text>
            </ClaySurface>
          ) : apptError ? (
            <ClaySurface className="bg-med-bg border border-med-error-border rounded-clay p-5 items-center justify-center">
              <ClaySurface
                depth="badge"
                className="w-10 h-10 rounded-full bg-med-error-bg items-center justify-center mb-2"
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={tokens.iconSize[22]}
                  color={tokens.colors.error.text}
                />
              </ClaySurface>
              <Text className="text-sm font-semibold text-med-text-main text-center mb-1">
                No se pudo cargar la próxima cita
              </Text>
              <Text className="text-xs text-med-error-badge-text text-center mb-3">
                {apptError}
              </Text>
              <Button
                text="Reintentar"
                variant="outline"
                onPress={loadNextAppointment}
                className="py-1.5 px-4"
              />
            </ClaySurface>
          ) : upcomingAppt ? (
            <ClayPressable
              onPress={() =>
                navigateToAppointmentDetail(upcomingAppt.appointment_id)
              }
              className="min-h-touch max-w-full bg-med-bg border border-med-border-light border-l-4 border-l-med-primary rounded-control p-4 active:bg-med-surface"
              accessibilityRole="button"
              accessibilityLabel="Ver detalles de la próxima cita"
            >
              <View className="flex-row flex-wrap gap-2 justify-between items-center mb-2">
                <Badge text="Próxima Cita" variant="primary" />
                <View className="flex-row items-center">
                  <Ionicons
                    name="calendar-outline"
                    size={tokens.iconSize[14]}
                    color={tokens.colors.primary}
                  />
                  <Text className="min-w-0 max-w-full shrink text-xs font-semibold text-med-primary ml-1 capitalize">
                    {new Date(upcomingAppt.start_date_time).toLocaleDateString(
                      'es-ES',
                      {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      },
                    )}
                    {' · '}
                    {new Date(upcomingAppt.start_date_time).toLocaleTimeString(
                      'es-ES',
                      {
                        hour: '2-digit',
                        minute: '2-digit',
                      },
                    )}
                  </Text>
                </View>
              </View>

              <View className="flex-row items-center mt-1">
                <Ionicons
                  name="person-outline"
                  size={tokens.iconSize[15]}
                  color={tokens.colors.textMuted}
                />
                <Text className="min-w-0 max-w-full shrink text-sm font-bold text-med-text-main ml-1.5">
                  Dr(a). {upcomingAppt.first_name}{' '}
                  {upcomingAppt.first_last_name}
                </Text>
              </View>

              <View className="flex-row items-center mt-1.5">
                <Ionicons
                  name="business-outline"
                  size={tokens.iconSize[15]}
                  color={tokens.colors.textMuted}
                />
                <Text className="min-w-0 max-w-full shrink text-xs text-med-text-muted ml-1.5">
                  {upcomingAppt.clinic_name}
                </Text>
              </View>

              {upcomingAppt.appointment_description ? (
                <Text
                  className="text-xs text-med-text-soft mt-2 italic"
                  numberOfLines={2}
                >
                  {upcomingAppt.appointment_description}
                </Text>
              ) : null}

              <View className="flex-row flex-wrap gap-3 items-center justify-between mt-3 pt-2.5 border-t border-med-border-light">
                <Text className="min-w-0 max-w-full shrink text-xs font-semibold text-med-primary">
                  Gestionar o ver detalles
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={tokens.iconSize[15]}
                  color={tokens.colors.primary}
                />
              </View>
            </ClayPressable>
          ) : (
            <ClaySurface className="bg-med-bg border border-med-border-light rounded-clay p-6 items-center justify-center">
              <ClaySurface
                depth="badge"
                className="w-12 h-12 rounded-full bg-med-surface-muted items-center justify-center mb-3"
              >
                <Ionicons
                  name="calendar-outline"
                  size={tokens.iconSize[24]}
                  color={tokens.colors.textLight}
                />
              </ClaySurface>
              <Text className="text-xs text-med-text-muted text-center mb-3">
                No tienes citas médicas programadas.
              </Text>
              <Button
                text="Buscar Clínica y Agendar"
                onPress={navigateToClinics}
              />
            </ClaySurface>
          )}
        </View>

        {/* 3. Acciones Rápidas del Paciente */}
        <View className="mb-4">
          <Text className="text-base font-bold text-med-text-main mb-3">
            Acciones Rápidas
          </Text>

          {/* Tarjetas Principales en Fila */}
          <View className="flex-row flex-wrap gap-3 mb-3">
            {/* Buscar Clínicas */}
            <ClayPressable
              onPress={navigateToClinics}
              className="max-w-full min-h-touch flex-1 min-w-action-sm bg-med-primary rounded-clay p-4 active:opacity-90"
              accessibilityRole="button"
              accessibilityLabel="Buscar Clínicas y Agendar"
            >
              <ClaySurface
                depth="badge"
                className="w-10 h-10 rounded-full bg-med-bg/20 items-center justify-center mb-2"
              >
                <Ionicons
                  name="business"
                  size={tokens.iconSize[20]}
                  color={tokens.colors.onPrimary}
                />
              </ClaySurface>
              <Text className="text-sm font-bold text-med-on-primary">
                Buscar Clínicas
              </Text>
              <Text className="text-xs text-med-on-primary/80 mt-1 leading-tight">
                Encuentra especialistas disponibles
              </Text>
            </ClayPressable>

            {/* Mis Citas */}
            <ClayPressable
              onPress={navigateToAppointments}
              className="max-w-full min-h-touch flex-1 min-w-action-sm bg-med-bg border border-med-border-light rounded-clay p-4 active:bg-med-surface"
              accessibilityRole="button"
              accessibilityLabel="Mis Citas"
            >
              <ClaySurface
                depth="badge"
                className="w-10 h-10 rounded-full bg-med-primary-surface items-center justify-center mb-2"
              >
                <Ionicons
                  name="calendar"
                  size={tokens.iconSize[20]}
                  color={tokens.colors.primary}
                />
              </ClaySurface>
              <Text className="text-sm font-bold text-med-text-main">
                Mis Citas
              </Text>
              <Text className="text-xs text-med-text-muted mt-1 leading-tight">
                Consulta próximas y pasadas
              </Text>
            </ClayPressable>
          </View>

          {/* Fórmulas Médicas */}
          <ClayPressable
            onPress={navigateToPrescriptions}
            className="min-h-touch max-w-full flex-row flex-wrap gap-3 items-center justify-between bg-med-bg border border-med-border-light rounded-control p-4 active:bg-med-surface"
            accessibilityRole="button"
            accessibilityLabel="Mis Fórmulas Médicas"
          >
            <View className="min-w-0 max-w-full flex-row items-center flex-1 pr-2">
              <ClaySurface
                depth="badge"
                className="w-10 h-10 rounded-full bg-med-info-bg items-center justify-center mr-3"
              >
                <MaterialCommunityIcons
                  name="pill"
                  size={tokens.iconSize[20]}
                  color={tokens.colors.secondary}
                />
              </ClaySurface>
              <View className="min-w-0 max-w-full flex-1">
                <Text className="text-sm font-bold text-med-text-main">
                  Mis Fórmulas Médicas
                </Text>
                <Text className="text-xs text-med-text-muted mt-0.5">
                  Revisa tus recetas emitidas por clínica
                </Text>
              </View>
            </View>
            <Ionicons
              name="chevron-forward"
              size={tokens.iconSize[18]}
              color={tokens.colors.primary}
            />
          </ClayPressable>
        </View>

        {/* 4. Onboarding de Registro de Clínica (separado y sin gestionar clínicas) */}
        {isAuthenticated && (
          <ClaySurface className="mb-4 bg-med-bg border border-med-border-light rounded-clay p-4">
            <View className="flex-row flex-wrap gap-3 items-center justify-between">
              <View
                className="grow min-w-0 max-w-full"
                style={{ flexBasis: tokens.layout.cardMinWidth }}
              >
                <View className="flex-row items-center mb-0.5">
                  <Ionicons
                    name="business-outline"
                    size={tokens.iconSize[13]}
                    color={tokens.colors.primary}
                  />
                  <Text className="min-w-0 max-w-full shrink text-xs font-bold text-med-primary uppercase ml-1">
                    ¿Administras un consultorio?
                  </Text>
                </View>
                <Text className="text-sm font-bold text-med-text-main">
                  Registra una clínica
                </Text>
                <Text className="text-xs text-med-text-muted mt-0.5">
                  Crea una sede médica y comienza a gestionar citas como
                  propietario.
                </Text>
              </View>
              <Button
                text="Registrar"
                variant="outline"
                onPress={navigateToNewClinic}
                className="py-1.5 px-3 min-w-control"
              />
            </View>
          </ClaySurface>
        )}
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
    </View>
  );
};

export default HomeScreen;
