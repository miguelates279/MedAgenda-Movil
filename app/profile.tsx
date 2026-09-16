import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm } from 'react-hook-form';
import { useAuth } from '../src/context/AuthContext';
import { LoginDto, CreateUserDto } from '../src/api/types';
import Field from '../src/components/Field';
import Button from '../src/components/Button';
import Badge from '../src/components/Badge';
import NavBar from '../src/components/NavBar';

// ─── Guest: Login form ───────────────────────────────────────────────────────

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
    <View style={styles.formSection}>
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

      {serverError ? <Text style={styles.errorText}>{serverError}</Text> : null}

      <Button
        text={loading ? 'Ingresando...' : 'Iniciar Sesión'}
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        style={styles.submitBtn}
      />

      <TouchableOpacity onPress={onSwitch} style={styles.switchLink}>
        <Text style={styles.switchText}>¿No tienes cuenta? <Text style={styles.switchAccent}>Regístrate</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Guest: Register form ─────────────────────────────────────────────────────

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
    <View style={styles.formSection}>
      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Field
            control={control}
            name="first_name"
            label="Primer nombre *"
            placeholder="Juan"
            rules={{ required: 'Requerido' }}
          />
        </View>
        <View style={styles.halfColRight}>
          <Field
            control={control}
            name="second_name"
            label="Segundo nombre"
            placeholder="Carlos"
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.halfCol}>
          <Field
            control={control}
            name="first_last_name"
            label="Primer apellido *"
            placeholder="Pérez"
            rules={{ required: 'Requerido' }}
          />
        </View>
        <View style={styles.halfColRight}>
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

      {serverError ? <Text style={styles.errorText}>{serverError}</Text> : null}

      <Button
        text={loading ? 'Registrando...' : 'Crear Cuenta'}
        onPress={handleSubmit(onSubmit)}
        loading={loading}
        style={styles.submitBtn}
      />

      <TouchableOpacity onPress={onSwitch} style={styles.switchLink}>
        <Text style={styles.switchText}>¿Ya tienes cuenta? <Text style={styles.switchAccent}>Inicia sesión</Text></Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

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

  // ── Authenticated view ──────────────────────────────────────────────────────
  if (isAuthenticated && user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mi Perfil</Text>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Avatar placeholder */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user.first_name?.[0] ?? '') + (user.first_last_name?.[0] ?? '')}
                </Text>
              </View>
              <Text style={styles.userName}>{fullName}</Text>
              <Text style={styles.userEmail}>{user.user_email_address}</Text>
              <View style={styles.badgeRow}>
                {roles?.isAdmin && <Badge text="Admin" variant="primary" style={styles.badge} />}
                {roles?.isDoctor && <Badge text="Doctor" variant="info" style={styles.badge} />}
                {!roles?.isAdmin && !roles?.isDoctor && (
                  <Badge text="Paciente" variant="success" style={styles.badge} />
                )}
              </View>
            </View>

            {/* Info card */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Identificación</Text>
                <Text style={styles.infoValue}>{user.legal_id || '—'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Teléfono</Text>
                <Text style={styles.infoValue}>{user.user_phone_number || '—'}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Correo</Text>
                <Text style={styles.infoValue}>{user.user_email_address}</Text>
              </View>
            </View>

            <Button
              text="Cerrar Sesión"
              onPress={handleLogout}
              variant="danger"
              style={styles.logoutBtn}
            />
          </ScrollView>
        </View>
        <NavBar active="profile" />
      </SafeAreaView>
    );
  }

  // ── Unauthenticated view ────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Mi Perfil</Text>
          </View>

          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'login' && styles.tabBtnActive]}
              onPress={() => setTab('login')}
            >
              <Text style={[styles.tabBtnText, tab === 'login' && styles.tabBtnTextActive]}>
                Iniciar Sesión
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'register' && styles.tabBtnActive]}
              onPress={() => setTab('register')}
            >
              <Text style={[styles.tabBtnText, tab === 'register' && styles.tabBtnTextActive]}>
                Registrarse
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.guestHint}>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f9fafb' },
  container: { flex: 1 },

  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#171717',
  },

  // ── Auth tabs ──────────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#259487',
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  tabBtnTextActive: {
    color: '#259487',
    fontWeight: '700',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  guestHint: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 16,
    lineHeight: 18,
  },

  // ── Forms ──────────────────────────────────────────────────────────────────
  formSection: {},
  row: { flexDirection: 'row' },
  halfCol: { flex: 1, marginRight: 6 },
  halfColRight: { flex: 1, marginLeft: 6 },
  errorText: {
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 10,
  },
  submitBtn: { marginTop: 4 },
  switchLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  switchText: {
    fontSize: 13,
    color: '#6b7280',
  },
  switchAccent: {
    color: '#259487',
    fontWeight: '600',
  },

  // ── Authenticated profile ──────────────────────────────────────────────────
  avatarWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#259487',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#171717',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 8,
  },
  badgeRow: { flexDirection: 'row', gap: 6 },
  badge: {},

  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#171717',
    fontWeight: '600',
    maxWidth: '65%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 14,
  },
  logoutBtn: { marginTop: 4 },
});
