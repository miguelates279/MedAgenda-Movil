import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { Badge, Button, Card } from '../../../components';
import type { useAppointmentAvailability } from '../../../hooks/useAppointmentAvailability';

type Availability = ReturnType<typeof useAppointmentAvailability>;
interface Props {
  availability: Pick<
    Availability,
    | 'months'
    | 'selectedMonthKey'
    | 'setSelectedMonthKey'
    | 'days'
    | 'selectedDayKey'
    | 'setSelectedDayKey'
    | 'selectedDayLabel'
    | 'slots'
    | 'loadingSlots'
    | 'slotsError'
    | 'selectedSlotId'
    | 'setSelectedSlotId'
    | 'loadingRules'
    | 'rulesError'
    | 'retry'
  >;
  disabled?: boolean;
}

export function AppointmentSchedulePicker({
  availability,
  disabled = false,
}: Props) {
  const {
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
    loadingRules,
    rulesError,
    retry,
  } = availability;
  return (
    <>
      <Text className="text-xs text-gray-600 mb-3">
        Todos los horarios se muestran en hora de Colombia.
      </Text>
      {loadingRules && (
        <View className="items-center py-3">
          <ActivityIndicator color="#259487" />
          <Text className="text-xs text-gray-600 mt-2">
            Cargando horario de la clínica...
          </Text>
        </View>
      )}
      {rulesError && (
        <View className="p-3 mb-3 bg-red-50 border border-red-200 rounded-md">
          <Text className="text-sm text-red-800">{rulesError}</Text>
          <Button
            text="Reintentar disponibilidad"
            variant="secondary"
            onPress={retry}
            disabled={disabled}
            className="mt-2"
          />
        </View>
      )}
      <Card className="mb-4">
        <Text className="text-[15px] font-bold text-neutral-900 mb-2">
          Selecciona un Mes
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {months.map((m) => {
            const isSelected = m.key === selectedMonthKey;
            return (
              <TouchableOpacity
                key={m.key}
                onPress={() => setSelectedMonthKey(m.key)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled }}
                className={`px-3 py-1.5 rounded-med-md border ${
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'bg-gray-100 border-gray-200'
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
          <Text className="text-[15px] font-bold text-neutral-900 mb-2">
            Selecciona un Día
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {days.map((d) => {
              const isSelected = d.key === selectedDayKey;
              return (
                <TouchableOpacity
                  key={d.key}
                  onPress={() => setSelectedDayKey(d.key)}
                  disabled={disabled}
                  accessibilityLabel={`Día ${d.label}, ${d.weekLabel}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled }}
                  className={`p-2 rounded-med-md border items-center min-w-[50px] ${
                    isSelected
                      ? 'bg-primary border-primary'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold uppercase ${
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
            <Text className="text-[15px] font-bold text-neutral-900">
              Horarios Disponibles
            </Text>
            {selectedDayLabel && (
              <Text className="text-xs text-primary font-medium capitalize">
                {selectedDayLabel}
              </Text>
            )}
          </View>

          {loadingSlots && (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color="#259487" />
              <Text className="text-xs text-gray-500 mt-1">
                Cargando turnos...
              </Text>
            </View>
          )}

          {slotsError && (
            <View className="bg-red-50 border border-red-200 p-2.5 rounded-md mb-2">
              <Text className="text-red-700 text-xs">{slotsError}</Text>
              <Button
                text="Reintentar disponibilidad"
                variant="secondary"
                onPress={retry}
                disabled={disabled}
                className="mt-2"
              />
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
                  disabled={disabled || !isAvailable || loadingSlots}
                  accessibilityRole="button"
                  accessibilityLabel={`${slot.label}, ${isAvailable ? 'Disponible' : slot.status === 'current' ? 'Cita actual' : slot.status === 'break' ? 'Descanso' : slot.status === 'booked' ? 'Ocupado' : 'Hora pasada'}`}
                  accessibilityState={{
                    selected: isSelected,
                    disabled: disabled || !isAvailable || loadingSlots,
                  }}
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
                            : slot.status === 'current'
                              ? 'Cita actual'
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

          {!loadingRules &&
            !rulesError &&
            !slotsError &&
            !loadingSlots &&
            slots.length === 0 && (
              <Text className="text-xs text-gray-400 text-center my-3">
                No hay horarios disponibles configurados para este día. Prueba
                con otra fecha.
              </Text>
            )}
        </Card>
      )}
    </>
  );
}
