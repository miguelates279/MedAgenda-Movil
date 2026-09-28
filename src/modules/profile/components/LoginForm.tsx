import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Button, Field } from '../../../components';
import { useLoginForm } from '../../../hooks/useLoginForm';

export interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const { control, handleSubmit, onSubmit, loading, serverError } = useLoginForm();

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
        <View className="bg-red-50 border border-red-200 rounded-md p-2.5 mb-3">
          <Text className="text-red-700 text-xs font-medium">{serverError}</Text>
        </View>
      ) : null}

      <Button
        text={loading ? 'Ingresando...' : 'Iniciar Sesión'}
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        className="mt-1"
      />
    </View>
  );
};

export default LoginForm;
