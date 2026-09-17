import React, { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useClinicSearch } from '../../src/hooks/useClinicSearch';
import { Badge, Button, Card, NavBar, SelectModal, SelectOption } from '../../src/components';
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
    loadingClinics,
    error,
    hasSearched,
    setCountryId,
    setStateId,
    setCityId,
    setSelectedSpecialtyIds,
    clearFilters,
    searchClinics,
  } = useClinicSearch();

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
      className="mb-3"
    >
      <View className="flex-row justify-between items-start mb-1.5">
        <Text className="text-base font-bold text-neutral-900 flex-1 mr-2">{item.clinic_name}</Text>
        <Badge
          text={item.is_open ? 'Abierta' : 'Cerrada'}
          variant={item.is_open ? 'success' : 'error'}
        />
      </View>

      <Text className="text-sm text-gray-600 mb-0.5">📍 {item.clinic_address}</Text>
      <Text className="text-sm text-gray-600 mb-1">📞 {item.clinic_phone_number}</Text>

      {item.clinic_description ? (
        <Text className="text-xs text-gray-400 mt-1" numberOfLines={2}>
          {item.clinic_description}
        </Text>
      ) : null}

      <View className="mt-2.5 pt-2 border-t border-gray-100 items-end">
        <Text className="text-xs font-semibold text-primary">Ver doctores y horarios →</Text>
      </View>
    </Card>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <Text className="text-lg font-bold text-neutral-900">Buscar Clínicas</Text>
          <TouchableOpacity
            onPress={() => router.push('/profile' as any)}
            className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 items-center justify-center"
            activeOpacity={0.7}
          >
            <Text className="text-lg">👤</Text>
          </TouchableOpacity>
        </View>

        <View className="bg-white p-4 border-b border-gray-200">
          <Text className="text-sm font-semibold text-neutral-900 mb-2">Filtros de Búsqueda</Text>

          <TouchableOpacity
            className="border border-gray-300 rounded-md px-3 py-2 mb-2 bg-white"
            onPress={() => setModalType('country')}
            activeOpacity={0.7}
          >
            <Text className="text-[11px] text-gray-600 font-medium uppercase">País *</Text>
            <Text className="text-sm text-neutral-900 mt-0.5 font-medium">
              {selectedCountry ? selectedCountry.country_name : 'Selecciona un país'}
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-between gap-2">
            <TouchableOpacity
              className={`flex-1 border border-gray-300 rounded-md px-3 py-2 mb-2 bg-white ${
                !countryId ? 'bg-gray-100 border-gray-200' : ''
              }`}
              onPress={() => countryId && setModalType('state')}
              disabled={!countryId}
              activeOpacity={0.7}
            >
              <Text className="text-[11px] text-gray-600 font-medium uppercase">Estado / Depto</Text>
              <Text
                className={`text-sm mt-0.5 font-medium ${
                  !countryId ? 'text-gray-400' : 'text-neutral-900'
                }`}
              >
                {selectedState ? selectedState.state_name : 'Opcional'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 border border-gray-300 rounded-md px-3 py-2 mb-2 bg-white ${
                !stateId ? 'bg-gray-100 border-gray-200' : ''
              }`}
              onPress={() => stateId && setModalType('city')}
              disabled={!stateId}
              activeOpacity={0.7}
            >
              <Text className="text-[11px] text-gray-600 font-medium uppercase">Ciudad</Text>
              <Text
                className={`text-sm mt-0.5 font-medium ${
                  !stateId ? 'text-gray-400' : 'text-neutral-900'
                }`}
              >
                {selectedCity ? selectedCity.city_name : 'Opcional'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="border border-gray-300 rounded-md px-3 py-2 mb-2 bg-white"
            onPress={() => setModalType('specialties')}
            activeOpacity={0.7}
          >
            <Text className="text-[11px] text-gray-600 font-medium uppercase">Especialidades</Text>
            <Text className="text-sm text-neutral-900 mt-0.5 font-medium">{specialtiesLabel}</Text>
          </TouchableOpacity>

          <View className="flex-row mt-1">
            <Button
              text={loadingClinics ? 'Buscando...' : 'Buscar Clínicas'}
              onPress={searchClinics}
              loading={loadingClinics}
              disabled={!countryId || loadingClinics}
              className="flex-1"
            />
            {hasSearched && (
              <Button
                text="Limpiar"
                variant="outline"
                onPress={clearFilters}
                className="ml-2"
              />
            )}
          </View>
        </View>

        {error ? (
          <View className="bg-red-50 border border-red-200 p-3 m-4 rounded-md">
            <Text className="text-red-700 text-sm">{error}</Text>
          </View>
        ) : null}

        <FlatList
          data={clinics}
          keyExtractor={(item) => String(item.clinic_id)}
          renderItem={renderClinicItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={loadingClinics}
              onRefresh={searchClinics}
              tintColor="#259487"
            />
          }
          ListEmptyComponent={
            <View className="py-10 px-6 items-center justify-center">
              {loadingClinics ? (
                <Text className="text-sm text-gray-400 text-center">Cargando clínicas...</Text>
              ) : hasSearched ? (
                <Text className="text-sm text-gray-400 text-center">
                  No se encontraron clínicas para los filtros seleccionados.
                </Text>
              ) : (
                <Text className="text-sm text-gray-400 text-center">
                  Selecciona un país y pulsa "Buscar Clínicas" para ver resultados.
                </Text>
              )}
            </View>
          }
        />
      </View>

      <NavBar active="clinics" />

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
    </SafeAreaView>
  );
}
