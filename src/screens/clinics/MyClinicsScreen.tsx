import React from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  ScreenHeader,
} from '../../components';
import { useMyClinics } from './useMyClinics';
import { ClaySurface, ClayPressable } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';

export function MyClinicsScreen() {
  const {
    router,
    isAuthenticated,
    activeMode,
    adminClinics,
    loading,
    error,
    syncError,
    isSyncing,
    handleRetrySync,
    clinicPendingDelete,
    setClinicPendingDelete,
    deleting,
    loadAdminClinics,
    confirmDelete,
  } = useMyClinics();

  if (!isAuthenticated || activeMode !== 'admin') {
    return (
      <View className="min-w-0 max-w-full flex-1 bg-med-bg">
        <ScreenHeader title="Mis Clínicas" />
        <ScrollView
          className="min-w-0 max-w-full flex-1 bg-med-surface"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: tokens.spacing.lg,
          }}
        >
          <ClaySurface
            depth="badge"
            className="w-14 h-14 rounded-full bg-med-warning-bg border border-med-warning-border items-center justify-center mb-3"
          >
            <Ionicons
              name="lock-closed-outline"
              size={tokens.iconSize[26]}
              color={tokens.colors.warning.badgeText}
            />
          </ClaySurface>
          <Text className="text-base font-bold text-med-text-main text-center mb-2">
            Acceso Administrativo Requerido
          </Text>
          <Text className="text-xs text-med-text-muted text-center max-w-copy-sm mb-4">
            Esta sección es exclusiva para la gestión de sedes clínicas en el
            modo Administrador.
          </Text>
          <Button
            text="Volver al inicio"
            onPress={() => router.replace('/' as any)}
            className="min-w-action-md"
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <ScreenHeader
        title="Mis Clínicas"
        rightAction={
          <ClayPressable
            onPress={() => router.push('/clinics/new' as any)}
            className="min-h-touch max-w-full flex-row items-center py-1 px-2.5 bg-med-primary-surface border border-med-primary-border rounded-control active:bg-med-primary-light"
            accessibilityRole="button"
            accessibilityLabel="Nueva clínica"
          >
            <Ionicons
              name="add"
              size={tokens.iconSize[16]}
              color={tokens.colors.primary}
            />
            <Text className="min-w-0 max-w-full shrink text-xs font-semibold text-med-primary ml-0.5">
              Nueva
            </Text>
          </ClayPressable>
        }
      />

      <View className="min-w-0 max-w-full flex-1 bg-med-surface">
        <FlatList
          style={{ flex: 1 }}
          ListHeaderComponent={
            <>
              <ClaySurface className="bg-med-bg border-b border-med-border-light px-4 py-3 rounded-none">
                <Text className="text-xs text-med-text-muted">
                  Sedes asignadas para administración directa. Solo puedes
                  eliminar las sedes de las que eres propietario verificado.
                </Text>
              </ClaySurface>

              {error ? (
                <ClaySurface className="bg-med-error-bg border border-med-error-border p-3 m-4 rounded-clay">
                  <Text className="text-med-error-badge-text text-xs font-medium">
                    {error}
                  </Text>
                </ClaySurface>
              ) : null}

              {syncError ? (
                <ClaySurface className="bg-med-warning-bg border border-med-warning-border p-3.5 m-4 mb-2 rounded-clay">
                  <View className="flex-row items-center mb-1">
                    <Ionicons
                      name="alert-circle-outline"
                      size={tokens.iconSize[16]}
                      color={tokens.colors.warning.badgeText}
                    />
                    <Text className="min-w-0 max-w-full shrink text-xs font-bold text-med-warning-text ml-1.5">
                      Sincronización pendiente
                    </Text>
                  </View>
                  <Text className="text-xs text-med-warning-text leading-relaxed mb-2.5">
                    {syncError}
                  </Text>
                  <Button
                    text={
                      isSyncing
                        ? 'Sincronizando...'
                        : 'Reintentar sincronización'
                    }
                    variant="outline"
                    loading={isSyncing}
                    disabled={isSyncing}
                    onPress={handleRetrySync}
                    className="py-1 px-3 self-start"
                  />
                </ClaySurface>
              ) : null}
            </>
          }
          data={adminClinics}
          keyExtractor={(item) => String(item.clinic_id)}
          contentContainerClassName="p-4 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadAdminClinics}
              tintColor={tokens.colors.primary}
              colors={[tokens.colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const isOwner = item.role_within_clinic === 'Owner';

            return (
              <Card className="mb-3">
                <Pressable
                  onPress={() =>
                    router.push(`/clinics/manage/${item.clinic_id}` as any)
                  }
                  className="min-h-touch max-w-full justify-center active:opacity-90"
                  accessibilityRole="button"
                  accessibilityLabel={`Gestionar ${item.clinic_name}`}
                >
                  <View className="flex-row flex-wrap gap-2 justify-between items-start mb-1.5">
                    <Text className="min-w-0 max-w-full shrink text-base font-bold text-med-text-main flex-1 mr-2">
                      {item.clinic_name}
                    </Text>
                    <Badge
                      text={isOwner ? 'Propietario' : 'Administrador'}
                      variant={isOwner ? 'primary' : 'info'}
                    />
                  </View>

                  <View className="flex-row items-center mb-1">
                    <Ionicons
                      name="business-outline"
                      size={tokens.iconSize[14]}
                      color={tokens.colors.textMuted}
                    />
                    <Text className="min-w-0 max-w-full shrink text-xs text-med-text-muted ml-1">
                      Sede ID #{item.clinic_id}
                    </Text>
                  </View>

                  {item.role_description ? (
                    <Text
                      className="text-xs text-med-text-soft mt-0.5"
                      numberOfLines={2}
                    >
                      {item.role_description}
                    </Text>
                  ) : null}
                </Pressable>

                <View className="mt-3 pt-2.5 border-t border-med-border-light flex-row flex-wrap gap-2 justify-between items-center">
                  <Pressable
                    onPress={() =>
                      router.push(`/clinics/manage/${item.clinic_id}` as any)
                    }
                    className="justify-center flex-row items-center max-w-full min-h-touch"
                    accessibilityRole="button"
                    accessibilityLabel={`Gestionar ${item.clinic_name}`}
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
                <Text className="text-sm text-med-text-light text-center">
                  Cargando tus clínicas...
                </Text>
              ) : (
                <View className="items-center">
                  <ClaySurface
                    depth="badge"
                    className="w-14 h-14 rounded-full bg-med-surface-muted items-center justify-center mb-3"
                  >
                    <Ionicons
                      name="business-outline"
                      size={tokens.iconSize[28]}
                      color={tokens.colors.textLight}
                    />
                  </ClaySurface>
                  <Text className="text-base font-bold text-med-text-main mb-1 text-center">
                    Sin sedes asignadas
                  </Text>
                  <Text className="text-xs text-med-text-soft text-center max-w-copy-sm mb-4">
                    No tienes sedes vinculadas para administración. Puedes
                    registrar una nueva sede clínica.
                  </Text>
                  <Button
                    text="Registrar nueva clínica"
                    onPress={() => router.push('/clinics/new' as any)}
                    className="min-w-action-md"
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
    </View>
  );
}

export default MyClinicsScreen;
