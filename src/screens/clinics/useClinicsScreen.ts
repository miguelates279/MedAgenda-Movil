import { useEffect, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useClinicSearch } from '../../hooks/useClinicSearch';

export type ClinicFilterPanel =
  'filters' | 'country' | 'state' | 'city' | 'specialties';

export function useClinicsScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const search = useClinicSearch();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panel, setPanel] = useState<ClinicFilterPanel>('filters');
  const [changingLocation, setChangingLocation] = useState(false);
  const [lastSearch, setLastSearch] = useState<{
    summary: string;
    signature: string;
  } | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const country = search.countries.find(
    (item) => item.country_id === search.countryId,
  );
  const state = search.states.find((item) => item.state_id === search.stateId);
  const city = search.cities.find((item) => item.city_id === search.cityId);
  const selectedSpecialties = search.specialties.filter((item) =>
    search.selectedSpecialtyIds.includes(item.specialty_id),
  );
  const specialtiesLabel =
    selectedSpecialties.length === 1
      ? selectedSpecialties[0].specialty_name
      : search.selectedSpecialtyIds.length
        ? `${search.selectedSpecialtyIds.length} especialidades`
        : 'Todas las especialidades';
  const currentSummary = [
    country?.country_name,
    state?.state_name,
    city?.city_name,
    search.selectedSpecialtyIds.length ? specialtiesLabel : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const signature = JSON.stringify([
    search.countryId,
    search.stateId,
    search.cityId,
    [...search.selectedSpecialtyIds].sort((a, b) => a - b),
  ]);
  const filterCount =
    [search.countryId, search.stateId, search.cityId].filter(Boolean).length +
    search.selectedSpecialtyIds.length;

  const openFilters = (next: ClinicFilterPanel = 'filters') => {
    Keyboard.dismiss();
    setPanel(next);
    setFiltersOpen(true);
  };
  const closeFilters = () => {
    Keyboard.dismiss();
    setFiltersOpen(false);
  };
  const showFilters = () => {
    Keyboard.dismiss();
    setPanel('filters');
  };
  const selectCountry = async (value: number) => {
    setChangingLocation(true);
    showFilters();
    try {
      await search.setCountryId(value);
    } finally {
      if (mounted.current) setChangingLocation(false);
    }
  };
  const selectState = async (value: number) => {
    setChangingLocation(true);
    showFilters();
    try {
      await search.setStateId(value);
    } finally {
      if (mounted.current) setChangingLocation(false);
    }
  };
  const submitSearch = async () => {
    if (search.loadingClinics || changingLocation || !search.countryId) return;
    setLastSearch({ summary: currentSummary, signature });
    closeFilters();
    await search.searchClinics();
  };
  const clearFilters = () => {
    if (changingLocation || search.loadingClinics) return;
    search.clearFilters();
    setLastSearch(null);
    showFilters();
  };
  const refresh = () => {
    if (search.loadingClinics) return;
    if (search.countryId) void submitSearch();
    else openFilters('country');
  };

  return {
    isAuthenticated,
    openProfile: () => router.push('/profile' as any),
    openCreateClinic: () => router.push('/clinics/new' as any),
    openClinic: (id: number) => router.push(`/clinics/${id}` as any),
    clinics: search.clinics,
    loadingClinics: search.loadingClinics,
    error: search.error,
    hasSearched: search.hasSearched,
    summary:
      lastSearch?.summary ||
      currentSummary ||
      'Elige ubicación y especialidades',
    hasPendingFilters: !!lastSearch && lastSearch.signature !== signature,
    filterCount,
    openFilters,
    refresh,
    filters: {
      open: filtersOpen,
      panel,
      countryId: search.countryId,
      stateId: search.stateId,
      cityId: search.cityId,
      selectedSpecialtyIds: search.selectedSpecialtyIds,
      countryLabel: country?.country_name || 'Selecciona un país',
      stateLabel: state?.state_name || 'Opcional',
      cityLabel: city?.city_name || 'Opcional',
      specialtiesLabel,
      countries: search.countries.map((item) => ({
        label: item.country_name,
        value: item.country_id,
      })),
      states: search.states.map((item) => ({
        label: item.state_name,
        value: item.state_id,
      })),
      cities: search.cities.map((item) => ({
        label: item.city_name,
        value: item.city_id,
      })),
      specialties: search.specialties.map((item) => ({
        label: item.specialty_name,
        value: item.specialty_id,
      })),
      loadingOptions: search.loadingLocations || changingLocation,
      loadingClinics: search.loadingClinics,
      canSearch:
        !!search.countryId &&
        !changingLocation &&
        !search.loadingLocations &&
        !search.loadingClinics,
      canClear: filterCount > 0 && !changingLocation && !search.loadingClinics,
      close: closeFilters,
      showFilters,
      openPanel: (next: ClinicFilterPanel) => {
        if (!changingLocation) setPanel(next);
      },
      selectCountry,
      selectState,
      selectCity: (value: number) => {
        search.setCityId(value);
        showFilters();
      },
      selectSpecialties: (values: number[]) => {
        search.setSelectedSpecialtyIds(values);
        showFilters();
      },
      submit: submitSearch,
      clear: clearFilters,
    },
  };
}
