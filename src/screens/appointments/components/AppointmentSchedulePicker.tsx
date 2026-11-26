import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Badge, Button, Card } from '../../../components';
import type { useAppointmentAvailability } from '../../../hooks/useAppointmentAvailability';
import { ClaySurface, ClayPressable } from '../../../components/ClaySurface';
import { tokens } from '../../../theme/tokens';

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
      <Text className="text-xs text-med-text-muted mb-3">
        Todos los horarios se muestran en hora de Colombia.
      </Text>
      {loadingRules && (
        <View className="items-center py-3">
          <ActivityIndicator
            size={tokens.indicator.sm}
            color={tokens.colors.primary}
          />
          <Text className="text-xs text-med-text-muted mt-2">
            Cargando horario de la clínica...
          </Text>
        </View>
      )}
      {rulesError && (
        <ClaySurface className="p-3 mb-3 bg-med-error-bg border border-med-error-border rounded-clay">
          <Text className="text-sm text-med-error-text">{rulesError}</Text>
          <Button
            text="Reintentar disponibilidad"
            variant="secondary"
            onPress={retry}
            disabled={disabled}
            className="mt-2"
          />
        </ClaySurface>
      )}
      <Card className="mb-4">
        <Text className="text-sm font-bold text-med-text-main max-w-full mb-2">
          Selecciona un Mes
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {months.map((m) => {
            const isSelected = m.key === selectedMonthKey;
            return (
              <ClayPressable
                key={m.key}
                style={{ maxWidth: tokens.layout.full }}
                onPress={() => setSelectedMonthKey(m.key)}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected, disabled }}
                className={`min-h-touch max-w-full px-3 py-1.5 rounded-control border ${
                  isSelected
                    ? 'bg-med-primary border-med-primary'
                    : 'bg-med-surface-muted border-med-border-light'
                }`}
              >
                <Text
                  className={`text-xs font-medium ${
                    isSelected ? 'text-med-on-primary' : 'text-med-text-main'
                  }`}
                >
                  {m.label}
                </Text>
              </ClayPressable>
            );
          })}
        </View>
      </Card>

      {selectedMonthKey && (
        <Card className="mb-4">
          <Text className="text-sm font-bold text-med-text-main max-w-full mb-2">
            Selecciona un Día
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {days.map((d) => {
              const isSelected = d.key === selectedDayKey;
              return (
                <ClayPressable
                  key={d.key}
                  onPress={() => setSelectedDayKey(d.key)}
                  disabled={disabled}
                  accessibilityLabel={`Día ${d.label}, ${d.weekLabel}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, disabled }}
                  className={`min-h-touch p-2 rounded-control border items-center max-w-full min-w-day ${
                    isSelected
                      ? 'bg-med-primary border-med-primary'
                      : 'bg-med-surface-muted border-med-border-light'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold uppercase ${
                      isSelected ? 'text-med-on-primary' : 'text-med-text-soft'
                    }`}
                  >
                    {d.weekLabel}
                  </Text>
                  <Text
                    className={`text-sm font-bold ${
                      isSelected ? 'text-med-on-primary' : 'text-med-text-main'
                    }`}
                  >
                    {d.label}
                  </Text>
                </ClayPressable>
              );
            })}
          </View>
        </Card>
      )}

      {selectedDayKey && (
        <Card className="mb-4">
          <View className="flex-row flex-wrap justify-between items-center gap-2 mb-2">
            <Text className="min-w-0 shrink text-sm font-bold text-med-text-main max-w-full">
              Horarios Disponibles
            </Text>
            {selectedDayLabel && (
              <Text className="text-xs text-med-primary font-medium capitalize max-w-full">
                {selectedDayLabel}
              </Text>
            )}
          </View>

          {loadingSlots && (
            <View className="py-4 items-center">
              <ActivityIndicator
                size={tokens.indicator.sm}
                color={tokens.colors.primary}
              />
              <Text className="text-xs text-med-text-soft mt-1">
                Cargando turnos...
              </Text>
            </View>
          )}

          {slotsError && (
            <ClaySurface className="bg-med-error-bg border border-med-error-border p-2.5 rounded-clay mb-2">
              <Text className="text-med-error-badge-text text-xs">
                {slotsError}
              </Text>
              <Button
                text="Reintentar disponibilidad"
                variant="secondary"
                onPress={retry}
                disabled={disabled}
                className="mt-2"
              />
            </ClaySurface>
          )}

          <View className="flex-row flex-wrap gap-2">
            {slots.map((slot) => {
              const isSelected = slot.id === selectedSlotId;
              const isAvailable = slot.status === 'available';

              return (
                <ClayPressable
                  key={slot.id}
                  style={{ maxWidth: tokens.layout.full }}
                  onPress={() => isAvailable && setSelectedSlotId(slot.id)}
                  disabled={disabled || !isAvailable || loadingSlots}
                  accessibilityRole="button"
                  accessibilityLabel={`${slot.label}, ${isAvailable ? 'Disponible' : slot.status === 'current' ? 'Cita actual' : slot.status === 'break' ? 'Descanso' : slot.status === 'booked' ? 'Ocupado' : 'Hora pasada'}`}
                  accessibilityState={{
                    selected: isSelected,
                    disabled: disabled || !isAvailable || loadingSlots,
                  }}
                  className={`min-h-touch p-2.5 rounded-control border items-center max-w-full min-w-control-lg ${
                    isSelected
                      ? 'bg-med-primary-surface border-med-primary'
                      : isAvailable
                        ? 'bg-med-bg border-med-border-light'
                        : 'bg-med-surface-muted border-med-border-light opacity-60'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-med-primary' : 'text-med-text-main'
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
                </ClayPressable>
              );
            })}
          </View>

          {!loadingRules &&
            !rulesError &&
            !slotsError &&
            !loadingSlots &&
            slots.length === 0 && (
              <Text className="text-xs text-med-text-light text-center my-3">
                No hay horarios disponibles configurados para este día. Prueba
                con otra fecha.
              </Text>
            )}
        </Card>
      )}
    </>
  );
}
