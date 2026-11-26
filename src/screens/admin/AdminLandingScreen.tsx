import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card } from '../../components';
import { useAdminLanding } from './useAdminLanding';
import { ClaySurface, ClayPressable } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';

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
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      {/* Encabezado Principal */}
      <ClaySurface className="flex-row flex-wrap items-center justify-between gap-2 px-4 py-3 bg-med-bg border-b border-med-border-light rounded-none">
        <View>
          <View className="flex-row items-center">
            <Ionicons
              name="shield-checkmark"
              size={tokens.iconSize[14]}
              color={tokens.colors.primary}
            />
            <Text className="min-w-0 max-w-full shrink text-xs font-bold text-med-primary uppercase tracking-wider ml-1">
              MedAgenda
            </Text>
          </View>
          <Text className="text-xl font-bold text-med-text-main mt-0.5">
            Administración
          </Text>
        </View>
        <Badge text="Modo Administrador" variant="primary" />
      </ClaySurface>

      <ScrollView
        className="min-w-0 max-w-full flex-1 bg-med-surface"
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={isResolvingModes}
            onRefresh={handleRefresh}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        }
      >
        {/* Tarjeta de Bienvenida y Contexto de Administración */}
        <ClaySurface className="bg-med-bg p-4 rounded-clay border border-med-border-light mb-4">
          <Text className="text-xs text-med-text-muted">
            Sesión Administrativa
          </Text>
          <Text className="text-base font-bold text-med-text-main mt-0.5">
            Hola, {user?.first_name || 'Administrador'}
          </Text>
          <Text className="text-xs text-med-text-muted mt-1 leading-relaxed">
            Desde este espacio puedes gestionar las sedes clínicas asignadas a
            tu cargo, consultar sus detalles o registrar nuevas sedes.
          </Text>
        </ClaySurface>

        {/* Error en resolución de capacidades/sedes */}
        {modeResolutionError ? (
          <ClaySurface className="bg-med-error-bg border border-med-error-border rounded-clay p-4 mb-4">
            <View className="flex-row items-center mb-1">
              <Ionicons
                name="alert-circle-outline"
                size={tokens.iconSize[16]}
                color={tokens.colors.error.text}
              />
              <Text className="min-w-0 max-w-full shrink text-xs font-bold text-med-error-text ml-1.5">
                Error de sincronización de permisos
              </Text>
            </View>
            <Text className="text-xs text-med-error-badge-text mb-3 leading-relaxed">
              {modeResolutionError}
            </Text>
            <Button
              text="Reintentar verificación"
              variant="outline"
              onPress={handleRefresh}
              className="py-1 px-3 self-start"
            />
          </ClaySurface>
        ) : null}

        {/* Sección de Sedes Clínicas Asignadas */}
        <View className="mb-4">
          <View className="flex-row flex-wrap gap-2 justify-between items-center mb-3">
            <Text className="min-w-0 max-w-full shrink text-base font-bold text-med-text-main">
              Sedes Asignadas ({adminClinics.length})
            </Text>
            {adminClinics.length > 0 && (
              <Pressable
                onPress={navigateToMyClinics}
                accessibilityRole="button"
                accessibilityLabel="Ver todas las clínicas"
              >
                <Text className="text-xs font-semibold text-med-primary">
                  Ver todas
                </Text>
              </Pressable>
            )}
          </View>

          {isResolvingModes &&
          adminClinics.length === 0 &&
          !modeResolutionError ? (
            <Card className="items-center p-6">
              <ActivityIndicator
                size={tokens.indicator.sm}
                color={tokens.colors.primary}
              />
              <Text className="text-xs text-med-text-soft mt-2">
                Cargando sedes administrativas...
              </Text>
            </Card>
          ) : adminClinics.length === 0 ? (
            <Card className="items-center p-6">
              <ClaySurface
                depth="badge"
                className="w-12 h-12 rounded-full bg-med-surface-muted items-center justify-center mb-3"
              >
                <Ionicons
                  name="business-outline"
                  size={tokens.iconSize[24]}
                  color={tokens.colors.textLight}
                />
              </ClaySurface>
              <Text className="text-sm font-semibold text-med-text-main mb-1 text-center">
                Sin sedes vinculadas actualmente
              </Text>
              <Text className="text-xs text-med-text-muted text-center max-w-copy-sm mb-4">
                Aún no tienes sedes asignadas para administración directa.
                Puedes registrar una nueva sede clínica.
              </Text>
              <Button
                text="Registrar Nueva Clínica"
                onPress={navigateToNewClinic}
                className="min-w-action"
              />
            </Card>
          ) : (
            adminClinics.map((clinic) => {
              const isOwner = clinic.role_within_clinic === 'Owner';
              return (
                <Card key={clinic.clinic_id} className="mb-3">
                  <View className="flex-row flex-wrap gap-2 justify-between items-start mb-2">
                    <View
                      className="grow min-w-0 max-w-full"
                      style={{ flexBasis: tokens.layout.cardMinWidth }}
                    >
                      <Text className="text-sm font-bold text-med-text-main">
                        {clinic.clinic_name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons
                          name="business-outline"
                          size={tokens.iconSize[13]}
                          color={tokens.colors.textMuted}
                        />
                        <Text className="min-w-0 max-w-full shrink text-xs text-med-text-muted ml-1">
                          Sede ID #{clinic.clinic_id}
                        </Text>
                      </View>
                      {clinic.role_description ? (
                        <Text className="text-xs text-med-text-soft mt-1">
                          {clinic.role_description}
                        </Text>
                      ) : null}
                    </View>
                    <Badge
                      text={isOwner ? 'Propietario' : 'Administrador'}
                      variant={isOwner ? 'primary' : 'info'}
                    />
                  </View>

                  <View className="flex-row items-center justify-between mt-3 pt-2.5 border-t border-med-border-light">
                    <Pressable
                      onPress={() => navigateToClinicDetail(clinic.clinic_id)}
                      className="min-h-touch max-w-full justify-center flex-row items-center"
                      accessibilityRole="button"
                      accessibilityLabel={`Gestionar ${clinic.clinic_name}`}
                    >
                      <Text className="min-w-0 max-w-full shrink text-xs font-semibold text-med-primary mr-1">
                        Gestionar clínica
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={tokens.iconSize[14]}
                        color={tokens.colors.primary}
                      />
                    </Pressable>
                  </View>
                </Card>
              );
            })
          )}
        </View>

        {/* Acciones Rápidas Administrativas */}
        <View className="mb-4">
          <Text className="text-base font-bold text-med-text-main mb-3">
            Acciones de Gestión
          </Text>

          <View className="flex-row flex-wrap gap-3">
            <ClayPressable
              onPress={navigateToNewClinic}
              className="max-w-full min-h-touch flex-1 min-w-action-sm bg-med-bg border border-med-border-light rounded-control p-4 active:bg-med-surface"
              accessibilityRole="button"
              accessibilityLabel="Registrar nueva sede clínica"
            >
              <ClaySurface
                depth="badge"
                className="w-9 h-9 rounded-full bg-med-primary-surface items-center justify-center mb-2"
              >
                <Ionicons
                  name="add-circle-outline"
                  size={tokens.iconSize[20]}
                  color={tokens.colors.primary}
                />
              </ClaySurface>
              <Text className="text-sm font-bold text-med-text-main">
                Nueva Sede
              </Text>
              <Text className="text-xs text-med-text-muted mt-0.5">
                Registra una sede clínica
              </Text>
            </ClayPressable>

            <ClayPressable
              onPress={navigateToMyClinics}
              className="max-w-full min-h-touch flex-1 min-w-action-sm bg-med-bg border border-med-border-light rounded-control p-4 active:bg-med-surface"
              accessibilityRole="button"
              accessibilityLabel="Consultar listado de mis clínicas"
            >
              <ClaySurface
                depth="badge"
                className="w-9 h-9 rounded-full bg-med-surface-muted items-center justify-center mb-2"
              >
                <Ionicons
                  name="business-outline"
                  size={tokens.iconSize[20]}
                  color={tokens.colors.textMuted}
                />
              </ClaySurface>
              <Text className="text-sm font-bold text-med-text-main">
                Mis Clínicas
              </Text>
              <Text className="text-xs text-med-text-muted mt-0.5">
                Ver todas mis sedes
              </Text>
            </ClayPressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default AdminLandingScreen;
