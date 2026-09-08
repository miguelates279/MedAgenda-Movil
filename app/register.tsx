import React, { useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { useForm } from 'react-hook-form';
import { Link, useRouter } from 'expo-router';
import Field from '../src/components/Field';
import Button from '../src/components/Button';
import { useAuth } from '../src/context/AuthContext';
import { CreateUserDto } from '../src/api/types';

interface RegisterFormValues extends CreateUserDto {
  confirm_password?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    formState: { isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      first_name: '',
      second_name: '',
      first_last_name: '',
      second_last_name: '',
      legal_id: '',
      user_phone_number: '',
      user_email_address: '',
      password: '',
      confirm_password: '',
    },
  });

  const passwordValue = watch('password');

  const onSubmit = async (data: RegisterFormValues) => {
    setError(null);
    try {
      await signUp({
        first_name: data.first_name,
        second_name: data.second_name || undefined,
        first_last_name: data.first_last_name,
        second_last_name: data.second_last_name,
        legal_id: data.legal_id,
        user_phone_number: data.user_phone_number,
        user_email_address: data.user_email_address,
        password: data.password,
      });

      try {
        await signIn({
          email: data.user_email_address,
          password: data.password,
        });
        router.replace('/home');
      } catch {
        Alert.alert('Registro exitoso', 'Inicia sesión', [
          { text: 'OK', onPress: () => router.replace('/login') },
        ]);
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrarse');
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', marginVertical: 10 }}>
        Registro
      </Text>

      {error ? <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text> : null}

      <Field
        control={control}
        name="first_name"
        label="Nombre"
        placeholder="Nombre"
        rules={{ required: 'Obligatorio' }}
      />

      <Field
        control={control}
        name="second_name"
        label="Segundo nombre"
        placeholder="Segundo nombre"
      />

      <Field
        control={control}
        name="first_last_name"
        label="Primer apellido"
        placeholder="Primer apellido"
        rules={{ required: 'Obligatorio' }}
      />

      <Field
        control={control}
        name="second_last_name"
        label="Segundo apellido"
        placeholder="Segundo apellido"
        rules={{ required: 'Obligatorio' }}
      />

      <Field
        control={control}
        name="legal_id"
        label="Cédula"
        placeholder="Cédula"
        keyboardType="numeric"
        rules={{
          required: 'Obligatorio',
          minLength: { value: 5, message: 'Mínimo 5 dígitos' },
        }}
      />

      <Field
        control={control}
        name="user_phone_number"
        label="Teléfono"
        placeholder="Teléfono"
        keyboardType="phone-pad"
        rules={{ required: 'Obligatorio' }}
      />

      <Field
        control={control}
        name="user_email_address"
        label="Correo"
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        rules={{ required: 'Obligatorio' }}
      />

      <Field
        control={control}
        name="password"
        label="Contraseña"
        placeholder="Contraseña"
        secureTextEntry
        autoCapitalize="none"
        rules={{
          required: 'Obligatorio',
          minLength: { value: 6, message: 'Mínimo 6 caracteres' },
        }}
      />

      <Field
        control={control}
        name="confirm_password"
        label="Confirmar contraseña"
        placeholder="Confirmar contraseña"
        secureTextEntry
        autoCapitalize="none"
        rules={{
          required: 'Obligatorio',
          validate: (val) => val === passwordValue || 'No coinciden',
        }}
      />

      <Button
        text={isSubmitting ? 'Cargando...' : 'Registrar'}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      />

      <Link
        href="/login"
        style={{ color: 'blue', marginVertical: 15, textAlign: 'center' }}
      >
        Ya tienes cuenta? Inicia sesión
      </Link>
    </ScrollView>
  );
}
