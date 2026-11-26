import React, { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { AppModal } from '../../../components/AppModal';
import { Button, Card } from '../../../components';
import type { DoctorAppointmentView } from '../../../api/types';
import { useRescheduleAppointment } from '../useRescheduleAppointment';
import { AppointmentSchedulePicker } from './AppointmentSchedulePicker';
import { ModalViewport } from '../../../components/ModalViewport';
import { ClaySurface } from '../../../components/ClaySurface';
import { tokens } from '../../../theme/tokens';

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
  const [visible, setVisible] = useState(true);
  const afterDismiss = useRef<(() => void) | null>(null);
  useEffect(
    () => () => {
      afterDismiss.current = null;
    },
    [],
  );
  const closePresentation = (complete: () => void) => {
    if (Platform.OS !== 'ios') {
      complete();
      return;
    }
    if (afterDismiss.current) return;
    afterDismiss.current = complete;
    setVisible(false);
  };
  const {
    availability,
    saving,
    error,
    confirm,
    dismiss,
    currentDateLabel,
    selectedDateLabel,
  } = useRescheduleAppointment(
    appointment,
    (result) => closePresentation(() => onComplete(result)),
    () => closePresentation(onDismiss),
  );
  return (
    <AppModal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={dismiss}
      onDismiss={() => {
        const complete = afterDismiss.current;
        afterDismiss.current = null;
        complete?.();
      }}
    >
      <ModalViewport style={{ backgroundColor: tokens.colors.onPrimary }}>
        <View className="p-4 border-b border-med-border-light">
          <Text
            className="text-xl font-bold text-med-text-main mb-2"
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
          contentContainerStyle={{
            padding: tokens.spacing.md,
            paddingBottom: tokens.layout.sectionBottom,
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Card className="mb-4 bg-med-primary-surface border-med-primary-border">
            <Text className="text-sm font-bold text-med-text-main">
              Dr(a). {appointment.first_name} {appointment.first_last_name}
            </Text>
            <Text className="text-sm text-med-text-strong mt-1">
              {appointment.clinic_name}
            </Text>
            <Text className="text-xs font-semibold text-med-text-muted mt-3">
              Horario actual · hora de Colombia
            </Text>
            <Text className="text-sm text-med-text-main mt-1 capitalize">
              {currentDateLabel}
            </Text>
            <Text className="text-xs text-med-text-muted mt-2">
              Elige un nuevo horario. Se conservarán el médico, la clínica y las
              notas de tu cita.
            </Text>
          </Card>
          <AppointmentSchedulePicker
            availability={availability}
            disabled={saving}
          />
          {selectedDateLabel && (
            <Card className="mb-4 border-med-primary-border-strong bg-med-primary-surface">
              <Text className="text-sm font-bold text-med-primary-dark">
                Nuevo horario · hora de Colombia
              </Text>
              <Text className="text-sm text-med-primary-dark mt-1 capitalize">
                {selectedDateLabel}
              </Text>
              <Text className="text-xs text-med-text-strong mt-2">
                Tus recordatorios se actualizarán al guardar.
              </Text>
            </Card>
          )}
          {error && (
            <ClaySurface
              className="p-3 mb-3 bg-med-error-bg border border-med-error-border rounded-clay"
              accessibilityLiveRegion="polite"
            >
              <Text className="text-sm text-med-error-text">{error}</Text>
            </ClaySurface>
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
    </AppModal>
  );
}
