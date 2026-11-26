import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppModal } from '../../../components/AppModal';
import { Button, SelectModal } from '../../../components';
import { ModalViewport } from '../../../components/ModalViewport';
import type { useClinicsScreen } from '../useClinicsScreen';
import { ClayPressable, ClaySurface } from '../../../components/ClaySurface';
import { tokens } from '../../../theme/tokens';

type Filters = ReturnType<typeof useClinicsScreen>['filters'];

interface FilterFieldProps {
  label: string;
  value: string;
  accessibilityLabel: string;
  disabled?: boolean;
  onPress: () => void;
}

function FilterField({
  label,
  value,
  accessibilityLabel,
  disabled = false,
  onPress,
}: FilterFieldProps) {
  return (
    <ClayPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: value }}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`min-h-touch max-w-full border rounded-control px-3 py-3 mb-3 ${disabled ? 'bg-med-surface-muted border-med-border-light' : 'bg-med-bg border-med-border active:bg-med-surface'}`}
    >
      <Text className="text-xs font-semibold text-med-text-muted mb-1">
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        <Text
          className={`min-w-0 max-w-full shrink text-sm flex-1 ${disabled ? 'text-med-text-light' : 'text-med-text-main'}`}
        >
          {value}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={tokens.iconSize[18]}
          color={disabled ? tokens.colors.textLight : tokens.colors.textMuted}
        />
      </View>
    </ClayPressable>
  );
}

export function ClinicFiltersModal({ filters }: { filters: Filters }) {
  const closePanel =
    filters.panel === 'filters' ? filters.close : filters.showFilters;
  const picker =
    filters.panel === 'country'
      ? {
          title: 'Selecciona un País',
          items: filters.countries,
          selectedValue: filters.countryId,
          onSelect: filters.selectCountry,
        }
      : filters.panel === 'state'
        ? {
            title: 'Selecciona un Estado / Departamento',
            items: filters.states,
            selectedValue: filters.stateId,
            onSelect: filters.selectState,
          }
        : filters.panel === 'city'
          ? {
              title: 'Selecciona una Ciudad',
              items: filters.cities,
              selectedValue: filters.cityId,
              onSelect: filters.selectCity,
            }
          : {
              title: 'Selecciona Especialidades',
              items: filters.specialties,
              selectedValue: filters.selectedSpecialtyIds,
              onSelect: filters.selectSpecialties,
            };

  return (
    <AppModal
      visible={filters.open}
      transparent
      animationType="slide"
      onRequestClose={closePanel}
    >
      <ModalViewport style={styles.backdrop}>
        <View style={styles.positioner}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closePanel}
            accessibilityRole="button"
            accessibilityLabel="Cerrar filtros de clínicas"
          />
          <ClaySurface
            depth="dialog"
            className="flex-1 max-h-filter rounded-t-dialog overflow-hidden"
          >
            {filters.panel !== 'filters' ? (
              <SelectModal
                embedded
                isOpen
                title={picker.title}
                items={picker.items}
                selectedValue={picker.selectedValue}
                multiple={filters.panel === 'specialties'}
                onSelect={picker.onSelect}
                onClose={filters.showFilters}
                loading={filters.loadingOptions}
              />
            ) : (
              <>
                <View className="flex-row items-center px-4 py-3 border-b border-med-border-light gap-2">
                  <Text
                    accessibilityRole="header"
                    className="min-w-0 max-w-full shrink text-lg font-bold text-med-text-main flex-1"
                  >
                    Filtros de clínicas
                  </Text>
                  <ClayPressable
                    onPress={filters.close}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar filtros"
                    className="min-h-touch max-w-full h-11 w-11 items-center justify-center rounded-full active:bg-med-surface-muted"
                  >
                    <Ionicons
                      name="close"
                      size={tokens.iconSize[24]}
                      color={tokens.colors.textMuted}
                    />
                  </ClayPressable>
                </View>
                <ScrollView
                  style={styles.form}
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                >
                  <Text className="text-sm text-med-text-muted mb-4">
                    Selecciona un país. Puedes afinar la búsqueda por
                    departamento, ciudad o especialidad.
                  </Text>
                  <FilterField
                    label="País *"
                    value={filters.countryLabel}
                    accessibilityLabel="Seleccionar país"
                    disabled={filters.loadingOptions}
                    onPress={() => filters.openPanel('country')}
                  />
                  <FilterField
                    label="Departamento o estado"
                    value={filters.stateLabel}
                    accessibilityLabel="Seleccionar departamento o estado"
                    disabled={!filters.countryId || filters.loadingOptions}
                    onPress={() => filters.openPanel('state')}
                  />
                  <FilterField
                    label="Ciudad"
                    value={filters.cityLabel}
                    accessibilityLabel="Seleccionar ciudad"
                    disabled={!filters.stateId || filters.loadingOptions}
                    onPress={() => filters.openPanel('city')}
                  />
                  <FilterField
                    label="Especialidades"
                    value={filters.specialtiesLabel}
                    accessibilityLabel="Seleccionar especialidades"
                    disabled={filters.loadingOptions}
                    onPress={() => filters.openPanel('specialties')}
                  />
                  {filters.loadingOptions && (
                    <View
                      className="flex-row items-center gap-2 mb-2"
                      accessibilityLiveRegion="polite"
                    >
                      <ActivityIndicator
                        color={tokens.colors.primary}
                        size={tokens.indicator.sm}
                      />
                      <Text className="min-w-0 max-w-full shrink text-sm text-med-text-muted">
                        Cargando opciones...
                      </Text>
                    </View>
                  )}
                  <View className="pt-3 border-t border-med-border-light gap-2">
                    <Button
                      text={
                        filters.loadingClinics
                          ? 'Buscando...'
                          : 'Buscar clínicas'
                      }
                      onPress={filters.submit}
                      disabled={!filters.canSearch}
                      loading={filters.loadingClinics}
                    />
                    <Button
                      text="Limpiar filtros"
                      variant="outline"
                      onPress={filters.clear}
                      disabled={!filters.canClear}
                    />
                  </View>
                </ScrollView>
              </>
            )}
          </ClaySurface>
        </View>
      </ModalViewport>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: tokens.colors.overlaySoft },
  positioner: { flex: 1, justifyContent: 'flex-end' },
  form: { flex: 1, minHeight: 0 },
  formContent: { padding: tokens.spacing.md },
});
