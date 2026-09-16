import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';

export type NavTab = 'home' | 'appointments' | 'clinics';

export interface NavBarProps {
  active: NavTab;
}

export const NavBar: React.FC<NavBarProps> = ({ active }) => {
  const router = useRouter();

  const handleNavigate = (tab: NavTab) => {
    if (tab === active) return;

    if (tab === 'home') {
      router.replace('/home' as any);
    } else if (tab === 'appointments') {
      router.replace('/appointments' as any);
    } else if (tab === 'clinics') {
      router.replace('/clinics' as any);
    }
  };

  return (
    <View style={styles.navContainer}>
      {/* Home Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleNavigate('home')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, active === 'home' && styles.activeIcon]}>🏠</Text>
        <Text style={[styles.tabLabel, active === 'home' && styles.activeLabel]}>
          Inicio
        </Text>
        {active === 'home' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      {/* Appointments Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleNavigate('appointments')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, active === 'appointments' && styles.activeIcon]}>📅</Text>
        <Text style={[styles.tabLabel, active === 'appointments' && styles.activeLabel]}>
          Citas
        </Text>
        {active === 'appointments' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>

      {/* Clinics Tab */}
      <TouchableOpacity
        style={styles.tabItem}
        onPress={() => handleNavigate('clinics')}
        activeOpacity={0.7}
      >
        <Text style={[styles.tabIcon, active === 'clinics' && styles.activeIcon]}>🏥</Text>
        <Text style={[styles.tabLabel, active === 'clinics' && styles.activeLabel]}>
          Clínicas
        </Text>
        {active === 'clinics' && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingBottom: 14,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingVertical: 2,
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.7,
  },
  activeIcon: {
    opacity: 1,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6b7280',
  },
  activeLabel: {
    color: '#259487',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    width: 28,
    height: 3,
    backgroundColor: '#259487',
    borderRadius: 2,
  },
});

export default NavBar;
