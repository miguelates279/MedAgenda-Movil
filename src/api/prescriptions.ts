import apiClient from './client';
import {
  CreatePrescriptionDto,
  PrescriptionDoctorView,
  PrescriptionDocument,
  PrescriptionUserView,
  UpdatePrescriptionDto,
} from './types';

export const prescriptionsApi = {
  async getPrescriptionDocument(
    prescriptionId: number,
  ): Promise<PrescriptionDocument> {
    return apiClient.get<PrescriptionDocument>(
      `/prescriptions/${prescriptionId}/document`,
    );
  },

  async getUserPrescriptions(): Promise<PrescriptionUserView[]> {
    return apiClient.get<PrescriptionUserView[]>(
      '/prescriptions/getUserPrescriptions',
    );
  },

  async getDoctorPrescriptions(
    clinicId?: number,
  ): Promise<PrescriptionDoctorView[]> {
    const url = clinicId
      ? `/prescriptions/getPrescriptionsAssignedByDoctor?clinic_id=${clinicId}`
      : '/prescriptions/getPrescriptionsAssignedByDoctor';
    return apiClient.get<PrescriptionDoctorView[]>(url);
  },

  async assignPrescription(dto: CreatePrescriptionDto): Promise<void> {
    return apiClient.post<void>('/prescriptions/assignPrescription', dto);
  },

  async updatePrescription(
    prescriptionId: number,
    dto: UpdatePrescriptionDto,
  ): Promise<void> {
    return apiClient.put<void>(`/prescriptions/${prescriptionId}`, dto);
  },

  async deletePrescription(prescriptionId: number): Promise<void> {
    return apiClient.delete<void>(`/prescriptions/${prescriptionId}`);
  },
};

export default prescriptionsApi;
