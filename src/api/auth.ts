import apiClient from './client';
import {
  CreateUserDto,
  LoginDto,
  LoginResponse,
  UserProfile,
} from './types';

export const authApi = {
  async login(dto: LoginDto): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>('/auth/login', {
      email: dto.email.trim().toLowerCase(),
      password: dto.password,
    });
  },

  async register(dto: CreateUserDto): Promise<void> {
    const payload: CreateUserDto = {
      ...dto,
      user_email_address: dto.user_email_address.trim().toLowerCase(),
      first_name: dto.first_name.trim(),
      first_last_name: dto.first_last_name.trim(),
      second_last_name: dto.second_last_name.trim(),
      legal_id: dto.legal_id.trim(),
      user_phone_number: dto.user_phone_number.trim(),
    };

    if (dto.second_name && dto.second_name.trim()) {
      payload.second_name = dto.second_name.trim();
    } else {
      delete payload.second_name;
    }

    return apiClient.post<void>('/users/register', payload);
  },

  async getProfile(): Promise<UserProfile> {
    return apiClient.get<UserProfile>('/users/profile');
  },

  async updateProfile(dto: Partial<CreateUserDto>): Promise<UserProfile> {
    return apiClient.put<UserProfile>('/users/profile', dto);
  },

  async changePassword(dto: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }): Promise<{ message: string }> {
    return apiClient.put<{ message: string }>('/users/change-password', dto);
  },
};

export default authApi;
