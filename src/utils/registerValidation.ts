const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_ALLOWED = /^\+?[\d\s()-]+$/;
const LEGAL_ID_PATTERN = /^[A-Za-z0-9]{5,15}$/;

export function validateEmail(value: string): true | string {
  const email = value.trim();
  if (!email) return 'El correo es requerido';
  return EMAIL_PATTERN.test(email) || 'Ingresa un correo válido';
}

export function validatePhone(value: string | undefined): true | string {
  const phone = (value ?? '').trim();
  if (!phone) return true;
  if (!PHONE_ALLOWED.test(phone)) return 'Usa solo números, espacios y +';
  const digits = phone.replace(/\D/g, '').length;
  return (
    (digits >= 7 && digits <= 15) || 'El teléfono debe tener entre 7 y 15 dígitos'
  );
}

export function validateLegalId(value: string): true | string {
  const legalId = value.trim();
  if (!legalId) return 'La identificación es requerida';
  return (
    LEGAL_ID_PATTERN.test(legalId) ||
    'Usa entre 5 y 15 letras o números, sin puntos ni espacios'
  );
}
