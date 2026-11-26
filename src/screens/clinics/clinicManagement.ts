import type {
  ClinicManagement,
  ClinicMember,
  ClinicMemberRole,
  CreateClinicDto,
} from '../../api/types';

export interface ClinicEditorValues {
  clinic_name: string;
  clinic_address: string;
  clinic_phone_number: string;
  clinic_description: string;
  country_id: number | null;
  state_id: number | null;
  clinic_city_id: number | null;
  is_open: boolean;
  clinic_opening_time: string;
  clinic_close_time: string;
  clinic_average_appointment_time: string;
  break_enabled: boolean;
  clinic_break_time: string;
  clinic_break_duration: string;
  specialty_ids: number[];
}

export const newClinicValues = (): ClinicEditorValues => ({
  clinic_name: '',
  clinic_address: '',
  clinic_phone_number: '',
  clinic_description: '',
  country_id: null,
  state_id: null,
  clinic_city_id: null,
  is_open: false,
  clinic_opening_time: '08:00',
  clinic_close_time: '18:00',
  clinic_average_appointment_time: '30',
  break_enabled: false,
  clinic_break_time: '12:00',
  clinic_break_duration: '60',
  specialty_ids: [],
});

export function clinicEditorValues(
  clinic: ClinicManagement,
): ClinicEditorValues {
  return {
    ...newClinicValues(),
    clinic_name: clinic.clinic_name,
    clinic_address: clinic.clinic_address,
    clinic_phone_number: clinic.clinic_phone_number,
    clinic_description: clinic.clinic_description ?? '',
    country_id: clinic.country_id,
    state_id: clinic.state_id,
    clinic_city_id: clinic.clinic_city_id,
    is_open: !!Number(clinic.is_open),
    clinic_opening_time: clinic.clinic_opening_time ?? '',
    clinic_close_time: clinic.clinic_close_time ?? '',
    clinic_average_appointment_time:
      clinic.clinic_average_appointment_time === null
        ? ''
        : String(clinic.clinic_average_appointment_time),
    break_enabled: Number(clinic.clinic_break_duration) > 0,
    clinic_break_time: clinic.clinic_break_time ?? '',
    clinic_break_duration: String(clinic.clinic_break_duration ?? 0),
    specialty_ids: [...clinic.specialty_ids],
  };
}

export function clinicPayload(values: ClinicEditorValues): CreateClinicDto {
  const time = (value: string, closing = false) => {
    if (closing && value === '24:00') return 1440;
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value))
      throw new Error('Usa el formato de hora HH:mm, por ejemplo 08:00.');
    return Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  };
  const minutes = (value: string) => {
    if (
      !/^\d+$/.test(value) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) < 1
    )
      throw new Error(
        'Las duraciones deben ser números enteros de minutos mayores que cero.',
      );
    return Number(value);
  };
  if (!values.clinic_city_id)
    throw new Error(
      'Selecciona un país, departamento y ciudad para la clínica.',
    );
  const opening = time(values.clinic_opening_time.trim());
  const closing = time(values.clinic_close_time.trim(), true);
  const duration = minutes(values.clinic_average_appointment_time.trim());
  if (closing <= opening || duration > closing - opening)
    throw new Error(
      'El cierre debe ser posterior a la apertura y permitir una cita completa.',
    );
  const breakStart = values.break_enabled
    ? time(values.clinic_break_time.trim())
    : null;
  const breakDuration = values.break_enabled
    ? minutes(values.clinic_break_duration.trim())
    : 0;
  if (
    breakStart !== null &&
    (breakStart < opening || breakStart + breakDuration > closing)
  )
    throw new Error(
      'El descanso debe quedar completamente dentro del horario de atención.',
    );
  return {
    clinic_name: values.clinic_name.trim(),
    clinic_address: values.clinic_address.trim(),
    clinic_phone_number: values.clinic_phone_number.trim(),
    clinic_description: values.clinic_description.trim(),
    clinic_city_id: values.clinic_city_id,
    is_open: values.is_open,
    clinic_opening_time: values.clinic_opening_time.trim(),
    clinic_close_time: values.clinic_close_time.trim(),
    clinic_average_appointment_time: duration,
    clinic_break_time: values.break_enabled
      ? values.clinic_break_time.trim()
      : null,
    clinic_break_duration: breakDuration,
    specialty_ids: [...values.specialty_ids],
  };
}

export function clinicChanges(
  values: ClinicEditorValues,
  original: ClinicManagement | null,
): Partial<CreateClinicDto> {
  const payload = clinicPayload(values);
  if (!original) return payload;
  const previous: Record<string, unknown> = {
    clinic_name: original.clinic_name,
    clinic_address: original.clinic_address,
    clinic_phone_number: original.clinic_phone_number,
    clinic_description: original.clinic_description ?? '',
    clinic_city_id: original.clinic_city_id,
    is_open: !!Number(original.is_open),
    clinic_opening_time: original.clinic_opening_time,
    clinic_close_time: original.clinic_close_time,
    clinic_average_appointment_time: original.clinic_average_appointment_time,
    clinic_break_time: original.clinic_break_time,
    clinic_break_duration: original.clinic_break_duration,
    specialty_ids: [...original.specialty_ids].sort((a, b) => a - b),
  };
  return Object.fromEntries(
    Object.entries(payload).filter(
      ([key, value]) =>
        JSON.stringify(
          key === 'specialty_ids'
            ? [...(value as number[])].sort((a, b) => a - b)
            : value,
        ) !== JSON.stringify(previous[key]),
    ),
  );
}

export const clinicMemberEmail = (member: ClinicMember) =>
  member.user_email_address ?? member.email ?? '';
export const clinicMemberName = (member: ClinicMember) =>
  [
    member.first_name,
    member.second_name,
    member.first_last_name,
    member.second_last_name,
  ]
    .filter(Boolean)
    .join(' ');
export const clinicRoleLabel = (role: ClinicMemberRole | null) =>
  role === 'Owner'
    ? 'Propietario'
    : role === 'Admin'
      ? 'Administrador'
      : role === 'Doctor'
        ? 'Médico'
        : role === 'Employee'
          ? 'Recepción'
          : 'Sin membresía';

export function canManageClinicMember(
  actorRole: 'Owner' | 'Admin',
  actorId: number,
  member: ClinicMember,
): boolean {
  return (
    member.user_id !== actorId &&
    member.role_within_clinic !== 'Owner' &&
    (actorRole === 'Owner' || member.role_within_clinic !== 'Admin')
  );
}
