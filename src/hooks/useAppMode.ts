import { useAuth, AppMode } from '../context/AuthContext';
import { AdminClinic } from '../api/types';

export interface UseAppModeResult {
  activeMode: AppMode | null;
  availableModes: AppMode[];
  adminClinics: AdminClinic[];
  isResolvingModes: boolean;
  modeResolutionError: string | null;
  setActiveMode: (mode: AppMode) => void;
  refreshRoleAccess: () => Promise<AdminClinic[]>;
}

/**
 * Dedicated hook exposing application mode, eligible roles, admin clinic memberships,
 * and mode switching actions from the central authentication context.
 */
export const useAppMode = (): UseAppModeResult => {
  const {
    activeMode,
    availableModes,
    adminClinics,
    isResolvingModes,
    modeResolutionError,
    setActiveMode,
    refreshRoleAccess,
  } = useAuth();

  return {
    activeMode,
    availableModes,
    adminClinics,
    isResolvingModes,
    modeResolutionError,
    setActiveMode,
    refreshRoleAccess,
  };
};

export default useAppMode;
