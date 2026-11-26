import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import {
  Badge,
  Button,
  Card,
  DoctorCard,
  ScreenHeader,
} from '../../components';
import { useClinicDetail } from './useClinicDetail';
import { ClaySurface } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';

export function ClinicDetailScreen() {
  const {
    isOwner,
    clinic,
    doctors,
    rules,
    loading,
    deleting,
    error,
    handleBookWithDoctor,
    handleDelete,
  } = useClinicDetail();

  if (loading) {
    return (
      <View className="min-w-0 max-w-full flex-1 bg-med-bg">
        <View className="min-w-0 max-w-full flex-1 items-center justify-center p-6 bg-med-surface">
          <ActivityIndicator
            size={tokens.indicator.lg}
            color={tokens.colors.primary}
          />
          <Text className="mt-3 text-sm text-med-text-muted">
            Cargando información de la clínica...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <ScreenHeader title={clinic?.clinic_name || 'Detalles de la Clínica'} />

      <ScrollView
        className="min-w-0 max-w-full flex-1 bg-med-surface"
        contentContainerClassName="p-4 pb-8"
      >
        {error ? (
          <ClaySurface className="bg-med-error-bg border border-med-error-border p-3 mb-4 rounded-clay">
            <Text className="text-med-error-badge-text text-sm">{error}</Text>
          </ClaySurface>
        ) : null}

        {clinic && (
          <Card className="mb-4">
            <View className="flex-row flex-wrap gap-2 justify-between items-start mb-2">
              <Text className="min-w-0 max-w-full shrink text-lg font-bold text-med-text-main flex-1 mr-2">
                {clinic.clinic_name}
              </Text>
              <Badge
                text={clinic.is_open ? 'Abierta' : 'Cerrada'}
                variant={clinic.is_open ? 'success' : 'error'}
              />
            </View>

            <Text className="text-sm text-med-text-muted mb-1">
              📍 {clinic.clinic_address}
            </Text>
            <Text className="text-sm text-med-text-muted mb-1">
              📞 {clinic.clinic_phone_number}
            </Text>

            {clinic.clinic_description ? (
              <Text className="text-sm text-med-text-main mt-2 leading-5">
                {clinic.clinic_description}
              </Text>
            ) : null}

            {isOwner ? (
              <Button
                text={deleting ? 'Eliminando...' : 'Eliminar clínica'}
                variant="danger"
                loading={deleting}
                disabled={deleting}
                onPress={handleDelete}
                className="mt-4"
              />
            ) : null}

            {rules && (
              <ClaySurface
                depth="inset"
                className="bg-med-surface border border-med-border-light rounded-clay p-3 mt-3"
              >
                <Text className="text-xs font-semibold text-med-text-muted uppercase mb-1.5">
                  Reglas y Horario de Atención
                </Text>
                <View className="flex-row flex-wrap gap-x-3 gap-y-1 justify-between py-0.5">
                  <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted">
                    Apertura:
                  </Text>
                  <Text
                    className="shrink text-sm font-semibold text-med-text-main grow min-w-0 max-w-full text-right"
                    style={{ flexBasis: tokens.layout.cardMinWidth }}
                  >
                    {rules.clinic_opening_time}
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-x-3 gap-y-1 justify-between py-0.5">
                  <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted">
                    Cierre:
                  </Text>
                  <Text
                    className="shrink text-sm font-semibold text-med-text-main grow min-w-0 max-w-full text-right"
                    style={{ flexBasis: tokens.layout.cardMinWidth }}
                  >
                    {rules.clinic_close_time}
                  </Text>
                </View>
                <View className="flex-row flex-wrap gap-x-3 gap-y-1 justify-between py-0.5">
                  <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted">
                    Duración de cita:
                  </Text>
                  <Text
                    className="shrink text-sm font-semibold text-med-text-main grow min-w-0 max-w-full text-right"
                    style={{ flexBasis: tokens.layout.cardMinWidth }}
                  >
                    {rules.clinic_average_appointment_time}
                  </Text>
                </View>
                {rules.clinic_break_time && (
                  <View className="flex-row flex-wrap gap-x-3 gap-y-1 justify-between py-0.5">
                    <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted">
                      Descanso:
                    </Text>
                    <Text
                      className="shrink text-sm font-semibold text-med-text-main grow min-w-0 max-w-full text-right"
                      style={{ flexBasis: tokens.layout.cardMinWidth }}
                    >
                      {rules.clinic_break_time} (
                      {rules.clinic_break_duration || '60 min'})
                    </Text>
                  </View>
                )}
              </ClaySurface>
            )}
          </Card>
        )}

        <View className="mt-2">
          <Text className="text-base font-bold text-med-text-main mb-3">
            Médicos Disponibles
          </Text>

          {doctors.length === 0 ? (
            <Card className="items-center p-6">
              <Text className="text-sm text-med-text-light text-center">
                No hay doctores registrados en esta clínica.
              </Text>
            </Card>
          ) : (
            doctors.map((doc) => (
              <DoctorCard
                key={doc.doctor_id}
                doctor={doc}
                onBookPress={() => handleBookWithDoctor(doc.doctor_id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
export default ClinicDetailScreen;
