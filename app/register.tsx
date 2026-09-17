import React, { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { useForm } from 'react-hook-form';
import { Link, useRouter } from 'expo-router';
import { Button, Field } from '../src/components';
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
        router.replace('/clinics' as any);
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
    <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} className="flex-1 bg-gray-50">
      <Text className="text-2xl font-bold text-neutral-900 my-3 text-center">
        Crear Cuenta
      </Text>

      {error ? <Text className="text-red-600 text-xs mb-2.5 text-center">{error}</Text> : null}

      <View className="flex-row gap-2">
        <View className="flex-1">
          <Field
            control={control}
            name="first_name"
            label="Primer nombre *"
            placeholder="Juan"
            rules={{ required: 'Obligatorio' }}
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
            rules={{ required: 'Obligatorio' }}
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
        label="Identificación / Cédula *"
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
        placeholder="+57 300 000 0000"
        keyboardType="phone-pad"
        rules={{ required: 'Obligatorio' }}
      />

      <Field
        control={control}
        name="user_email_address"
        label="Correo electrónico *"
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        rules={{ required: 'Obligatorio' }}
      />

      <Field
        control={control}
        name="password"
        label="Contraseña *"
        placeholder="••••••••"
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
        label="Confirmar contraseña *"
        placeholder="••••••••"
        secureTextEntry
        autoCapitalize="none"
        rules={{
          required: 'Obligatorio',
          validate: (val) => val === passwordValue || 'Las contraseñas no coinciden',
        }}
      />

      <Button
        text={isSubmitting ? 'Cargando...' : 'Registrar'}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
        className="mt-2"
      />

      <Link
        href="/login"
        className="text-primary text-center my-4 font-semibold text-sm"
      >
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </ScrollView>
  );
}
