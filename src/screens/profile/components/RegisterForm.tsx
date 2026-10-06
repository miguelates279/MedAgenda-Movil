import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Field } from '../../../components';
import { useRegisterForm } from '../../../hooks/useRegisterForm';

export interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const { control, handleSubmit, onSubmit, loading, serverError, passwordValue } =
    useRegisterForm();

  return (
    <View className="w-full">
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Field
            control={control}
            name="first_name"
            label="Primer nombre *"
            placeholder="Juan"
            rules={{ required: 'Requerido' }}
          />
        </View>
        <View className="flex-1">
          <Field
            control={control}
            name="second_name"
            label="Segundo nombre"
            placeholder="Carlos"
          />
        </View>
      </View>

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Field
            control={control}
            name="first_last_name"
            label="Primer apellido *"
            placeholder="Pérez"
            rules={{ required: 'Requerido' }}
          />
        </View>
        <View className="flex-1">
          <Field
            control={control}
            name="second_last_name"
            label="Segundo apellido"
            placeholder="García"
          />
        </View>
      </View>

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
          validate: (v: string) => v === passwordValue || 'Las contraseñas no coinciden',
        }}
      />

      {serverError ? (
        <View className="bg-red-50 border border-red-200 rounded-md p-2.5 mb-3">
          <Text className="text-red-700 text-xs font-medium">{serverError}</Text>
        </View>
      ) : null}

      <Button
        text={loading ? 'Registrando...' : 'Crear Cuenta'}
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        className="mt-1"
      />

      <Pressable
        onPress={onSwitchToLogin}
        className="mt-4 py-2 items-center active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Cambiar a inicio de sesión"
      >
        <Text className="text-xs text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <Text className="text-primary font-semibold">Inicia sesión</Text>
        </Text>
      </Pressable>
    </View>
  );
};

export default RegisterForm;
