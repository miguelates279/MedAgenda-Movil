import React from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  Button,
  Card,
  ConfirmModal,
  KeyboardAwareScrollView,
} from '../../components';
import { useProfile } from '../../hooks/useProfile';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { UserProfileView } from './components/UserProfileView';
import { ModeSelector } from './components/ModeSelector';
import { ClaySurface, ClayPressable } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';

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
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      {/* Encabezado Principal */}
      <ClaySurface className="px-4 py-3.5 bg-med-bg border-b border-med-border-light rounded-none">
        <Text className="text-2xl font-bold text-med-text-main">Mi Perfil</Text>
      </ClaySurface>

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
            className="min-w-0 max-w-full flex-1 bg-med-surface"
            contentContainerClassName="p-4 pb-10"
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
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
                  <ActivityIndicator
                    size={tokens.indicator.lg}
                    color={tokens.colors.primary}
                    className="mb-3"
                  />
                  <Text className="text-base font-bold text-med-text-main text-center mb-1">
                    Cargando información del perfil...
                  </Text>
                  <Text className="text-sm text-med-text-soft text-center">
                    Obteniendo los datos de tu cuenta.
                  </Text>
                </View>
              ) : (
                <View className="items-center w-full">
                  <ClaySurface
                    depth="badge"
                    className="w-12 h-12 rounded-full bg-med-warning-bg border border-med-warning-border items-center justify-center mb-3"
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={tokens.iconSize[26]}
                      color={tokens.colors.warning.badgeText}
                    />
                  </ClaySurface>
                  <Text className="text-lg font-bold text-med-text-main text-center mb-1">
                    Perfil temporalmente no disponible
                  </Text>
                  <Text className="text-sm text-med-text-muted text-center mb-5 leading-relaxed">
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
        <View className="min-w-0 max-w-full flex-1 bg-med-surface">
          {/* Pestañas de Iniciar Sesión / Registrarse para Invitados */}
          <ClaySurface className="flex-row bg-med-bg border-b border-med-border-light rounded-none">
            <ClayPressable
              onPress={() => setTab('login')}
              className={`min-w-0 max-w-full min-h-touch flex-1 py-3 items-center border-b-2 ${
                tab === 'login' ? 'border-med-primary' : 'border-transparent'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'login' }}
              accessibilityLabel="Pestaña Iniciar Sesión"
            >
              <Text
                className={`text-base ${
                  tab === 'login'
                    ? 'text-med-primary font-bold'
                    : 'text-med-text-muted font-medium'
                }`}
              >
                Iniciar Sesión
              </Text>
            </ClayPressable>

            <ClayPressable
              onPress={() => setTab('register')}
              className={`min-w-0 max-w-full min-h-touch flex-1 py-3 items-center border-b-2 ${
                tab === 'register' ? 'border-med-primary' : 'border-transparent'
              }`}
              accessibilityRole="tab"
              accessibilityState={{ selected: tab === 'register' }}
              accessibilityLabel="Pestaña Registrarse"
            >
              <Text
                className={`text-base ${
                  tab === 'register'
                    ? 'text-med-primary font-bold'
                    : 'text-med-text-muted font-medium'
                }`}
              >
                Registrarse
              </Text>
            </ClayPressable>
          </ClaySurface>

          <KeyboardAwareScrollView
            className="min-w-0 max-w-full flex-1 bg-med-surface"
            contentContainerClassName="p-4 pb-16"
          >
            <Text className="text-sm text-med-text-muted mb-4 leading-5">
              Inicia sesión para agendar citas médicas, consultar tus recetas y
              ver tu historial.
            </Text>

            {tab === 'login' ? (
              <LoginForm onSwitchToRegister={() => setTab('register')} />
            ) : (
              <RegisterForm onSwitchToLogin={() => setTab('login')} />
            )}
          </KeyboardAwareScrollView>
        </View>
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
    </View>
  );
};

export default ProfileScreen;
