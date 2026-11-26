import apiClient from './client';
import {
  AppointmentAction,
  AppointmentAvailability,
  AppointmentState,
  CreateAppointmentDto,
  DispatchClinic,
  DoctorAppointmentView,
  UpdateAppointmentDto,
} from './types';

export const appointmentsApi = {
  async getAvailability(
    clinicId: number,
    doctorId: number,
    date: string,
  ): Promise<AppointmentAvailability> {
    return apiClient.get<AppointmentAvailability>(
      `/appointments/availability/day?clinic_id=${clinicId}&doctor_id=${doctorId}&date=${encodeURIComponent(date)}`,
      undefined,
      { skipAuth: true },
    );
  },

  async getRescheduleAvailability(
    appointmentId: number,
    date: string,
  ): Promise<AppointmentAvailability> {
    return apiClient.get<AppointmentAvailability>(
      `/appointments/${appointmentId}/availability?date=${encodeURIComponent(date)}`,
    );
  },

  async getDispatchClinics(): Promise<DispatchClinic[]> {
    return apiClient.get<DispatchClinic[]>('/appointments/dispatch-clinics');
  },
  async getPatientAppointments(): Promise<DoctorAppointmentView[]> {
    return apiClient.get<DoctorAppointmentView[]>('/appointments/patient');
  },

  async getAppointment(appointmentId: number): Promise<DoctorAppointmentView> {
    return apiClient.get<DoctorAppointmentView>(
      `/appointments/${appointmentId}`,
    );
  },

  async getClinicAppointments(
    clinicId: number,
    date: string,
  ): Promise<DoctorAppointmentView[]> {
    return apiClient.get<DoctorAppointmentView[]>(
      `/appointments/clinic/${clinicId}?date=${encodeURIComponent(date)}`,
    );
  },

  async performAction(
    appointmentId: number,
    action: AppointmentAction,
    expectedVersion: number,
  ): Promise<AppointmentState> {
    return apiClient.post<AppointmentState>(
      `/appointments/${appointmentId}/actions`,
      {
        action,
        expected_version: expectedVersion,
      },
    );
  },

  async scheduleAppointment(dto: CreateAppointmentDto): Promise<void> {
    const payload = {
      clinic_id: dto.clinic_id,
      doctor_id: dto.doctor_id,
      start_date_time:
        typeof dto.start_date_time === 'string'
          ? dto.start_date_time
          : dto.start_date_time.toISOString(),
      end_date_time:
        typeof dto.end_date_time === 'string'
          ? dto.end_date_time
          : dto.end_date_time.toISOString(),
      appointment_description: dto.appointment_description?.trim() || undefined,
    };

    return apiClient.post<void>('/appointments/scheduleAppointment', payload);
  },

  async updateAppointment(
    appointmentId: number,
    dto: UpdateAppointmentDto,
  ): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(
      `/appointments/${appointmentId}`,
      dto,
    );
  },

  async cancelAppointment(appointmentId: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(
      `/appointments/${appointmentId}`,
    );
  },
};

export default appointmentsApi;
