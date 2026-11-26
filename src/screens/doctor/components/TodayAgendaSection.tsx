import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SectionList,
  Text,
  View,
} from 'react-native';
import { Badge, Button, Card } from '../../../components';
import { AppointmentDispatchCard } from '../../../components/AppointmentDispatchCard';
import { AppointmentAction, DoctorAppointmentView } from '../../../api/types';
import { ClaySurface } from '../../../components/ClaySurface';
import { tokens } from '../../../theme/tokens';
import { groupAppointmentsByHour } from '../../../utils/appointmentStatus';

export interface TodayAgendaSectionProps {
  todayAppointments: DoctorAppointmentView[];
  todayFormattedDate: string;
  loading: boolean;
  error: string | null;
  pending: { appointmentId: number; action: AppointmentAction } | null;
  onRetry: () => void;
  onAction: (
    appointment: DoctorAppointmentView,
    action: AppointmentAction,
  ) => void;
  onPrescribe: (appointment: DoctorAppointmentView) => void;
  header: React.ReactNode;
  footer: React.ReactNode;
}

export function TodayAgendaSection({
  todayAppointments,
  todayFormattedDate,
  loading,
  error,
  pending,
  onRetry,
  onAction,
  onPrescribe,
  header,
  footer,
}: TodayAgendaSectionProps) {
  return (
    <SectionList
      className="flex-1 bg-med-surface"
      sections={groupAppointmentsByHour(todayAppointments)}
      keyExtractor={(item) => String(item.appointment_id)}
      stickySectionHeadersEnabled={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{
        padding: tokens.spacing.md,
        paddingBottom: tokens.layout.contentBottom,
      }}
      refreshControl={
        <RefreshControl
          refreshing={loading}
          onRefresh={onRetry}
          tintColor={tokens.colors.primary}
        />
      }
      ListHeaderComponent={
        <>
          {header}
          <ClaySurface className="bg-med-bg p-4 rounded-clay border border-med-border-light mb-3">
            <View className="flex-row flex-wrap gap-2 justify-between items-center">
              <Text className="min-w-0 max-w-full shrink text-lg font-bold text-med-text-main">
                Agenda de hoy
              </Text>
              <Badge
                text={`${todayAppointments.length} citas`}
                variant="info"
              />
            </View>
            <Text className="text-sm text-med-text-muted mt-2">
              {todayFormattedDate}
            </Text>
            <Text className="text-xs text-med-text-soft mt-1">
              Horario de Colombia · Desliza hacia abajo para actualizar.
            </Text>
          </ClaySurface>
          {error ? (
            <Card className="mb-3 border-med-error-border bg-med-error-bg">
              <Text className="text-sm text-med-error-badge-text mb-2">
                {error}
              </Text>
              <Button
                text="Reintentar agenda"
                variant="outline"
                onPress={onRetry}
              />
            </Card>
          ) : null}
          {loading && !todayAppointments.length ? (
            <ActivityIndicator
              size={tokens.indicator.sm}
              color={tokens.colors.primary}
            />
          ) : null}
          {!loading && !error && !todayAppointments.length ? (
            <Card className="mb-4">
              <Text className="text-sm font-bold text-med-text-main text-center">
                Sin citas hoy
              </Text>
              <Text className="text-sm text-med-text-muted text-center mt-2">
                No tienes citas programadas para hoy.
              </Text>
            </Card>
          ) : null}
        </>
      }
      renderSectionHeader={({ section }) => (
        <Text className="text-sm font-bold text-med-text-main mt-2 mb-2">
          {section.title}
        </Text>
      )}
      renderItem={({ item }) => (
        <AppointmentDispatchCard
          appointment={item}
          pendingAction={
            pending?.appointmentId === item.appointment_id
              ? pending.action
              : null
          }
          disabled={!!pending || loading}
          onAction={(action) => onAction(item, action)}
          onPrescribe={() => onPrescribe(item)}
        />
      )}
      ListFooterComponent={<View className="mt-3">{footer}</View>}
    />
  );
}

export default TodayAgendaSection;
