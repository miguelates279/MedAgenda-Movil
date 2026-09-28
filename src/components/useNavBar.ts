import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export type NavTab = 'home' | 'appointments' | 'clinics' | 'doctor' | 'profile';

export type IconFamily = 'Ionicons' | 'MaterialCommunityIcons';

export interface TabItem {
  id: NavTab;
  label: string;
  route: string;
  iconFamily: IconFamily;
  activeIcon: string;
  inactiveIcon: string;
  visible: boolean;
}

export interface UseNavBarOptions {
  active: NavTab;
  onTabPress?: (tab: NavTab) => void;
}

export const useNavBar = ({ active, onTabPress }: UseNavBarOptions) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, roles } = useAuth();
  const isDoctor = isAuthenticated && !!roles?.isDoctor;

  const tabs: TabItem[] = useMemo(
    () => [
      {
        id: 'home',
        label: 'Inicio',
        route: '/home',
        iconFamily: 'Ionicons',
        activeIcon: 'home',
        inactiveIcon: 'home-outline',
        visible: true,
      },
      {
        id: 'appointments',
        label: 'Citas',
        route: '/appointments',
        iconFamily: 'Ionicons',
        activeIcon: 'calendar',
        inactiveIcon: 'calendar-outline',
        visible: true,
      },
      {
        id: 'clinics',
        label: 'Clínicas',
        route: '/clinics',
        iconFamily: 'Ionicons',
        activeIcon: 'business',
        inactiveIcon: 'business-outline',
        visible: true,
      },
      {
        id: 'doctor',
        label: 'Doctor',
        route: '/doctor',
        iconFamily: 'MaterialCommunityIcons',
        activeIcon: 'stethoscope',
        inactiveIcon: 'stethoscope',
        visible: isDoctor,
      },
      {
        id: 'profile',
        label: 'Perfil',
        route: '/profile',
        iconFamily: 'Ionicons',
        activeIcon: 'person',
        inactiveIcon: 'person-outline',
        visible: true,
      },
    ],
    [isDoctor]
  );

  const visibleTabs = useMemo(() => tabs.filter((t) => t.visible), [tabs]);

  const handleNavigate = (tab: TabItem) => {
    if (tab.id === active) return;

    if (onTabPress) {
      onTabPress(tab.id);
      return;
    }

    router.replace(tab.route as any);
  };

  return {
    activeTab: active,
    visibleTabs,
    handleNavigate,
    bottomInset: Math.max(insets.bottom, 8),
  };
};

export default useNavBar;
