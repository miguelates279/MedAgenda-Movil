import apiClient from './client';
import { CreateAppointmentDto, DoctorAppointmentView } from './types';

export const appointmentsApi = {
  async getPatientAppointments(): Promise<DoctorAppointmentView[]> {
    return apiClient.get<DoctorAppointmentView[]>('/appointments/patient');
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
    dto: { appointment_description?: string }
  ): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>(`/appointments/${appointmentId}`, dto);
  },

  async cancelAppointment(appointmentId: number): Promise<{ message: string }> {
    return apiClient.delete<{ message: string }>(`/appointments/${appointmentId}`);
  },
};

export default appointmentsApi;
