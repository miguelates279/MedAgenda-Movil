import React from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { Button, Card } from '../../../components';
import type { DoctorAppointmentView } from '../../../api/types';
import { useRescheduleAppointment } from '../useRescheduleAppointment';
import { AppointmentSchedulePicker } from './AppointmentSchedulePicker';
import { ModalViewport } from '../../../components/ModalViewport';

interface Props {
  appointment: DoctorAppointmentView;
  onComplete: (result: {
    appointment: DoctorAppointmentView;
    remindersUpdated: boolean;
  }) => void;
  onDismiss: () => void;
}

export function RescheduleAppointmentModal({
  appointment,
  onComplete,
  onDismiss,
}: Props) {
  const {
    availability,
    saving,
    error,
    confirm,
    dismiss,
    currentDateLabel,
    selectedDateLabel,
  } = useRescheduleAppointment(appointment, onComplete, onDismiss);
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={dismiss}
    >
      <ModalViewport style={{ backgroundColor: '#ffffff' }}>
        <View className="p-4 border-b border-gray-200">
          <Text
            className="text-xl font-bold text-neutral-900 mb-2"
            accessibilityRole="header"
          >
            Reprogramar cita
          </Text>
          <Button
            text="Volver a la cita"
            variant="secondary"
            onPress={dismiss}
            disabled={saving}
          />
        </View>
        <ScrollView
          style={{ flex: 1, minHeight: 0 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Card className="mb-4 bg-teal-50 border-teal-100">
            <Text className="text-sm font-bold text-neutral-900">
              Dr(a). {appointment.first_name} {appointment.first_last_name}
            </Text>
            <Text className="text-sm text-gray-700 mt-1">
              {appointment.clinic_name}
            </Text>
            <Text className="text-xs font-semibold text-gray-600 mt-3">
              Horario actual · hora de Colombia
            </Text>
            <Text className="text-sm text-neutral-900 mt-1 capitalize">
              {currentDateLabel}
            </Text>
            <Text className="text-xs text-gray-600 mt-2">
              Elige un nuevo horario. Se conservarán el médico, la clínica y las
              notas de tu cita.
            </Text>
          </Card>
          <AppointmentSchedulePicker
            availability={availability}
            disabled={saving}
          />
          {selectedDateLabel && (
            <Card className="mb-4 border-teal-200 bg-teal-50">
              <Text className="text-sm font-bold text-teal-900">
                Nuevo horario · hora de Colombia
              </Text>
              <Text className="text-sm text-teal-900 mt-1 capitalize">
                {selectedDateLabel}
              </Text>
              <Text className="text-xs text-gray-700 mt-2">
                Tus recordatorios se actualizarán al guardar.
              </Text>
            </Card>
          )}
          {error && (
            <View
              className="p-3 mb-3 bg-red-50 border border-red-200 rounded-md"
              accessibilityLiveRegion="polite"
            >
              <Text className="text-sm text-red-800">{error}</Text>
            </View>
          )}
          <Button
            text={
              saving ? 'Guardando nuevo horario...' : 'Confirmar nuevo horario'
            }
            onPress={confirm}
            loading={saving}
            disabled={saving || !availability.selectedSlot}
          />
        </ScrollView>
      </ModalViewport>
    </Modal>
  );
}
