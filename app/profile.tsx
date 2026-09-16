import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useAuth } from '../src/context/AuthContext';
import { LoginDto, CreateUserDto } from '../src/api/types';
import { Badge, Button, Field, NavBar } from '../src/components';

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const { signIn } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit } = useForm<LoginDto>({
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginDto) => {
    setServerError('');
    setLoading(true);
    try {
      await signIn(data);
      router.replace('/clinics' as any);
    } catch (err: any) {
      setServerError(err.message || 'Credenciales incorrectas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="w-full">
      <Field
        control={control}
        name="email"
        label="Correo electrónico"
        placeholder="correo@ejemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        rules={{ required: 'El correo es requerido' }}
      />
      <Field
        control={control}
        name="password"
        label="Contraseña"
        placeholder="••••••••"
        secureTextEntry
        rules={{ required: 'La contraseña es requerida' }}
      />

      {serverError ? <Text className="text-red-600 text-xs mb-2.5">{serverError}</Text> : null}

      <Button
        text={loading ? 'Ingresando...' : 'Iniciar Sesión'}
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        className="mt-1"
      />

      <TouchableOpacity onPress={onSwitch} className="mt-4 items-center" activeOpacity={0.7}>
        <Text className="text-xs text-gray-500">
          ¿No tienes cuenta? <Text className="text-primary font-semibold">Regístrate</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const { signUp } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, watch } = useForm<CreateUserDto & { confirm_password: string }>({
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

  const onSubmit = async (data: CreateUserDto & { confirm_password: string }) => {
    setServerError('');
    setLoading(true);
    try {
      const { confirm_password, ...dto } = data;
      await signUp(dto);
      router.replace('/clinics' as any);
    } catch (err: any) {
      setServerError(err.message || 'Error al registrar. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

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
        rules={{ required: 'La contraseña es requerida', minLength: { value: 6, message: 'Mínimo 6 caracteres' } }}
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

      {serverError ? <Text className="text-red-600 text-xs mb-2.5">{serverError}</Text> : null}

      <Button
        text={loading ? 'Registrando...' : 'Crear Cuenta'}
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        className="mt-1"
      />

      <TouchableOpacity onPress={onSwitch} className="mt-4 items-center" activeOpacity={0.7}>
        <Text className="text-xs text-gray-500">
          ¿Ya tienes cuenta? <Text className="text-primary font-semibold">Inicia sesión</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProfileScreen() {
  const { isAuthenticated, user, roles, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'register'>('login');

  const fullName = user
    ? [user.first_name, user.second_name, user.first_last_name, user.second_last_name]
        .filter(Boolean)
        .join(' ')
    : '';

  const handleLogout = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          signOut();
          router.replace('/clinics' as any);
        },
      },
    ]);
  };

  if (isAuthenticated && user) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-1 bg-gray-50">
          <View className="px-4 py-3.5 bg-white border-b border-gray-200">
            <Text className="text-xl font-bold text-neutral-900">Mi Perfil</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
            <View className="items-center py-6">
              <View className="w-20 h-20 rounded-full bg-primary items-center justify-center mb-2.5">
                <Text className="text-white text-2xl font-bold uppercase">
                  {(user.first_name?.[0] ?? '') + (user.first_last_name?.[0] ?? '')}
                </Text>
              </View>
              <Text className="text-lg font-bold text-neutral-900 mb-0.5">{fullName}</Text>
              <Text className="text-xs text-gray-500 mb-2">{user.user_email_address}</Text>
              <View className="flex-row gap-1.5">
                {roles?.isAdmin && <Badge text="Admin" variant="primary" />}
                {roles?.isDoctor && <Badge text="Doctor" variant="info" />}
                {!roles?.isAdmin && !roles?.isDoctor && (
                  <Badge text="Paciente" variant="success" />
                )}
              </View>
            </View>

            <View className="bg-white rounded-lg border border-gray-200 mb-5">
              <View className="flex-row justify-between items-center px-3.5 py-3">
                <Text className="text-xs text-gray-500 font-medium">Identificación</Text>
                <Text className="text-xs text-neutral-900 font-semibold max-w-[65%] text-right">
                  {user.legal_id || '—'}
                </Text>
              </View>
              <View className="h-[1px] bg-gray-100 mx-3.5" />
              <View className="flex-row justify-between items-center px-3.5 py-3">
                <Text className="text-xs text-gray-500 font-medium">Teléfono</Text>
                <Text className="text-xs text-neutral-900 font-semibold max-w-[65%] text-right">
                  {user.user_phone_number || '—'}
                </Text>
              </View>
              <View className="h-[1px] bg-gray-100 mx-3.5" />
              <View className="flex-row justify-between items-center px-3.5 py-3">
                <Text className="text-xs text-gray-500 font-medium">Correo</Text>
                <Text className="text-xs text-neutral-900 font-semibold max-w-[65%] text-right">
                  {user.user_email_address}
                </Text>
              </View>
            </View>

            <Button
              text="Cerrar Sesión"
              onPress={handleLogout}
              variant="danger"
              className="mt-1"
            />
          </ScrollView>
        </View>
        <NavBar active="profile" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <View className="flex-1 bg-gray-50">
          <View className="px-4 py-3.5 bg-white border-b border-gray-200">
            <Text className="text-xl font-bold text-neutral-900">Mi Perfil</Text>
          </View>

          <View className="flex-row bg-white border-b border-gray-200">
            <TouchableOpacity
              className={`flex-1 py-3 items-center border-b-2 ${
                tab === 'login' ? 'border-primary' : 'border-transparent'
              }`}
              onPress={() => setTab('login')}
              activeOpacity={0.7}
            >
              <Text
                className={`text-sm ${
                  tab === 'login' ? 'text-primary font-bold' : 'text-gray-500 font-medium'
                }`}
              >
                Iniciar Sesión
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 py-3 items-center border-b-2 ${
                tab === 'register' ? 'border-primary' : 'border-transparent'
              }`}
              onPress={() => setTab('register')}
              activeOpacity={0.7}
            >
              <Text
                className={`text-sm ${
                  tab === 'register' ? 'text-primary font-bold' : 'text-gray-500 font-medium'
                }`}
              >
                Registrarse
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <Text className="text-xs text-gray-500 mb-4 leading-4">
              Inicia sesión para agendar citas médicas y ver tu historial.
            </Text>

            {tab === 'login' ? (
              <LoginForm onSwitch={() => setTab('register')} />
            ) : (
              <RegisterForm onSwitch={() => setTab('login')} />
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
      <NavBar active="profile" />
    </SafeAreaView>
  );
}
