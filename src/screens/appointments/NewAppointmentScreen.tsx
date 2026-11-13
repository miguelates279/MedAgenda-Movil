import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge, Button, Card, Field, KeyboardAwareScrollView, ScreenHeader } from '../../components';
import { useNewAppointment } from './useNewAppointment';

export function NewAppointmentScreen() {
  const {
    router,
    isAuthenticated,
    clinicId,
    doctorId,
    clinic,
    doctorFullName,
    doctorSpecialtyName,
    loadingDetails,
    control,
    handleSubmit,
    rulesError,
    months,
    selectedMonthKey,
    setSelectedMonthKey,
    days,
    selectedDayKey,
    setSelectedDayKey,
    selectedDayLabel,
    slots,
    loadingSlots,
    slotsError,
    selectedSlotId,
    setSelectedSlotId,
    selectedSlot,
    submitting,
    scheduleError,
    onSubmit,
  } = useNewAppointment();

  if (!isAuthenticated) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScreenHeader title="Nueva Cita Médica" />
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <Text className="text-5xl mb-3">🔒</Text>
          <Text className="text-lg font-bold text-neutral-900 mb-2 text-center">
            Inicio de sesión requerido
          </Text>
          <Text className="text-sm text-gray-500 text-center leading-5 max-w-[280px]">
            Debes iniciar sesión o crear una cuenta para poder agendar una cita médica.
          </Text>
          <Button
            text="Iniciar Sesión / Registrarse"
            onPress={() => router.push('/profile' as any)}
            className="mt-5 min-w-[220px]"
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!clinicId || !doctorId) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <ScreenHeader title="Agendar Cita" />
        <View className="flex-1 items-center justify-center p-6 bg-gray-50">
          <Text className="text-5xl mb-3">🏥</Text>
          <Text className="text-lg font-bold text-neutral-900 mb-2 text-center">
            Selecciona una Clínica y Especialista
          </Text>
          <Text className="text-sm text-gray-500 text-center leading-5 max-w-[300px]">
            Para agendar tu cita, utiliza el buscador de clínicas para encontrar tu centro médico y seleccionar el doctor disponible.
          </Text>
          <Button
            text="Ir al Buscador de Clínicas"
            onPress={() => router.replace('/clinics' as any)}
            className="mt-5 min-w-[240px]"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScreenHeader title="Agendar Cita Médica" />

      <KeyboardAwareScrollView contentContainerClassName="p-4 pb-16">
        <Card className="mb-4 bg-teal-50/70 border border-teal-100 p-4">
          <Text className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-2">
            Información de la Cita
          </Text>

          {loadingDetails ? (
            <ActivityIndicator size="small" color="#259487" className="py-2" />
          ) : (
            <>
              <View className="flex-row items-start mb-2">
                <Text className="text-lg mr-2 mt-0.5">🏢</Text>
                <View className="flex-1">
                  <Text className="text-[11px] text-gray-500 uppercase font-medium">Clínica</Text>
                  <Text className="text-sm font-bold text-neutral-900">
                    {clinic?.clinic_name || `Clínica #${clinicId}`}
                  </Text>
                  {clinic?.clinic_address && (
                    <Text className="text-xs text-gray-600 mt-0.5">📍 {clinic.clinic_address}</Text>
                  )}
                </View>
              </View>

              <View className="flex-row items-start border-t border-teal-100/70 pt-2 mt-1">
                <Text className="text-lg mr-2 mt-0.5">👨‍⚕️</Text>
                <View className="flex-1">
                  <Text className="text-[11px] text-gray-500 uppercase font-medium">Especialista</Text>
                  <Text className="text-sm font-bold text-neutral-900">
                    Dr(a). {doctorFullName}
                    <Text className="text-primary font-semibold">{doctorSpecialtyName}</Text>
                  </Text>
                </View>
              </View>
            </>
          )}
        </Card>

        <Card className="mb-4">
          <Text className="text-[15px] font-bold text-neutral-900 mb-2">Selecciona un Mes</Text>
          <View className="flex-row flex-wrap gap-2">
            {months.map((m) => {
              const isSelected = m.key === selectedMonthKey;
              return (
                <TouchableOpacity
                  key={m.key}
                  onPress={() => setSelectedMonthKey(m.key)}
                  className={`px-3 py-1.5 rounded-med-md border ${
                    isSelected ? 'bg-primary border-primary' : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      isSelected ? 'text-white' : 'text-neutral-900'
                    }`}
                  >
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {selectedMonthKey && (
          <Card className="mb-4">
            <Text className="text-[15px] font-bold text-neutral-900 mb-2">Selecciona un Día</Text>
            <View className="flex-row flex-wrap gap-2">
              {days.map((d) => {
                const isSelected = d.key === selectedDayKey;
                return (
                  <TouchableOpacity
                    key={d.key}
                    onPress={() => setSelectedDayKey(d.key)}
                    className={`p-2 rounded-med-md border items-center min-w-[50px] ${
                      isSelected ? 'bg-primary border-primary' : 'bg-gray-100 border-gray-200'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-medium uppercase ${
                        isSelected ? 'text-white' : 'text-gray-500'
                      }`}
                    >
                      {d.weekLabel}
                    </Text>
                    <Text
                      className={`text-sm font-bold ${
                        isSelected ? 'text-white' : 'text-neutral-900'
                      }`}
                    >
                      {d.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>
        )}

        {selectedDayKey && (
          <Card className="mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-[15px] font-bold text-neutral-900">Horarios Disponibles</Text>
              {selectedDayLabel && (
                <Text className="text-xs text-primary font-medium capitalize">
                  {selectedDayLabel}
                </Text>
              )}
            </View>

            {loadingSlots && (
              <View className="py-4 items-center">
                <ActivityIndicator size="small" color="#259487" />
                <Text className="text-xs text-gray-500 mt-1">Cargando turnos...</Text>
              </View>
            )}

            {slotsError && (
              <View className="bg-red-50 border border-red-200 p-2.5 rounded-md mb-2">
                <Text className="text-red-700 text-xs">{slotsError}</Text>
              </View>
            )}

            <View className="flex-row flex-wrap gap-2">
              {slots.map((slot) => {
                const isSelected = slot.id === selectedSlotId;
                const isAvailable = slot.status === 'available';

                return (
                  <TouchableOpacity
                    key={slot.id}
                    onPress={() => isAvailable && setSelectedSlotId(slot.id)}
                    disabled={!isAvailable}
                    className={`p-2.5 rounded-med-md border items-center min-w-[90px] ${
                      isSelected
                        ? 'bg-teal-50 border-primary'
                        : isAvailable
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-100 border-gray-200 opacity-60'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-primary' : 'text-neutral-900'
                      }`}
                    >
                      {slot.label}
                    </Text>
                    <Badge
                      text={
                        isAvailable
                          ? isSelected
                            ? 'Seleccionado'
                            : 'Disponible'
                          : slot.status === 'booked'
                          ? 'Ocupado'
                          : slot.status === 'break'
                          ? 'Descanso'
                          : 'Pasada'
                      }
                      variant={
                        isSelected
                          ? 'primary'
                          : isAvailable
                          ? 'success'
                          : slot.status === 'break'
                          ? 'warning'
                          : 'neutral'
                      }
                      className="mt-1"
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {!loadingSlots && slots.length === 0 && (
              <Text className="text-xs text-gray-400 text-center my-3">
                No hay horarios disponibles configurados para este día.
              </Text>
            )}
          </Card>
        )}

        {selectedSlot ? (
          <Card className="mb-4">
            <Text className="text-[15px] font-bold text-neutral-900 mb-2">Motivo o Nota (Opcional)</Text>
            <Field
              control={control}
              name="appointment_description"
              label="Notas para el médico"
              placeholder="Ej. Control de rutina, dolor de cabeza, etc."
              multiline
              numberOfLines={3}
              className="mb-0"
            />
          </Card>
        ) : null}

        {scheduleError ? (
          <View className="bg-red-50 border border-red-200 p-2.5 rounded-md mb-2.5">
            <Text className="text-red-800 text-xs">{scheduleError}</Text>
          </View>
        ) : null}

        <Button
          text={submitting ? 'Agendando cita...' : 'Confirmar y Guardar Cita'}
          onPress={handleSubmit(onSubmit)}
          loading={submitting}
          disabled={!selectedSlot || submitting}
          className="mt-2"
        />
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

export default NewAppointmentScreen;
