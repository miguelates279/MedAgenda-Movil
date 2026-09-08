import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { Link, useRouter } from 'expo-router';
import Field from '../src/components/Field';
import Button from '../src/components/Button';
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
      router.replace('/home');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginBottom: 15 }}>
        Login
      </Text>

      {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

      <Field
        control={control}
        name="email"
        label="Email"
        placeholder="email@correo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        rules={{ required: 'Email requerido' }}
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
      />

      <Link href="/register" style={{ color: 'blue', marginTop: 15, textAlign: 'center' }}>
        No tienes cuenta? Regístrate
      </Link>
    </View>
  );
}
