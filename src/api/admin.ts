import apiClient from './client';
import { AdminClinic, ClinicMember, UpdateClinicMemberDto } from './types';

export const adminApi = {
  async getMyClinics(): Promise<AdminClinic[]> {
    return apiClient.get<AdminClinic[]>('/admin/my-clinics');
  },

  async getClinicMembers(clinicId: number): Promise<ClinicMember[]> {
    return apiClient.get<ClinicMember[]>(
      `/admin/clinic-users?clinic_id=${clinicId}`,
    );
  },

  async findUser(clinicId: number, email: string): Promise<ClinicMember> {
    return apiClient.get<ClinicMember>(
      `/admin/search-user?clinic_id=${clinicId}&email=${encodeURIComponent(email.trim())}`,
    );
  },

  async saveMember(dto: UpdateClinicMemberDto): Promise<unknown> {
    return apiClient.put('/admin/update-user-role', dto);
  },

  async removeMember(clinicId: number, userId: number): Promise<void> {
    await apiClient.delete(`/admin/clinics/${clinicId}/members/${userId}`);
  },
};

export default adminApi;
