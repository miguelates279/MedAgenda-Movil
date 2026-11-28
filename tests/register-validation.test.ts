import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  validateEmail,
  validateLegalId,
  validatePhone,
} from '../src/utils/registerValidation';

test('accepts well-formed emails and trims surrounding spaces', () => {
  assert.equal(validateEmail('paciente@medagenda.co'), true);
  assert.equal(validateEmail('  ana.perez@correo.com  '), true);
});

test('rejects empty and malformed emails with a message', () => {
  assert.equal(validateEmail(''), 'El correo es requerido');
  for (const email of ['sin-arroba.com', 'a@b', 'a @b.co', 'a@b.c']) {
    assert.equal(validateEmail(email), 'Ingresa un correo válido', email);
  }
});

test('phone is optional but must have 7 to 15 digits when present', () => {
  assert.equal(validatePhone(''), true);
  assert.equal(validatePhone(undefined), true);
  assert.equal(validatePhone('+57 300 000 0000'), true);
  assert.equal(validatePhone('(606) 887-1234'), true);
  assert.equal(validatePhone('12345'), 'El teléfono debe tener entre 7 y 15 dígitos');
  assert.equal(validatePhone('300-abc-1234'), 'Usa solo números, espacios y +');
});

test('legal id allows cédulas and passports without separators', () => {
  assert.equal(validateLegalId('1053812345'), true);
  assert.equal(validateLegalId('AB123456'), true);
  assert.equal(validateLegalId(''), 'La identificación es requerida');
  assert.equal(
    validateLegalId('1.053.812.345'),
    'Usa entre 5 y 15 letras o números, sin puntos ni espacios',
  );
  assert.notEqual(validateLegalId('123'), true);
});
