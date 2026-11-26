import apiClient from './client';
import {
  City,
  Clinic,
  ClinicManagement,
  CreateClinicDto,
  CreateClinicResponse,
  ClinicScheduleRules,
  ClinicSearchFilters,
  Country,
  PublicDoctor,
  Specialty,
  State,
  AppointmentSlot,
  UserClinic,
  UpdateClinicOwnerProviderDto,
} from './types';

export const clinicsApi = {
  async createClinic(dto: CreateClinicDto): Promise<CreateClinicResponse> {
    const payload = {
      clinic_name: dto.clinic_name.trim(),
      clinic_address: dto.clinic_address.trim(),
      clinic_phone_number: dto.clinic_phone_number.trim(),
      clinic_description: dto.clinic_description?.trim() || undefined,
      clinic_city_id: dto.clinic_city_id,
      is_open: dto.is_open,
      clinic_opening_time: dto.clinic_opening_time,
      clinic_close_time: dto.clinic_close_time,
      clinic_average_appointment_time: dto.clinic_average_appointment_time,
      clinic_break_time: dto.clinic_break_time,
      clinic_break_duration: dto.clinic_break_duration,
      specialty_ids: dto.specialty_ids,
    };

    return apiClient.post<CreateClinicResponse>(
      '/clinics/createClinic',
      payload,
    );
  },

  async getManagement(clinicId: number): Promise<ClinicManagement> {
    return apiClient.get<ClinicManagement>(`/clinics/${clinicId}/management`);
  },

  async updateClinic(
    clinicId: number,
    dto: Partial<CreateClinicDto>,
  ): Promise<unknown> {
    return apiClient.put(`/clinics/${clinicId}/management`, dto);
  },

  async deleteClinic(clinicId: number): Promise<void> {
    await apiClient.delete<void>(`/clinics/${clinicId}`);
  },

  async updateOwnerProvider(
    clinicId: number,
    dto: UpdateClinicOwnerProviderDto,
  ): Promise<unknown> {
    return apiClient.put(`/clinics/${clinicId}/owner-provider`, dto);
  },

  async getUserClinics(): Promise<(Clinic & UserClinic)[]> {
    return apiClient.get<(Clinic & UserClinic)[]>('/clinics/my-clinics');
  },

  async getCountries(): Promise<Country[]> {
    return apiClient.get<Country[]>('/location/getCountries');
  },

  async getStates(countryId: number): Promise<State[]> {
    return apiClient.get<State[]>(
      `/location/getStates?country_id=${countryId}`,
    );
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
      const specialtyQuery = specialtyIds
        .map((id) => `specialty_ids=${id}`)
        .join('&');
      if (cityId) {
        return apiClient.get<Clinic[]>(
          `/clinics/getAllClinicsWithSpecialtiesInCity?${specialtyQuery}&city_id=${cityId}`,
        );
      }
      return apiClient.get<Clinic[]>(
        `/clinics/getAllClinicsWithSpecialtiesInCountry?${specialtyQuery}&country_id=${countryId}`,
      );
    }

    if (cityId) {
      return apiClient.get<Clinic[]>(
        `/clinics/getAllClinicsInCity?city_id=${cityId}`,
      );
    }

    if (stateId) {
      return apiClient.get<Clinic[]>(
        `/clinics/getAllClinicsInState?state_id=${stateId}`,
      );
    }

    return apiClient.get<Clinic[]>(
      `/clinics/getAllClinicsInCountry?country_id=${countryId}`,
    );
  },

  async getClinicDetails(clinicId: number): Promise<Clinic> {
    return apiClient.get<Clinic>(
      `/clinics/getClinicDetails?clinic_id=${clinicId}`,
    );
  },

  async getClinicDoctors(clinicId: number): Promise<PublicDoctor[]> {
    return apiClient.get<PublicDoctor[]>(
      `/clinics/getClinicDoctors?clinic_id=${clinicId}`,
    );
  },

  async getClinicScheduleRules(clinicId: number): Promise<ClinicScheduleRules> {
    return apiClient.get<ClinicScheduleRules>(
      `/clinics/getClinicScheduleRules?clinic_id=${clinicId}`,
    );
  },

  async getClinicDoctorAppointmentsForDay(
    clinicId: number,
    doctorId: number,
    appointmentDate: string,
  ): Promise<AppointmentSlot[]> {
    return apiClient.get<AppointmentSlot[]>(
      `/clinics/getClinicDoctorAppointmentsForDay?clinic_id=${clinicId}&doctor_id=${doctorId}&appointment_date=${appointmentDate}`,
    );
  },
};

export default clinicsApi;
