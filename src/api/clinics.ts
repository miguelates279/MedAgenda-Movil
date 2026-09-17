import apiClient from './client';
import {
  City,
  Clinic,
  ClinicScheduleRules,
  ClinicSearchFilters,
  Country,
  PublicDoctor,
  Specialty,
  State,
  AppointmentSlot,
} from './types';

export const clinicsApi = {
  async getCountries(): Promise<Country[]> {
    return apiClient.get<Country[]>('/location/getCountries');
  },

  async getStates(countryId: number): Promise<State[]> {
    return apiClient.get<State[]>(`/location/getStates?country_id=${countryId}`);
  },

  async getCities(stateId: number): Promise<City[]> {
    return apiClient.get<City[]>(`/location/getCities?state_id=${stateId}`);
  },

  async getAllSpecialties(): Promise<Specialty[]> {
    return apiClient.get<Specialty[]>('/clinics/getAllSpecialties');
  },

  async getClinics(filters: ClinicSearchFilters): Promise<Clinic[]> {
    const { countryId, stateId, cityId, specialtyIds } = filters;

    if (specialtyIds && specialtyIds.length > 0) {
      const specialtyQuery = specialtyIds.map(id => `specialty_ids=${id}`).join('&');
      if (cityId) {
        return apiClient.get<Clinic[]>(
          `/clinics/getAllClinicsWithSpecialtiesInCity?${specialtyQuery}&city_id=${cityId}`
        );
      }
      return apiClient.get<Clinic[]>(
        `/clinics/getAllClinicsWithSpecialtiesInCountry?${specialtyQuery}&country_id=${countryId}`
      );
    }

    if (cityId) {
      return apiClient.get<Clinic[]>(`/clinics/getAllClinicsInCity?city_id=${cityId}`);
    }

    if (stateId) {
      return apiClient.get<Clinic[]>(`/clinics/getAllClinicsInState?state_id=${stateId}`);
    }

    return apiClient.get<Clinic[]>(`/clinics/getAllClinicsInCountry?country_id=${countryId}`);
  },

  async getClinicDetails(clinicId: number): Promise<Clinic> {
    return apiClient.get<Clinic>(`/clinics/getClinicDetails?clinic_id=${clinicId}`);
  },

  async getClinicDoctors(clinicId: number): Promise<PublicDoctor[]> {
    return apiClient.get<PublicDoctor[]>(`/clinics/getClinicDoctors?clinic_id=${clinicId}`);
  },

  async getClinicScheduleRules(clinicId: number): Promise<ClinicScheduleRules> {
    return apiClient.get<ClinicScheduleRules>(`/clinics/getClinicScheduleRules?clinic_id=${clinicId}`);
  },

  async getClinicDoctorAppointmentsForDay(
    clinicId: number,
    doctorId: number,
    appointmentDate: string
  ): Promise<AppointmentSlot[]> {
    return apiClient.get<AppointmentSlot[]>(
      `/clinics/getClinicDoctorAppointmentsForDay?clinic_id=${clinicId}&doctor_id=${doctorId}&appointment_date=${appointmentDate}`
    );
  },

  async getUserClinics(): Promise<Clinic[]> {
    return apiClient.get<Clinic[]>('/clinics/userClinics');
  },
};

export default clinicsApi;
