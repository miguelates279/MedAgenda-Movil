import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button, ClinicCard } from '../../components';
import { ClinicFiltersModal } from './components/ClinicFiltersModal';
import { useClinicsScreen } from './useClinicsScreen';
import { ClaySurface, ClayPressable } from '../../components/ClaySurface';
import { tokens } from '../../theme/tokens';

export function ClinicsScreen() {
  const screen = useClinicsScreen();
  return (
    <View className="min-w-0 max-w-full flex-1 bg-med-bg">
      <ClaySurface className="flex-row flex-wrap items-center justify-between px-4 py-3 bg-med-bg border-b border-med-border-light gap-2 rounded-none">
        <Text
          className="min-w-0 max-w-full shrink text-xl font-bold text-med-text-main flex-1"
          accessibilityRole="header"
        >
          Clínicas
        </Text>
        {screen.isAuthenticated && (
          <Button
            text="+ Nueva"
            onPress={screen.openCreateClinic}
            className="py-1.5 px-3"
          />
        )}
        <ClayPressable
          onPress={screen.openProfile}
          className="min-h-touch max-w-full w-11 h-11 rounded-full bg-med-surface-muted border border-med-border-light items-center justify-center active:bg-med-border-light"
          accessibilityRole="button"
          accessibilityLabel="Ver perfil"
        >
          <Ionicons
            name="person"
            size={tokens.iconSize[18]}
            color={tokens.colors.textMuted}
          />
        </ClayPressable>
      </ClaySurface>
      <ClaySurface className="flex-row flex-wrap items-center bg-med-bg px-4 py-3 border-b border-med-border-light gap-3 rounded-none">
        <View
          className="grow min-w-0 max-w-full"
          style={{ flexBasis: tokens.layout.cardMinWidth }}
        >
          <Text className="text-xs text-med-text-soft mb-1">
            {screen.hasSearched
              ? 'Última búsqueda'
              : 'Ubicación y especialidades'}
          </Text>
          <Text
            className="text-sm font-medium text-med-text-main"
            numberOfLines={2}
          >
            {screen.summary}
          </Text>
          {screen.hasPendingFilters && (
            <Text
              className="text-xs text-med-warning-text mt-1"
              accessibilityLiveRegion="polite"
            >
              Hay filtros sin aplicar
            </Text>
          )}
        </View>
        <ClayPressable
          onPress={() => screen.openFilters()}
          className="min-h-touch max-w-full min-h-11 flex-row items-center gap-2 px-3 py-2.5 border border-med-primary rounded-control bg-med-primary-surface active:bg-med-primary-light"
          accessibilityRole="button"
          accessibilityLabel="Abrir filtros de clínicas"
        >
          <Ionicons
            name="options-outline"
            size={tokens.iconSize[20]}
            color={tokens.colors.primaryDark}
          />
          <Text className="min-w-0 max-w-full shrink text-sm font-semibold text-med-primary-dark">
            Filtros{screen.filterCount ? ` (${screen.filterCount})` : ''}
          </Text>
        </ClayPressable>
      </ClaySurface>
      <FlatList
        style={{ flex: 1 }}
        data={screen.loadingClinics ? [] : screen.clinics}
        keyExtractor={(item) => String(item.clinic_id)}
        renderItem={({ item }) => (
          <ClinicCard
            clinic={item}
            onPress={() => screen.openClinic(item.clinic_id)}
            className="mb-3"
          />
        )}
        contentContainerStyle={{ padding: tokens.spacing.md, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={screen.loadingClinics}
            onRefresh={screen.refresh}
            tintColor={tokens.colors.primary}
            colors={[tokens.colors.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {screen.error && (
              <ClaySurface
                className="bg-med-error-bg border border-med-error-border p-3 mb-4 rounded-clay"
                accessibilityLiveRegion="polite"
              >
                <Text className="text-med-error-badge-text text-sm">
                  {screen.error}
                </Text>
              </ClaySurface>
            )}
            {screen.hasSearched && !screen.loadingClinics && (
              <Text className="text-sm text-med-text-muted mb-3">
                {screen.clinics.length} clínica
                {screen.clinics.length === 1 ? '' : 's'} encontrada
                {screen.clinics.length === 1 ? '' : 's'}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={
          <View className="min-w-0 max-w-full flex-1 justify-center items-center px-3 py-8">
            {screen.loadingClinics ? (
              <>
                <ActivityIndicator
                  size={tokens.indicator.lg}
                  color={tokens.colors.primary}
                />
                <Text className="text-sm text-med-text-muted mt-3">
                  Buscando clínicas...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name={
                    screen.hasSearched ? 'search-outline' : 'business-outline'
                  }
                  size={tokens.iconSize[36]}
                  color={tokens.colors.primary}
                />
                <Text className="text-base font-bold text-med-text-main text-center mt-3 mb-2">
                  {screen.hasSearched
                    ? 'No se encontraron clínicas'
                    : 'Encuentra tu clínica'}
                </Text>
                <Text className="text-sm text-med-text-muted text-center mb-4">
                  {screen.hasSearched
                    ? 'Cambia la ubicación o las especialidades para ampliar tu búsqueda.'
                    : 'Elige un país y, si quieres, filtra por ciudad o especialidad.'}
                </Text>
                <Button
                  text={
                    screen.hasSearched ? 'Cambiar filtros' : 'Elegir ubicación'
                  }
                  onPress={() =>
                    screen.openFilters(
                      screen.hasSearched ? 'filters' : 'country',
                    )
                  }
                />
              </>
            )}
          </View>
        }
      />
      <ClinicFiltersModal filters={screen.filters} />
    </View>
  );
}

export default ClinicsScreen;
