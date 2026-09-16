import { useState, useEffect, useCallback } from 'react';
import clinicsApi from '../api/clinics';
import {
  City,
  Clinic,
  ClinicSearchFilters,
  Country,
  Specialty,
  State,
} from '../api/types';

export function useClinicSearch() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);

  const [countryId, setCountryIdState] = useState<number | null>(null);
  const [stateId, setStateIdState] = useState<number | null>(null);
  const [cityId, setCityIdState] = useState<number | null>(null);
  const [selectedSpecialtyIds, setSelectedSpecialtyIds] = useState<number[]>([]);

  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoadingLocations(true);
        const [cList, sList] = await Promise.all([
          clinicsApi.getCountries(),
          clinicsApi.getAllSpecialties(),
        ]);
        if (isMounted) {
          setCountries(cList);
          setSpecialties(sList);
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Error al cargar filtros iniciales');
      } finally {
        if (isMounted) setLoadingLocations(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const setCountryId = useCallback(async (id: number | null) => {
    setCountryIdState(id);
    setStateIdState(null);
    setCityIdState(null);
    setStates([]);
    setCities([]);

    if (id) {
      try {
        const sList = await clinicsApi.getStates(id);
        setStates(sList);
      } catch (err: any) {
        console.warn('Error loading states:', err);
      }
    }
  }, []);

  const setStateId = useCallback(async (id: number | null) => {
    setStateIdState(id);
    setCityIdState(null);
    setCities([]);

    if (id) {
      try {
        const cList = await clinicsApi.getCities(id);
        setCities(cList);
      } catch (err: any) {
        console.warn('Error loading cities:', err);
      }
    }
  }, []);

  const setCityId = useCallback((id: number | null) => {
    setCityIdState(id);
  }, []);

  const toggleSpecialty = useCallback((id: number) => {
    setSelectedSpecialtyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setCountryIdState(null);
    setStateIdState(null);
    setCityIdState(null);
    setSelectedSpecialtyIds([]);
    setClinics([]);
    setHasSearched(false);
  }, []);

  const searchClinics = useCallback(async () => {
    if (!countryId) {
      setError('Debes seleccionar al menos un país para buscar');
      return;
    }

    setLoadingClinics(true);
    setError(null);
    setHasSearched(true);

    try {
      const filters: ClinicSearchFilters = {
        countryId,
        stateId: stateId ?? undefined,
        cityId: cityId ?? undefined,
        specialtyIds: selectedSpecialtyIds.length ? selectedSpecialtyIds : undefined,
      };
      const results = await clinicsApi.getClinics(filters);
      setClinics(results);
    } catch (err: any) {
      setError(err.message || 'Error al buscar clínicas');
      setClinics([]);
    } finally {
      setLoadingClinics(false);
    }
  }, [countryId, stateId, cityId, selectedSpecialtyIds]);

  return {
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
  };
}

export default useClinicSearch;
