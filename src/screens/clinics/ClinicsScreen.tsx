import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useClinicSearch } from '../../hooks/useClinicSearch';
import { Button, ClinicCard, SelectModal, SelectOption } from '../../components';
import { Clinic } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

export function ClinicsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
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
    <ClinicCard
      key={item.clinic_id}
      onPress={() => router.push(`/clinics/${item.clinic_id}` as any)}
      clinic={item}
      className="mb-3"
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-gray-50">
        {/* Encabezado Principal del Buscador */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <Text className="text-xl font-bold text-neutral-900">
            Buscador de Clínicas
          </Text>
          <View className="flex-row items-center gap-2">
            {isAuthenticated ? (
              <Button
                text="+ Nueva"
                onPress={() => router.push('/clinics/new' as any)}
                className="py-1.5 px-3"
              />
            ) : null}
            <Pressable
              onPress={() => router.push('/profile' as any)}
              className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 items-center justify-center active:bg-gray-200"
              accessibilityRole="button"
              accessibilityLabel="Ver perfil"
            >
              <Ionicons name="person" size={16} color="#4b5563" />
            </Pressable>
          </View>
        </View>

        {/* Tarjeta de filtros de búsqueda */}
        <View className="bg-white p-4 border-b border-gray-200">
          <View className="bg-teal-50 border border-teal-100 rounded-lg p-3 mb-3">
            <View className="flex-row items-center mb-1">
              <Ionicons name="search-outline" size={14} color="#259487" />
              <Text className="text-xs font-bold text-teal-800 uppercase tracking-wider ml-1">
                Encuentra tu Clínica
              </Text>
            </View>
            <Text className="text-xs text-teal-900 leading-relaxed">
              Filtra por ubicación o especialidad para consultar médicos disponibles y reservar citas.
            </Text>
          </View>

          <Text className="text-xs font-semibold text-neutral-900 mb-2">Filtros de Búsqueda</Text>

          <Pressable
            className="border border-gray-300 rounded-md px-3 py-2.5 mb-2.5 bg-white active:bg-gray-50"
            onPress={() => setModalType('country')}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar país"
          >
            <Text className="text-[11px] text-gray-600 font-medium uppercase">País *</Text>
            <Text className="text-sm text-neutral-900 mt-0.5 font-medium">
              {selectedCountry ? selectedCountry.country_name : 'Selecciona un país'}
            </Text>
          </Pressable>

          <View className="flex-row justify-between gap-2">
            <Pressable
              className={`flex-1 border border-gray-300 rounded-md px-3 py-2.5 mb-2.5 bg-white active:bg-gray-50 ${
                !countryId ? 'bg-gray-100 border-gray-200' : ''
              }`}
              onPress={() => countryId && setModalType('state')}
              disabled={!countryId}
              accessibilityRole="button"
              accessibilityLabel="Seleccionar departamento o estado"
            >
              <Text className="text-[11px] text-gray-600 font-medium uppercase">Estado / Depto</Text>
              <Text
                className={`text-sm mt-0.5 font-medium ${
                  !countryId ? 'text-gray-400' : 'text-neutral-900'
                }`}
              >
                {selectedState ? selectedState.state_name : 'Opcional'}
              </Text>
            </Pressable>

            <Pressable
              className={`flex-1 border border-gray-300 rounded-md px-3 py-2.5 mb-2.5 bg-white active:bg-gray-50 ${
                !stateId ? 'bg-gray-100 border-gray-200' : ''
              }`}
              onPress={() => stateId && setModalType('city')}
              disabled={!stateId}
              accessibilityRole="button"
              accessibilityLabel="Seleccionar ciudad"
            >
              <Text className="text-[11px] text-gray-600 font-medium uppercase">Ciudad</Text>
              <Text
                className={`text-sm mt-0.5 font-medium ${
                  !stateId ? 'text-gray-400' : 'text-neutral-900'
                }`}
              >
                {selectedCity ? selectedCity.city_name : 'Opcional'}
              </Text>
            </Pressable>
          </View>

          <Pressable
            className="border border-gray-300 rounded-md px-3 py-2.5 mb-2.5 bg-white active:bg-gray-50"
            onPress={() => setModalType('specialties')}
            accessibilityRole="button"
            accessibilityLabel="Seleccionar especialidades"
          >
            <Text className="text-[11px] text-gray-600 font-medium uppercase">Especialidades</Text>
            <Text className="text-sm text-neutral-900 mt-0.5 font-medium">{specialtiesLabel}</Text>
          </Pressable>

          <View className="flex-row mt-1 gap-2">
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
              />
            )}
          </View>
        </View>

        {error ? (
          <View className="bg-red-50 border border-red-200 p-3 m-4 rounded-md">
            <Text className="text-red-700 text-xs font-medium">{error}</Text>
          </View>
        ) : null}

        {/* Listado de resultados */}
        <FlatList
          data={clinics}
          keyExtractor={(item) => String(item.clinic_id)}
          renderItem={renderClinicItem}
          contentContainerClassName="p-4 pb-8"
          refreshControl={
            <RefreshControl
              refreshing={loadingClinics}
              onRefresh={searchClinics}
              tintColor="#259487"
              colors={['#259487']}
            />
          }
          ListEmptyComponent={
            <View className="py-12 px-6 items-center justify-center">
              {loadingClinics ? (
                <Text className="text-sm text-gray-400 text-center">Buscando clínicas...</Text>
              ) : hasSearched ? (
                <View className="items-center">
                  <View className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mb-2">
                    <Ionicons name="search-outline" size={24} color="#9ca3af" />
                  </View>
                  <Text className="text-sm font-semibold text-neutral-900 mb-1 text-center">
                    No se encontraron clínicas
                  </Text>
                  <Text className="text-xs text-gray-500 text-center max-w-[260px]">
                    Intenta cambiar o limpiar los filtros seleccionados para ampliar la búsqueda.
                  </Text>
                </View>
              ) : (
                <View className="items-center">
                  <View className="w-14 h-14 rounded-full bg-teal-50 items-center justify-center mb-3">
                    <Ionicons name="business-outline" size={28} color="#259487" />
                  </View>
                  <Text className="text-base font-bold text-neutral-900 mb-1 text-center">
                    Explora Clínicas Médicas
                  </Text>
                  <Text className="text-xs text-gray-500 text-center max-w-[280px]">
                    Selecciona al menos un país y presiona "Buscar Clínicas" para ver los centros disponibles.
                  </Text>
                </View>
              )}
            </View>
          }
        />
      </View>

      <SelectModal
        title="Selecciona un País"
        items={countryOptions}
        selectedValue={countryId}
        isOpen={modalType === 'country'}
        onClose={() => setModalType(null)}
        onSelect={(val) => {
          setCountryId(val);
          setModalType(null);
        }}
      />

      <SelectModal
        title="Selecciona un Estado / Departamento"
        items={stateOptions}
        selectedValue={stateId}
        isOpen={modalType === 'state'}
        onClose={() => setModalType(null)}
        onSelect={(val) => {
          setStateId(val);
          setModalType(null);
        }}
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

export default ClinicsScreen;
