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

export type UserClinic = Record<string, unknown>;

export interface AdminClinic {
  clinic_id: number;
  clinic_name: string;
  role_within_clinic: 'Admin' | 'Owner';
  role_description: string | null;
}

export interface CreateClinicDto {
  clinic_name: string;
  clinic_address: string;
  clinic_phone_number: string;
  clinic_description?: string;
  clinic_city_id: number;
  is_open?: boolean;
  clinic_opening_time?: string;
  clinic_close_time?: string;
  clinic_average_appointment_time?: number;
  clinic_break_time?: string | null;
  clinic_break_duration?: number;
  specialty_ids?: number[];
}

export type ClinicMemberRole = 'Owner' | 'Admin' | 'Doctor' | 'Employee';

export interface ClinicManagement extends Clinic {
  clinic_city_id: number;
  country_id: number;
  country_name: string;
  state_id: number;
  state_name: string;
  city_name: string;
  role_within_clinic: 'Owner' | 'Admin';
  clinic_opening_time: string | null;
  clinic_close_time: string | null;
  clinic_average_appointment_time: number | null;
  clinic_break_time: string | null;
  clinic_break_duration: number | null;
  specialty_ids: number[];
}

export interface ClinicMember {
  user_id: number;
  clinic_id: number;
  first_name: string;
  second_name?: string | null;
  first_last_name: string;
  second_last_name?: string | null;
  email?: string;
  user_email_address?: string;
  role_within_clinic: ClinicMemberRole | null;
  is_member: boolean;
  isDoctor: boolean;
  isAdmin: boolean;
  specialties: Specialty[];
  specialty_id?: number | null;
}

export interface UpdateClinicMemberDto {
  clinic_id: number;
  email: string;
  isDoctor: boolean;
  isAdmin: boolean;
  specialty_id?: number;
}

export interface UpdateClinicOwnerProviderDto {
  isDoctor: boolean;
  specialty_id?: number;
}

export interface CreateClinicResponse {
  clinic_id: number;
}

export interface ClinicScheduleRules {
  is_open?: boolean;
  minimum_advance_minutes?: number;
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

export type AppointmentAvailabilityStatus =
  | 'available'
  | 'booked'
  | 'break'
  | 'past'
  | 'too_soon'
  | 'unavailable'
  | 'current';

export interface AppointmentAvailability {
  clinic_id: number;
  doctor_id: number;
  date: string;
  time_zone: 'America/Bogota';
  server_now: string;
  minimum_advance_minutes: number;
  duration_minutes: number;
  unavailable_reason: 'closed' | 'weekend' | null;
  slots: {
    start_date_time: string;
    end_date_time: string;
    status: AppointmentAvailabilityStatus;
  }[];
}

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'waiting'
  | 'called'
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_show';

export type AppointmentAction =
  'confirm' | 'check_in' | 'call' | 'start' | 'complete' | 'no_show' | 'cancel';

export interface AppointmentState {
  appointment_id: number;
  appointment_status: AppointmentStatus;
  status_version: number;
  status_updated_at: string | null;
  allowed_actions: AppointmentAction[];
  can_reschedule: boolean;
  can_edit_notes: boolean;
  minimum_advance_minutes: number;
  change_deadline: string;
  server_now?: string;
}

export interface DispatchClinic {
  clinic_id: number;
  clinic_name: string;
  role_within_clinic: 'Owner' | 'Admin' | 'Employee';
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
  patient_id?: number;
  doctor_first_name?: string;
  doctor_second_name?: string | null;
  doctor_first_last_name?: string;
  doctor_second_last_name?: string;
  appointment_status?: AppointmentStatus;
  status_version?: number;
  status_updated_at?: string | null;
  allowed_actions?: AppointmentAction[];
  can_reschedule?: boolean;
  can_edit_notes?: boolean;
  minimum_advance_minutes?: number;
  change_deadline?: string;
  server_now?: string;
}

export interface CreateAppointmentDto {
  clinic_id: number;
  doctor_id: number;
  start_date_time: string | Date;
  end_date_time: string | Date;
  appointment_description?: string;
}

export interface UpdateAppointmentDto {
  expected_version?: number;
  appointment_description?: string;
  start_date_time?: string;
  end_date_time?: string;
}

export interface ClinicSearchFilters {
  countryId: number;
  stateId?: number | null;
  cityId?: number | null;
  specialtyIds?: number[];
}

export interface PatientHistoryRow {
  user_id: number;
  first_name: string;
  second_name?: string | null;
  first_last_name: string;
  second_last_name?: string | null;
  appointment_date: string;
  appointment_description?: string;
  clinic_id: number;
  clinic_name: string;
}

export interface PrescriptionUserView {
  prescription_id?: number;
  clinic_name: string;
  clinic_id: number;
  date_emitted: string;
  doctor_first_name: string;
  doctor_second_name?: string | null;
  doctor_last_name: string;
  prescription_description: string;
}

export interface PrescriptionDoctorView {
  prescription_id?: number;
  patient_id: number;
  clinic_id: number;
  date_emitted: string;
  prescription_description: string;
}

export interface PrescriptionDocument {
  prescription_id: number;
  clinic_id: number;
  clinic_name: string;
  clinic_address: string;
  clinic_phone: string | null;
  doctor_id: number;
  doctor_name: string;
  patient_id: number;
  patient_name: string;
  date_emitted: string;
  prescription_description: string;
}

export interface CreatePrescriptionDto {
  patient_id: number;
  clinic_id: number;
  prescription_description: string;
}

export interface UpdatePrescriptionDto {
  prescription_description: string;
}

export interface PatientHistoryGroup {
  patientId: number;
  patientName: string;
  clinics: { clinicId: number; clinicName: string }[];
  records: {
    appointmentDate: string;
    displayDate: string;
    description?: string;
    clinicId: number;
    clinicName: string;
  }[];
  prescriptions: {
    prescriptionId?: number;
    date: string;
    displayDate: string;
    description: string;
    clinicId: number;
  }[];
}
