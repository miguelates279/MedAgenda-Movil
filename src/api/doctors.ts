import apiClient from './client';
import { DoctorAppointmentView, PatientHistoryRow } from './types';

export const doctorsApi = {
  async isUserDoctorAnywhere(): Promise<boolean> {
    return apiClient.get<boolean>('/doctors/isUserDoctorAnywhere');
  },

  async getDoctorAppointments(): Promise<DoctorAppointmentView[]> {
    return apiClient.get<DoctorAppointmentView[]>('/doctors/getDoctorAppointments');
  },

  async getDoctorPatientHistories(): Promise<PatientHistoryRow[]> {
    return apiClient.get<PatientHistoryRow[]>('/doctors/getDoctorPatientHistories');
  },
};

export default doctorsApi;
