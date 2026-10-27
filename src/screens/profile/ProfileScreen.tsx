import React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, ConfirmModal } from '../../components';
import { useProfile } from '../../hooks/useProfile';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { UserProfileView } from './components/UserProfileView';
import { ModeSelector } from './components/ModeSelector';

export const ProfileScreen: React.FC = () => {
  const {
    isAuthenticated,
    user,
    fullName,
    initials,
    roleText,
    roleBadgeVariant,
    activeMode,
    availableModes,
    handleSelectMode,
    loadingProfile,
    profileError,
    handleRetryProfile,
    tab,
    setTab,
    isLogoutModalOpen,
    isLoggingOut,
    handleLogout,
    handleCancelLogout,
    handleConfirmLogout,
  } = useProfile();

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Encabezado Principal */}
      <View className="px-4 py-3.5 bg-white border-b border-gray-200">
        <Text className="text-xl font-bold text-neutral-900">Mi Perfil</Text>
      </View>

      {isAuthenticated ? (
        user ? (
          <UserProfileView
            user={user}
            fullName={fullName}
            initials={initials}
            roleText={roleText}
            roleBadgeVariant={roleBadgeVariant}
            activeMode={activeMode}
            availableModes={availableModes}
            onSelectMode={handleSelectMode}
            onLogout={handleLogout}
          />
        ) : (
          <ScrollView
            className="flex-1 bg-gray-50"
            contentContainerClassName="p-4 pb-10"
          >
            {/* Si el usuario tiene múltiples modos disponibles, preservar acceso a selector */}
            <ModeSelector
              activeMode={activeMode}
              availableModes={availableModes}
              onSelectMode={handleSelectMode}
            />

            {/* Vista de Carga o Recuperación de Perfil para sesión autenticada */}
            <Card className="items-center p-6 mt-2">
              {loadingProfile ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="large" color="#259487" className="mb-3" />
                  <Text className="text-sm font-semibold text-neutral-900 text-center mb-1">
                    Cargando información del perfil...
                  </Text>
                  <Text className="text-xs text-gray-500 text-center">
                    Obteniendo los datos de tu cuenta.
                  </Text>
                </View>
              ) : (
                <View className="items-center w-full">
                  <View className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 items-center justify-center mb-3">
                    <Ionicons name="alert-circle-outline" size={26} color="#b45309" />
                  </View>
                  <Text className="text-base font-bold text-neutral-900 text-center mb-1">
                    Perfil temporalmente no disponible
                  </Text>
                  <Text className="text-xs text-gray-600 text-center mb-5 leading-relaxed">
                    {profileError ||
                      'Ocurrió un problema al obtener los datos personales de tu cuenta. Tu sesión continúa activa.'}
                  </Text>

                  <View className="w-full gap-3">
                    <Button
                      text="Reintentar carga"
                      onPress={handleRetryProfile}
                      className="w-full"
                    />
                    <Button
                      text="Cerrar sesión"
                      variant="outline"
                      onPress={handleLogout}
                      className="w-full"
                    />
                  </View>
                </View>
              )}
            </Card>
          </ScrollView>
        )
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
            contentContainerClassName="p-4"
          >
            {tab === 'login' ? (
              <LoginForm onSwitchToRegister={() => setTab('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setTab('login')} />
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Modal de Confirmación de Cierre de Sesión */}
      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Cerrar Sesión"
        message="¿Estás seguro de que deseas cerrar tu sesión actual?"
        confirmText="Cerrar Sesión"
        cancelText="Cancelar"
        variant="danger"
        iconName="log-out-outline"
        loading={isLoggingOut}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
