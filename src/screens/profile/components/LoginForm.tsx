import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Field } from '../../../components';
import { useLoginForm } from '../../../hooks/useLoginForm';
import { ClaySurface } from '../../../components/ClaySurface';

export interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { control, handleSubmit, onSubmit, loading, serverError } =
    useLoginForm();

  return (
    <View className="w-full">
      <Field
        control={control}
        name="email"
        label="Correo electrónico"
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        rules={{ required: 'El correo electrónico es requerido' }}
      />

      <Field
        control={control}
        name="password"
        label="Contraseña"
        placeholder="••••••••"
        secureTextEntry
        rules={{ required: 'La contraseña es requerida' }}
      />

      {serverError ? (
        <ClaySurface className="bg-med-error-bg border border-med-error-border rounded-clay p-2.5 mb-3">
          <Text className="text-med-error-badge-text text-sm font-medium">
            {serverError}
          </Text>
        </ClaySurface>
      ) : null}

      <Button
        text={loading ? 'Ingresando...' : 'Iniciar Sesión'}
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        className="mt-1"
      />

      <Pressable
        onPress={onSwitchToRegister}
        className="min-h-touch max-w-full justify-center mt-4 py-2 items-center active:opacity-70"
        accessibilityRole="button"
        accessibilityLabel="Cambiar a registro"
      >
        <Text className="text-sm text-med-text-muted">
          ¿No tienes cuenta?{' '}
          <Text className="text-med-primary font-bold">Regístrate</Text>
        </Text>
      </Pressable>
    </View>
  );
};

export default LoginForm;
