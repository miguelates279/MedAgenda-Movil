import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { NavBar } from '../../components';
import { useProfile } from '../../hooks/useProfile';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { UserProfileView } from './components/UserProfileView';

export const ProfileScreen: React.FC = () => {
  const {
    isAuthenticated,
    user,
    fullName,
    initials,
    roleText,
    roleBadgeVariant,
    tab,
    setTab,
    handleLogout,
  } = useProfile();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Encabezado Principal */}
      <View className="px-4 py-3.5 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-neutral-900">Mi Perfil</Text>
      </View>

      {isAuthenticated && user ? (
        <UserProfileView
          user={user}
          fullName={fullName}
          initials={initials}
          roleText={roleText}
          roleBadgeVariant={roleBadgeVariant}
          onLogout={handleLogout}
        />
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1"
        >
          {/* Pestañas de Iniciar Sesión / Registrarse para Invitados */}
          <View className="flex-row bg-white border-b border-gray-200">
            <Pressable
              onPress={() => setTab('login')}
              className={`flex-1 py-3 items-center border-b-2 ${
                tab === 'login' ? 'border-primary' : 'border-transparent'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'login' }}
              accessibilityLabel="Pestaña Iniciar Sesión"
            >
              <Text
                className={`text-sm ${
                  tab === 'login'
                    ? 'text-primary font-bold'
                    : 'text-gray-600 font-medium'
                }`}
              >
                Iniciar Sesión
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTab('register')}
              className={`flex-1 py-3 items-center border-b-2 ${
                tab === 'register' ? 'border-primary' : 'border-transparent'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'register' }}
              accessibilityLabel="Pestaña Registrarse"
            >
              <Text
                className={`text-sm ${
                  tab === 'register'
                    ? 'text-primary font-bold'
                    : 'text-gray-600 font-medium'
                }`}
              >
                Registrarse
              </Text>
            </Pressable>
          </View>

          <ScrollView
            className="flex-1 bg-gray-50"
            contentContainerClassName="p-4 pb-10"
            keyboardShouldPersistTaps="handled"
          >
            <Text className="text-xs text-gray-600 mb-4 leading-4">
              Inicia sesión para agendar citas médicas, consultar tus recetas y ver tu historial.
            </Text>

            {tab === 'login' ? (
              <LoginForm onSwitchToRegister={() => setTab('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setTab('login')} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Barra de Navegación */}
      <NavBar active="profile" />
    </SafeAreaView>
  );
};

export default ProfileScreen;
