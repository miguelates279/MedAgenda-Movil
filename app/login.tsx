import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { Link, useRouter } from 'expo-router';
import { Button, Field } from '../src/components';
import { useAuth } from '../src/context/AuthContext';
import { LoginDto } from '../src/api/types';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginDto>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginDto) => {
    setError(null);
    try {
      await signIn(data);
      router.replace('/clinics' as any);
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <View className="flex-1 p-5 justify-center bg-gray-50">
      <Text className="text-2xl font-bold text-neutral-900 mb-4 text-center">
        Iniciar Sesión
      </Text>

      {error ? <Text className="text-red-600 text-xs mb-2.5 text-center">{error}</Text> : null}

      <Field
        control={control}
        name="email"
        label="Correo electrónico"
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        rules={{ required: 'Correo requerido' }}
      />

      <Field
        control={control}
        name="password"
        label="Contraseña"
        placeholder="Contraseña"
        secureTextEntry
        autoCapitalize="none"
        rules={{ required: 'Contraseña requerida' }}
      />

      <Button
        text={isSubmitting ? 'Cargando...' : 'Iniciar Sesión'}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="mt-2"
      />

      <Link href="/register" className="text-primary text-center mt-4 font-semibold text-sm">
        ¿No tienes cuenta? Regístrate
      </Link>
    </View>
  );
}
