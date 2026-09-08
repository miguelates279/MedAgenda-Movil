export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  isAdmin: boolean;
  isDoctor: boolean;
}

export interface CreateUserDto {
  first_name: string;
  second_name?: string | null;
  first_last_name: string;
  second_last_name: string;
  legal_id: string;
  user_phone_number: string;
  user_email_address: string;
  password: string;
  birth_date?: string;
  gender?: 'M' | 'F' | 'O';
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface UserProfile {
  user_id: number;
  first_name: string;
  second_name?: string | null;
  first_last_name: string;
  second_last_name: string;
  legal_id: string;
  user_phone_number: string;
  user_email_address: string;
  birth_date?: string | null;
  gender?: 'M' | 'F' | 'O' | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ApiErrorResponse {
  statusCode?: number;
  message?: string | string[];
  error?: string;
}
