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

export interface Country {
  country_id: number;
  country_name: string;
}

export interface State {
  state_id: number;
  state_name: string;
  country_id?: number;
}

export interface City {
  city_id: number;
  city_name: string;
  state_id?: number;
}

export interface Specialty {
  specialty_id: number;
  specialty_name: string;
  specialty_description?: string;
}

export interface PublicDoctor {
  doctor_id: number;
  first_name: string;
  second_name?: string | null;
  first_last_name: string;
  second_last_name: string;
  specialties?: Specialty[];
}

export interface Clinic {
  clinic_id: number;
  clinic_name: string;
  clinic_address: string;
  clinic_phone_number: string;
  clinic_description?: string;
  city_id?: number;
  is_open?: boolean;
}

export interface ClinicScheduleRules {
  clinic_opening_time: string;
  clinic_close_time: string;
  clinic_average_appointment_time: string;
  clinic_break_time?: string;
  clinic_break_duration?: string;
}

export interface AppointmentSlot {
  appointment_id?: number;
  start_date_time: string;
  end_date_time: string;
}

export interface DoctorAppointmentView {
  appointment_id: number;
  start_date_time: string;
  end_date_time: string;
  appointment_description?: string;
  first_name: string;
  second_name?: string | null;
  first_last_name: string;
  second_last_name: string;
  clinic_name: string;
  clinic_id?: number;
  doctor_id?: number;
}

export interface CreateAppointmentDto {
  clinic_id: number;
  doctor_id: number;
  start_date_time: string | Date;
  end_date_time: string | Date;
  appointment_description?: string;
}

export interface UpdateAppointmentDto {
  appointment_description?: string;
}

export interface ClinicSearchFilters {
  countryId: number;
  stateId?: number | null;
  cityId?: number | null;
  specialtyIds?: number[];
}
