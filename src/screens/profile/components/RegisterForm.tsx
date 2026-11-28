import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Controller } from 'react-hook-form';
import { Button, Field } from '../../../components';
import { tokens } from '../../../theme/tokens';
import { DataPolicyModal } from './DataPolicyModal';
import { useRegisterForm } from '../../../hooks/useRegisterForm';
import { ClaySurface } from '../../../components/ClaySurface';

export interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSwitchToLogin,
}) => {
  const {
    control,
    handleSubmit,
    onSubmit,
    loading,
    serverError,
    passwordValue,
  } = useRegisterForm();
  const [policyVisible, setPolicyVisible] = useState(false);

  return (
    <View className="w-full">
      <Field
        control={control}
        name="first_name"
        label="Primer nombre *"
        placeholder="Juan"
        rules={{ required: 'Requerido' }}
      />

      <Field
        control={control}
        name="second_name"
        label="Segundo nombre"
        placeholder="Carlos"
      />

      <Field
        control={control}
        name="first_last_name"
        label="Primer apellido *"
        placeholder="Pérez"
        rules={{ required: 'Requerido' }}
      />

      <Field
        control={control}
        name="second_last_name"
        label="Segundo apellido"
        placeholder="García"
      />

      <Field
        control={control}
        name="legal_id"
        label="Identificación *"
        placeholder="Cédula o pasaporte"
        rules={{ required: 'La identificación es requerida' }}
      />

      <Field
        control={control}
        name="user_phone_number"
        label="Teléfono"
        placeholder="+57 300 000 0000"
        keyboardType="phone-pad"
      />

      <Field
        control={control}
        name="user_email_address"
        label="Correo electrónico *"
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        rules={{ required: 'El correo es requerido' }}
      />

      <Field
        control={control}
        name="password"
        label="Contraseña *"
        placeholder="••••••••"
        secureTextEntry
        rules={{
          required: 'La contraseña es requerida',
          minLength: { value: 6, message: 'Mínimo 6 caracteres' },
        }}
      />

      <Field
        control={control}
        name="confirm_password"
        label="Confirmar contraseña *"
        placeholder="••••••••"
        secureTextEntry
        rules={{
          required: 'Confirma tu contraseña',
          validate: (v: string) =>
            v === passwordValue || 'Las contraseñas no coinciden',
        }}
      />

      <Controller
        control={control}
        name="data_consent"
        rules={{
          validate: (value: boolean) =>
            value === true ||
            'Debes autorizar el tratamiento de datos para continuar',
        }}
        render={({ field, fieldState }) => (
          <View className="mb-3">
            <Pressable
              onPress={() => field.onChange(!field.value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: !!field.value }}
              accessibilityLabel="Autorizo el tratamiento de mis datos personales"
              className="min-h-touch flex-row items-start py-1 active:opacity-70"
            >
              <Ionicons
                name={field.value ? 'checkbox' : 'square-outline'}
                size={tokens.iconSize[22]}
                color={
                  fieldState.error
                    ? tokens.colors.error.accent
                    : tokens.colors.primary
                }
              />
              <Text className="min-w-0 flex-1 text-sm text-med-text-main ml-2 leading-5">
                Autorizo el tratamiento de mis datos personales, incluidos
                los datos de salud, según la Ley 1581 de 2012. *
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setPolicyVisible(true)}
              accessibilityRole="link"
              className="min-h-touch justify-center self-start ml-8 active:opacity-70"
            >
              <Text className="text-sm font-bold text-med-primary">
                Leer la política de tratamiento de datos
              </Text>
            </Pressable>
            {fieldState.error ? (
              <Text className="mt-1 text-xs text-med-error-text">
                {fieldState.error.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      {serverError ? (
        <ClaySurface className="bg-med-error-bg border border-med-error-border rounded-clay p-2.5 mb-3">
          <Text className="text-med-error-badge-text text-sm font-medium">
            {serverError}
          </Text>
        </ClaySurface>
      ) : null}

      <Button
        text={loading ? 'Registrando...' : 'Crear Cuenta'}
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        className="mt-1"
      />

      <Pressable
        onPress={onSwitchToLogin}
        className="min-h-touch max-w-full justify-center mt-4 py-2 items-center active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Cambiar a inicio de sesión"
      >
        <Text className="text-sm text-med-text-muted">
          ¿Ya tienes cuenta?{' '}
          <Text className="text-med-primary font-bold">Inicia sesión</Text>
        </Text>
      </Pressable>

      <DataPolicyModal
        visible={policyVisible}
        onClose={() => setPolicyVisible(false)}
      />
    </View>
  );
};

export default RegisterForm;
