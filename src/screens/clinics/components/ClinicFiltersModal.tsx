import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, SelectModal } from '../../../components';
import { ModalViewport } from '../../../components/ModalViewport';
import type { useClinicsScreen } from '../useClinicsScreen';

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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: value }}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className={`border rounded-md px-3 py-3 mb-3 ${disabled ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-300 active:bg-gray-50'}`}
    >
      <Text className="text-xs font-semibold text-gray-600 mb-1">{label}</Text>
      <View className="flex-row items-center gap-2">
        <Text
          className={`text-sm flex-1 ${disabled ? 'text-gray-400' : 'text-neutral-900'}`}
        >
          {value}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={disabled ? '#9ca3af' : '#4b5563'}
        />
      </View>
    </Pressable>
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
    <Modal
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
          <View style={styles.sheet}>
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
                <View className="flex-row items-center px-4 py-3 border-b border-gray-200 gap-2">
                  <Text
                    accessibilityRole="header"
                    className="text-lg font-bold text-neutral-900 flex-1"
                  >
                    Filtros de clínicas
                  </Text>
                  <Pressable
                    onPress={filters.close}
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar filtros"
                    className="h-11 w-11 items-center justify-center rounded-full active:bg-gray-100"
                  >
                    <Ionicons name="close" size={24} color="#4b5563" />
                  </Pressable>
                </View>
                <ScrollView
                  style={styles.form}
                  contentContainerStyle={styles.formContent}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                >
                  <Text className="text-sm text-gray-600 mb-4">
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
                      <ActivityIndicator color="#259487" size="small" />
                      <Text className="text-sm text-gray-600">
                        Cargando opciones...
                      </Text>
                    </View>
                  )}
                  <View className="pt-3 border-t border-gray-200 gap-2">
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
          </View>
        </View>
      </ModalViewport>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0, 0, 0, 0.4)' },
  positioner: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    flex: 1,
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  form: { flex: 1, minHeight: 0 },
  formContent: { padding: 16 },
});
