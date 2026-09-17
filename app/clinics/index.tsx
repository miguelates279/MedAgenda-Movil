import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useClinicSearch } from '../../src/hooks/useClinicSearch';
import { Button, ClinicCard, NavBar, SelectModal, SelectOption } from '../../src/components';
import { Clinic } from '../../src/api/types';
import { useAuth } from '../../src/context/AuthContext';
import clinicsApi from '../../src/api/clinics';

export default function ClinicsIndexScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const { isAuthenticated } = useAuth();
  const isOwnerMode = mode === 'mine' && isAuthenticated;
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

  const latestSearchRef = React.useRef(searchClinics);
  const hasSearchedRef = React.useRef(hasSearched);
  const countryIdRef = React.useRef(countryId);
  latestSearchRef.current = searchClinics;
  hasSearchedRef.current = hasSearched;
  countryIdRef.current = countryId;

  useFocusEffect(
    React.useCallback(() => {
      if (isOwnerMode) {
        let active = true;
        setLoadingUserClinics(true);
        setUserClinicsError(null);
        clinicsApi
          .getUserClinics()
          .then((results) => {
            if (active) setUserClinics(results);
          })
          .catch((err: any) => {
            if (active) setUserClinicsError(err.message || 'No se pudieron cargar tus clínicas.');
          })
          .finally(() => {
            if (active) setLoadingUserClinics(false);
          });

        return () => {
          active = false;
        };
      }

      if (hasSearchedRef.current && countryIdRef.current) {
        latestSearchRef.current();
      }
    }, [isOwnerMode])
  );

  const [modalType, setModalType] = useState<
    'country' | 'state' | 'city' | 'specialties' | null
  >(null);
  const [deletingClinicId, setDeletingClinicId] = useState<number | null>(null);
  const [clinicPendingDelete, setClinicPendingDelete] = useState<Clinic | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [userClinics, setUserClinics] = useState<Clinic[]>([]);
  const [loadingUserClinics, setLoadingUserClinics] = useState(false);
  const [userClinicsError, setUserClinicsError] = useState<string | null>(null);

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

  const handleDeleteClinic = (clinic: Clinic) => {
    setDeleteError(null);
    setClinicPendingDelete(clinic);
  };

  const confirmDeleteClinic = async () => {
    if (!clinicPendingDelete) return;

    const clinicId = clinicPendingDelete.clinic_id;
    setDeletingClinicId(clinicId);
    setDeleteError(null);
    try {
      await clinicsApi.deleteClinic(clinicId);
      setUserClinics((current) => current.filter((item) => item.clinic_id !== clinicId));
      setClinicPendingDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'No se pudo eliminar la clínica.');
    } finally {
      setDeletingClinicId(null);
    }
  };

  const renderClinicItem = ({ item }: { item: Clinic }) => (
    <ClinicCard
      key={item.clinic_id}
      onPress={() => router.push(`/clinics/${item.clinic_id}` as any)}
      clinic={item}
      className="mb-3"
      footer={
        isOwnerMode ? (
          <Button
            text={deletingClinicId === item.clinic_id ? 'Eliminando...' : 'Eliminar clínica'}
            variant="danger"
            loading={deletingClinicId === item.clinic_id}
            disabled={deletingClinicId !== null}
            onPress={() => handleDeleteClinic(item)}
          />
        ) : undefined
      }
    />
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <Text className="text-lg font-bold text-neutral-900">
            {isOwnerMode ? 'Mis clínicas' : 'Clínicas'}
          </Text>
          <View className="flex-row items-center gap-2">
            {isAuthenticated ? (
              <Button
                text="+ Nueva"
                onPress={() => router.push('/clinics/new' as any)}
                className="py-2 px-3"
              />
            ) : null}
            <TouchableOpacity
              onPress={() => router.push('/profile' as any)}
              className="w-9 h-9 rounded-full bg-gray-100 border border-gray-200 items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-lg">👤</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View className={isOwnerMode ? 'hidden' : 'bg-white p-4 border-b border-gray-200'}>
          <View className="bg-teal-50 border border-teal-100 rounded-lg p-3 mb-3">
            <Text className="text-xs font-bold text-teal-800 uppercase tracking-wider mb-0.5">
              📅 Agendamiento de Citas
            </Text>
            <Text className="text-xs text-teal-900 leading-relaxed">
              Filtra por ubicación o especialidad para encontrar clínicas y reservar tu cita médica con los doctores disponibles.
            </Text>
          </View>

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

        {isOwnerMode ? (
          <View className="bg-white border-b border-gray-200 px-4 py-3">
            <Text className="text-sm text-gray-600">
              Estas son tus clínicas. Puedes abrir una para ver sus detalles o eliminarla.
            </Text>
          </View>
        ) : null}

        {error || userClinicsError ? (
          <View className="bg-red-50 border border-red-200 p-3 m-4 rounded-md">
            <Text className="text-red-700 text-sm">{error || userClinicsError}</Text>
          </View>
        ) : null}

        <FlatList
          data={isOwnerMode ? userClinics : clinics}
          keyExtractor={(item) => String(item.clinic_id)}
          renderItem={renderClinicItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isOwnerMode ? loadingUserClinics : loadingClinics}
              onRefresh={
                isOwnerMode
                  ? () => {
                      setLoadingUserClinics(true);
                      clinicsApi
                        .getUserClinics()
                        .then(setUserClinics)
                        .catch((err: any) =>
                          setUserClinicsError(err.message || 'No se pudieron cargar tus clínicas.')
                        )
                        .finally(() => setLoadingUserClinics(false));
                    }
                  : searchClinics
              }
              tintColor="#259487"
            />
          }
          ListEmptyComponent={
            <View className="py-10 px-6 items-center justify-center">
              {isOwnerMode ? (
                loadingUserClinics ? (
                  <Text className="text-sm text-gray-400 text-center">Cargando tus clínicas...</Text>
                ) : (
                  <Text className="text-sm text-gray-400 text-center">
                    Aún no has creado clínicas.
                  </Text>
                )
              ) : loadingClinics ? (
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

      <Modal
        visible={clinicPendingDelete !== null}
        transparent
        animationType="fade"
        onRequestClose={() => !deletingClinicId && setClinicPendingDelete(null)}
      >
        <View className="flex-1 bg-black/40 items-center justify-center px-6">
          <View className="w-full bg-white rounded-lg p-5 shadow-md">
            <Text className="text-lg font-bold text-neutral-900">Eliminar clínica</Text>
            <Text className="text-sm text-gray-600 mt-2">
              ¿Quieres eliminar "{clinicPendingDelete?.clinic_name}"? Esta acción no se puede
              deshacer.
            </Text>

            {deleteError ? (
              <View className="bg-red-50 border border-red-200 p-3 mt-3 rounded-md">
                <Text className="text-red-700 text-sm">{deleteError}</Text>
              </View>
            ) : null}

            <View className="flex-row justify-end gap-2 mt-5">
              <Button
                text="Cancelar"
                variant="outline"
                disabled={deletingClinicId !== null}
                onPress={() => setClinicPendingDelete(null)}
              />
              <Button
                text={deletingClinicId !== null ? 'Eliminando...' : 'Eliminar'}
                variant="danger"
                loading={deletingClinicId !== null}
                disabled={deletingClinicId !== null}
                onPress={confirmDeleteClinic}
              />
            </View>
          </View>
        </View>
      </Modal>

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
