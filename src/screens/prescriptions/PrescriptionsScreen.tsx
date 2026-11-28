import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Button, Card, ScreenHeader } from '../../components';
import { usePrescriptionsScreen } from './usePrescriptionsScreen';
import { ClaySurface, ClayPressable } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';
import { PrescriptionPdfActions } from '../../components/PrescriptionPdfActions';

export function PrescriptionsScreen() {
  const {
    prescriptions,
    loading,
    error,
    groups,
    loadPrescriptions,
    pdfPending,
    requestPdfExport,
  } = usePrescriptionsScreen();

  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <ScreenHeader
        title="Mis Fórmulas Médicas"
        rightAction={
          <ClayPressable
            onPress={loadPrescriptions}
            className="min-h-touch max-w-full p-1.5 rounded-control bg-med-surface border border-med-border-light active:bg-med-surface-muted"
            accessibilityRole="button"
            accessibilityLabel="Recargar fórmulas médicas"
          >
            <Ionicons
              name="reload-outline"
              size={tokens.iconSize[18]}
              color={tokens.colors.primary}
            />
          </ClayPressable>
        }
      />

      <ScrollView
        className="min-w-0 max-w-full flex-1 bg-med-surface"
        contentContainerClassName="p-4 pb-8"
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadPrescriptions}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        }
      >
        <ClaySurface className="mb-4 bg-med-primary-surface border border-med-primary-border p-4 rounded-clay">
          <Text className="text-xs font-bold text-med-primary-dark uppercase tracking-wider mb-1">
            Recetas e Indicaciones
          </Text>
          <Text className="text-xs text-med-primary-dark leading-relaxed">
            Aquí puedes consultar todas las prescripciones y fórmulas emitidas
            por tus médicos en cada clínica. Puedes guardar o compartir cada
            receta en PDF.
          </Text>
        </ClaySurface>

        {error ? (
          <Card className="mb-4 border-med-error-border bg-med-error-bg">
            <Text className="text-sm font-bold text-med-error-badge-text mb-1">
              No se pudieron cargar tus fórmulas
            </Text>
            <Text className="text-sm text-med-error-badge-text mb-3">
              {error}
            </Text>
            <Button
              text="Reintentar"
              variant="outline"
              onPress={loadPrescriptions}
              disabled={loading}
            />
          </Card>
        ) : null}

        {loading && prescriptions.length === 0 ? (
          <Card className="p-8 items-center justify-center">
            <ActivityIndicator
              size={tokens.indicator.sm}
              color={tokens.colors.primary}
            />
            <Text className="text-xs text-med-text-soft mt-2">
              Cargando fórmulas médicas...
            </Text>
          </Card>
        ) : groups.length === 0 && !error ? (
          <Card className="p-8 items-center justify-center">
            <ClaySurface
              depth="badge"
              className="w-14 h-14 rounded-full bg-med-surface-muted items-center justify-center mb-3"
            >
              <Ionicons
                name="document-text-outline"
                size={tokens.iconSize[28]}
                color={tokens.colors.textLight}
              />
            </ClaySurface>
            <Text className="text-sm font-bold text-med-text-main mb-1">
              Sin Fórmulas Médicas
            </Text>
            <Text className="text-xs text-med-text-soft text-center">
              Aún no tienes fórmulas ni recetas registradas por tus médicos.
            </Text>
          </Card>
        ) : (
          groups.map((group) => (
            <Card key={group.clinicId} className="mb-4 p-0 overflow-hidden">
              <ClaySurface className="bg-med-primary-surface border-b border-med-primary-border p-3.5 flex-row flex-wrap gap-2 justify-between items-center rounded-none">
                <View
                  className="flex-row items-center grow min-w-0 max-w-full"
                  style={{ flexBasis: tokens.layout.cardMinWidth }}
                >
                  <ClaySurface
                    depth="badge"
                    className="w-8 h-8 rounded-full bg-med-bg items-center justify-center mr-2.5"
                  >
                    <Ionicons
                      name="business"
                      size={tokens.iconSize[16]}
                      color={tokens.colors.primary}
                    />
                  </ClaySurface>
                  <View className="min-w-0 max-w-full flex-1">
                    <Text className="text-xs text-med-primary-dark font-bold uppercase tracking-wider">
                      Clínica
                    </Text>
                    <Text
                      className="font-bold text-sm text-med-text-main"
                      numberOfLines={1}
                    >
                      {group.clinicName}
                    </Text>
                  </View>
                </View>
                <Badge
                  text={`${group.items.length} fórmula${group.items.length === 1 ? '' : 's'}`}
                  variant="primary"
                />
              </ClaySurface>

              <View className="p-3.5">
                {group.items.map((item, idx) => {
                  const doctorName = [
                    item.doctor_first_name,
                    item.doctor_second_name,
                    item.doctor_last_name,
                  ]
                    .filter(Boolean)
                    .join(' ');

                  const formattedDate = new Date(
                    item.date_emitted,
                  ).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <View
                      key={item.prescription_id || idx}
                      className={`py-3 ${idx !== 0 ? 'border-t border-med-border-light' : ''}`}
                    >
                      <View className="flex-row flex-wrap gap-x-3 gap-y-1 justify-between items-center mb-1.5">
                        <View
                          className="flex-row items-center grow min-w-0 max-w-full"
                          style={{ flexBasis: tokens.layout.cardMinWidth }}
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={tokens.iconSize[13]}
                            color={tokens.colors.primary}
                          />
                          <Text className="min-w-0 max-w-full shrink text-xs font-bold text-med-primary ml-1">
                            {formattedDate}
                          </Text>
                        </View>
                        <Text className="min-w-0 text-xs text-med-text-soft font-medium max-w-full shrink">
                          Dr(a). {doctorName}
                        </Text>
                      </View>
                      <PrescriptionPdfActions
                        prescriptionId={item.prescription_id}
                        pending={pdfPending}
                        onExport={requestPdfExport}
                      />
                      <ClaySurface
                        depth="inset"
                        className="bg-med-surface border border-med-border-light rounded-clay p-3 mt-3"
                      >
                        <Text className="text-xs text-med-text-main leading-relaxed font-medium">
                          {item.prescription_description}
                        </Text>
                      </ClaySurface>
                    </View>
                  );
                })}
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

export default PrescriptionsScreen;
