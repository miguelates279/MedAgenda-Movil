import React from 'react';
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  View,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppointmentCard, Button } from '../../components';
import { useAppointmentsScreen } from './useAppointmentsScreen';
import { clayClasses } from '../../theme/clay';
import { ClaySurface, ClayPressable } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';

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
    remindersSupported,
    remindersEnabled,
    remindersPrecise,
    enablingReminders,
    enableReminders,
  } = useAppointmentsScreen();

  if (!isAuthenticated) {
    return (
      <View className="min-w-0 max-w-full flex-1 bg-med-bg">
        <ClaySurface className="px-4 py-3 bg-med-bg border-b border-med-border-light rounded-none">
          <Text className="text-xl font-bold text-med-text-main">
            Mis Citas
          </Text>
        </ClaySurface>
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
          <Text className="text-base font-bold text-med-text-main mb-1.5 text-center">
            Inicia sesión para ver tus citas
          </Text>
          <Text className="text-xs text-med-text-soft text-center leading-5 max-w-copy">
            Debes tener una sesión activa para consultar tu historial y próximas
            citas médicas.
          </Text>
          <Button
            text="Iniciar Sesión / Registrarse"
            onPress={() => router.push('/profile' as any)}
            className="mt-4"
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      {/* Encabezado Principal de Citas */}
      <ClaySurface className="flex-row flex-wrap items-center justify-between gap-2 px-4 py-3 bg-med-bg border-b border-med-border-light rounded-none">
        <Text className="min-w-0 max-w-full shrink text-xl font-bold text-med-text-main">
          Mis Citas
        </Text>
        <Button
          text="+ Agendar Cita"
          onPress={() => router.push('/clinics' as any)}
          className="py-1.5 px-3"
        />
      </ClaySurface>

      <View className="min-w-0 max-w-full flex-1 bg-med-surface">
        <FlatList
          style={{ flex: 1 }}
          ListHeaderComponent={
            <>
              {remindersSupported &&
                (!remindersEnabled || !remindersPrecise) && (
                  <ClaySurface className="mx-4 mt-3 p-3 bg-med-bg border border-med-border-light rounded-clay">
                    <Text className="text-sm text-med-text-main mb-2">
                      {remindersEnabled
                        ? 'Para recibir los avisos a la hora programada, permite las alarmas y recordatorios en los ajustes de Android.'
                        : 'Recibe un aviso 24 horas y 1 hora antes de cada cita. Los avisos abren el detalle de tu cita.'}
                    </Text>
                    <Button
                      text={
                        remindersEnabled
                          ? 'Revisar puntualidad'
                          : 'Activar recordatorios'
                      }
                      variant="secondary"
                      onPress={enableReminders}
                      loading={enablingReminders}
                      disabled={enablingReminders}
                    />
                  </ClaySurface>
                )}
              <ClaySurface className="px-4 py-2.5 bg-med-bg border-b border-med-border-light rounded-none">
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar por doctor, clínica o motivo..."
                  placeholderTextColor={tokens.colors.textLight}
                  className={`${clayClasses.inset} bg-med-surface border border-med-border rounded-input px-3 py-2 text-sm text-med-text-main`}
                  clearButtonMode="while-editing"
                />
              </ClaySurface>

              <ClaySurface className="flex-row bg-med-bg border-b border-med-border-light rounded-none">
                <ClayPressable
                  onPress={() => setTab('upcoming')}
                  className={`min-w-0 max-w-full min-h-touch flex-1 py-3 items-center border-b-2 ${
                    tab === 'upcoming'
                      ? 'border-med-primary'
                      : 'border-transparent'
                  }`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === 'upcoming' }}
                >
                  <Text
                    className={`text-sm ${
                      tab === 'upcoming'
                        ? 'text-med-primary font-bold'
                        : 'text-med-text-soft font-medium'
                    }`}
                  >
                    Próximas Citas
                  </Text>
                </ClayPressable>
                <ClayPressable
                  onPress={() => setTab('past')}
                  className={`min-w-0 max-w-full min-h-touch flex-1 py-3 items-center border-b-2 ${
                    tab === 'past' ? 'border-med-primary' : 'border-transparent'
                  }`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: tab === 'past' }}
                >
                  <Text
                    className={`text-sm ${
                      tab === 'past'
                        ? 'text-med-primary font-bold'
                        : 'text-med-text-soft font-medium'
                    }`}
                  >
                    Historial
                  </Text>
                </ClayPressable>
              </ClaySurface>

              {error ? (
                <ClaySurface className="bg-med-error-bg border border-med-error-border p-3 m-4 rounded-clay">
                  <Text className="text-med-error-badge-text text-sm">
                    {error}
                  </Text>
                </ClaySurface>
              ) : null}
            </>
          }
          data={filteredAppointments}
          keyExtractor={(item) => String(item.appointment_id)}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              onPress={() =>
                router.push(`/appointments/${item.appointment_id}` as any)
              }
            />
          )}
          contentContainerClassName="p-4 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={loadAppointments}
              tintColor={tokens.colors.primary}
              colors={[tokens.colors.primary]}
            />
          }
          ListEmptyComponent={
            <View className="py-8 px-4 items-center justify-center">
              <Text className="text-base font-bold text-med-text-main mb-1.5 text-center">
                {tab === 'upcoming'
                  ? 'No tienes citas próximas'
                  : 'No tienes citas en tu historial'}
              </Text>
              <Text className="text-xs text-med-text-light text-center leading-5">
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
    </View>
  );
}

export default AppointmentsScreen;
