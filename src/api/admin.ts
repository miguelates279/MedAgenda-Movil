import apiClient from './client';
import { AdminClinic } from './types';

export const adminApi = {
  async getMyClinics(): Promise<AdminClinic[]> {
    return apiClient.get<AdminClinic[]>('/admin/my-clinics');
  },
};

export default adminApi;
