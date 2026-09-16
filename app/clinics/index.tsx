import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useClinicSearch } from '../../src/hooks/useClinicSearch';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';
import Badge from '../../src/components/Badge';
import SelectModal, { SelectOption } from '../../src/components/SelectModal';
import NavBar from '../../src/components/NavBar';
import { Clinic } from '../../src/api/types';

export default function ClinicsIndexScreen() {
  const router = useRouter();
  const {
    countries,
    states,
    cities,
    specialties,
    countryId,
    stateId,
    cityId,
    selectedSpecialtyIds,
    clinics,
    loadingLocations,
    loadingClinics,
    error,
    hasSearched,
    setCountryId,
    setStateId,
    setCityId,
    toggleSpecialty,
    setSelectedSpecialtyIds,
    clearFilters,
    searchClinics,
  } = useClinicSearch();

  // Modal Picker States
  const [modalType, setModalType] = useState<
    'country' | 'state' | 'city' | 'specialties' | null
  >(null);

  const selectedCountry = countries.find((c) => c.country_id === countryId);
  const selectedState = states.find((s) => s.state_id === stateId);
  const selectedCity = cities.find((c) => c.city_id === cityId);

  const specialtiesLabel =
    selectedSpecialtyIds.length === 0
      ? 'Todas las especialidades'
      : `${selectedSpecialtyIds.length} seleccionada${selectedSpecialtyIds.length > 1 ? 's' : ''}`;

  const countryOptions: SelectOption[] = countries.map((c) => ({
    label: c.country_name,
    value: c.country_id,
  }));

  const stateOptions: SelectOption[] = states.map((s) => ({
    label: s.state_name,
    value: s.state_id,
  }));

  const cityOptions: SelectOption[] = cities.map((c) => ({
    label: c.city_name,
    value: c.city_id,
  }));

  const specialtyOptions: SelectOption[] = specialties.map((s) => ({
    label: s.specialty_name,
    value: s.specialty_id,
  }));

  const renderClinicItem = ({ item }: { item: Clinic }) => (
    <Card
      key={item.clinic_id}
      onPress={() => router.push(`/clinics/${item.clinic_id}` as any)}
      style={styles.clinicCard}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.clinicName}>{item.clinic_name}</Text>
        <Badge
          text={item.is_open ? 'Abierta' : 'Cerrada'}
          variant={item.is_open ? 'success' : 'error'}
        />
      </View>

      <Text style={styles.clinicAddress}>📍 {item.clinic_address}</Text>
      <Text style={styles.clinicPhone}>📞 {item.clinic_phone_number}</Text>

      {item.clinic_description ? (
        <Text style={styles.clinicDesc} numberOfLines={2}>
          {item.clinic_description}
        </Text>
      ) : null}

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>Ver doctores y horarios →</Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Buscar Clínicas</Text>
          <TouchableOpacity
            onPress={() => router.push('/profile' as any)}
            style={styles.profileBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.profileBtnIcon}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Section */}
        <View style={styles.filtersSection}>
          <Text style={styles.filtersTitle}>Filtros de Búsqueda</Text>

          {/* Country Selector */}
          <TouchableOpacity
            style={styles.filterSelector}
            onPress={() => setModalType('country')}
          >
            <Text style={styles.filterLabel}>País *</Text>
            <Text style={styles.filterValue}>
              {selectedCountry ? selectedCountry.country_name : 'Selecciona un país'}
            </Text>
          </TouchableOpacity>

          <View style={styles.row}>
            {/* State Selector */}
            <TouchableOpacity
              style={[styles.filterSelector, styles.halfCol, !countryId && styles.selectorDisabled]}
              onPress={() => countryId && setModalType('state')}
              disabled={!countryId}
            >
              <Text style={styles.filterLabel}>Estado / Depto</Text>
              <Text style={[styles.filterValue, !countryId && styles.textMuted]}>
                {selectedState ? selectedState.state_name : 'Opcional'}
              </Text>
            </TouchableOpacity>

            {/* City Selector */}
            <TouchableOpacity
              style={[styles.filterSelector, styles.halfCol, !stateId && styles.selectorDisabled]}
              onPress={() => stateId && setModalType('city')}
              disabled={!stateId}
            >
              <Text style={styles.filterLabel}>Ciudad</Text>
              <Text style={[styles.filterValue, !stateId && styles.textMuted]}>
                {selectedCity ? selectedCity.city_name : 'Opcional'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Specialties Selector */}
          <TouchableOpacity
            style={styles.filterSelector}
            onPress={() => setModalType('specialties')}
          >
            <Text style={styles.filterLabel}>Especialidades</Text>
            <Text style={styles.filterValue}>{specialtiesLabel}</Text>
          </TouchableOpacity>

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            <Button
              text={loadingClinics ? 'Buscando...' : 'Buscar Clínicas'}
              onPress={searchClinics}
              loading={loadingClinics}
              disabled={!countryId || loadingClinics}
              style={{ flex: 1 }}
            />
            {hasSearched && (
              <Button
                text="Limpiar"
                variant="outline"
                onPress={clearFilters}
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
        </View>

        {/* Results List */}
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={clinics}
          keyExtractor={(item) => String(item.clinic_id)}
          renderItem={renderClinicItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={loadingClinics}
              onRefresh={searchClinics}
              tintColor="#259487"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              {loadingClinics ? (
                <Text style={styles.emptyText}>Cargando clínicas...</Text>
              ) : hasSearched ? (
                <Text style={styles.emptyText}>
                  No se encontraron clínicas para los filtros seleccionados.
                </Text>
              ) : (
                <Text style={styles.emptyText}>
                  Selecciona un país y pulsa "Buscar Clínicas" para ver resultados.
                </Text>
              )}
            </View>
          }
        />

        {/* Bottom Navigation Bar */}
        <NavBar active="clinics" />

        {/* Modals */}
        <SelectModal
          title="Selecciona un País"
          items={countryOptions}
          selectedValue={countryId}
          isOpen={modalType === 'country'}
          onClose={() => setModalType(null)}
          onSelect={(val) => setCountryId(val)}
        />

        <SelectModal
          title="Selecciona un Estado"
          items={stateOptions}
          selectedValue={stateId}
          isOpen={modalType === 'state'}
          onClose={() => setModalType(null)}
          onSelect={(val) => setStateId(val)}
        />

        <SelectModal
          title="Selecciona una Ciudad"
          items={cityOptions}
          selectedValue={cityId}
          isOpen={modalType === 'city'}
          onClose={() => setModalType(null)}
          onSelect={(val) => setCityId(val)}
        />

        <SelectModal
          title="Selecciona Especialidades"
          items={specialtyOptions}
          selectedValue={selectedSpecialtyIds}
          multiple
          isOpen={modalType === 'specialties'}
          onClose={() => setModalType(null)}
          onSelect={(val) => setSelectedSpecialtyIds(val)}
        />
      </View>
      <NavBar active="clinics" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
  },
  profileBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnIcon: {
    fontSize: 18,
  },
  filtersSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filtersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#171717',
    marginBottom: 8,
  },
  filterSelector: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: '#ffffff',
  },
  selectorDisabled: {
    backgroundColor: '#f3f4f6',
    borderColor: '#e5e7eb',
  },
  filterLabel: {
    fontSize: 11,
    color: '#4b5563',
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  filterValue: {
    fontSize: 14,
    color: '#171717',
    marginTop: 2,
    fontWeight: '500',
  },
  textMuted: {
    color: '#9ca3af',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  halfCol: {
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  clinicCard: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  clinicName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#171717',
    flex: 1,
    marginRight: 8,
  },
  clinicAddress: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 2,
  },
  clinicPhone: {
    fontSize: 13,
    color: '#4b5563',
    marginBottom: 4,
  },
  clinicDesc: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  cardFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#259487',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
    margin: 16,
    borderRadius: 6,
  },
  errorText: {
    color: '#991b1b',
    fontSize: 13,
  },
  emptyBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
