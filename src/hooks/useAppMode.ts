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
  removeAdminClinic: (clinicId: number) => void;
  getSessionId: () => number;
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
    removeAdminClinic,
    getSessionId,
  } = useAuth();

  return {
    activeMode,
    availableModes,
    adminClinics,
    isResolvingModes,
    modeResolutionError,
    setActiveMode,
    refreshRoleAccess,
    removeAdminClinic,
    getSessionId,
  };
};

export default useAppMode;
