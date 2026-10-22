import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import apiClient from '../api/client';
import authApi from '../api/auth';
import adminApi from '../api/admin';
import doctorsApi from '../api/doctors';
import {
  AdminClinic,
  CreateUserDto,
  LoginDto,
  LoginResponse,
  UserProfile,
} from '../api/types';

export type AppMode = 'patient' | 'doctor' | 'admin';

export interface AuthContextType {
  token: string | null;
  user: UserProfile | null;
  roles: { isAdmin: boolean; isDoctor: boolean } | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (dto: LoginDto) => Promise<LoginResponse>;
  signUp: (dto: CreateUserDto) => Promise<void>;
  signOut: () => void;
  refreshProfile: () => Promise<void>;

  // Role and session capability foundation (Phase 1, Stage 1)
  activeMode: AppMode | null;
  availableModes: AppMode[];
  adminClinics: AdminClinic[];
  isResolvingModes: boolean;
  modeResolutionError: string | null;
  setActiveMode: (mode: AppMode) => void;
  refreshRoleAccess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<{ isAdmin: boolean; isDoctor: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Role & application mode states
  const [activeMode, setActiveModeState] = useState<AppMode | null>(null);
  const [availableModes, setAvailableModes] = useState<AppMode[]>([]);
  const [adminClinics, setAdminClinics] = useState<AdminClinic[]>([]);
  const [isResolvingModes, setIsResolvingModes] = useState<boolean>(false);
  const [modeResolutionError, setModeResolutionError] = useState<string | null>(null);

  // Tracks explicit manual mode selection by the user across role refreshes
  const manualActiveModeRef = useRef<AppMode | null>(null);

  // Monotonically increasing session counter to cancel/discard stale async results
  const authSessionRef = useRef<number>(0);

  const setAuthToken = (newToken: string | null) => {
    setTokenState(newToken);
    apiClient.setToken(newToken);
  };

  const computeDefaultMode = (modes: AppMode[]): AppMode => {
    if (modes.includes('admin')) return 'admin';
    if (modes.includes('doctor')) return 'doctor';
    return 'patient';
  };

  /**
   * Resolves available modes and admin clinics from backend capabilities.
   * Guarded against stale async results using the session counter.
   */
  const resolveRolesAndModes = async (
    sessionId: number,
    isDoctorCapability: boolean
  ): Promise<void> => {
    setIsResolvingModes(true);
    setModeResolutionError(null);

    try {
      const clinics = await adminApi.getMyClinics();
      if (sessionId !== authSessionRef.current) return;

      const verifiedClinics = Array.isArray(clinics) ? clinics : [];
      const hasAdminClinics = verifiedClinics.length > 0;

      const modes: AppMode[] = ['patient'];
      if (isDoctorCapability) {
        modes.push('doctor');
      }
      if (hasAdminClinics) {
        modes.push('admin');
      }

      setAdminClinics(verifiedClinics);
      setRoles({ isAdmin: hasAdminClinics, isDoctor: isDoctorCapability });
      setAvailableModes(modes);
      setModeResolutionError(null);

      // Mode selection:
      // Maintain user's manually selected valid mode if still available, otherwise recalculate default:
      let nextMode: AppMode;
      if (manualActiveModeRef.current && modes.includes(manualActiveModeRef.current)) {
        nextMode = manualActiveModeRef.current;
      } else {
        manualActiveModeRef.current = null;
        nextMode = computeDefaultMode(modes);
      }
      setActiveModeState(nextMode);
    } catch (error: any) {
      if (sessionId !== authSessionRef.current) return;

      const errorMessage =
        error?.message || 'Error al obtener clínicas de administración.';
      setModeResolutionError(errorMessage);
      setAdminClinics([]);
      setRoles({ isAdmin: false, isDoctor: isDoctorCapability });

      const modes: AppMode[] = ['patient'];
      if (isDoctorCapability) {
        modes.push('doctor');
      }
      setAvailableModes(modes);

      let nextMode: AppMode;
      if (manualActiveModeRef.current && modes.includes(manualActiveModeRef.current)) {
        nextMode = manualActiveModeRef.current;
      } else {
        manualActiveModeRef.current = null;
        nextMode = computeDefaultMode(modes);
      }
      setActiveModeState(nextMode);
    } finally {
      if (sessionId === authSessionRef.current) {
        setIsResolvingModes(false);
      }
    }
  };

  const setActiveMode = useCallback(
    (mode: AppMode) => {
      if (!token) {
        console.warn('Cannot set active mode when unauthenticated');
        return;
      }
      if (!availableModes.includes(mode)) {
        console.warn(
          `Cannot set active mode to "${mode}". Available modes:`,
          availableModes
        );
        return;
      }
      manualActiveModeRef.current = mode;
      setActiveModeState(mode);
    },
    [token, availableModes]
  );

  const refreshRoleAccess = async (): Promise<void> => {
    if (!token && !apiClient.getToken()) {
      console.warn('Cannot refresh role access when unauthenticated');
      return;
    }
    const sessionId = authSessionRef.current;
    let isDoc = roles?.isDoctor ?? false;
    try {
      isDoc = await doctorsApi.isUserDoctorAnywhere();
    } catch {
      // Retain previously reported doctor capability on network error
    }
    if (sessionId !== authSessionRef.current) return;
    await resolveRolesAndModes(sessionId, isDoc);
  };

  const refreshProfile = async (): Promise<void> => {
    if (!token && !apiClient.getToken()) return;
    const sessionId = authSessionRef.current;
    try {
      const profile = await authApi.getProfile();
      if (sessionId !== authSessionRef.current) return;
      setUser(profile);
      const isDoc = await doctorsApi.isUserDoctorAnywhere().catch(() => roles?.isDoctor ?? false);
      if (sessionId !== authSessionRef.current) return;
      setRoles((prev) => ({ isAdmin: prev?.isAdmin ?? false, isDoctor: isDoc }));
    } catch (error) {
      console.warn('Failed to load user profile:', error);
    }
  };

  const signIn = async (dto: LoginDto): Promise<LoginResponse> => {
    setIsLoading(true);
    const sessionId = ++authSessionRef.current;
    try {
      const res = await authApi.login(dto);
      if (sessionId !== authSessionRef.current) {
        throw new Error('Authentication session invalidated.');
      }
      setAuthToken(res.token);

      let isDoctor = res.isDoctor;
      if (isDoctor === undefined) {
        isDoctor = await doctorsApi.isUserDoctorAnywhere().catch(() => false);
      }
      if (sessionId !== authSessionRef.current) {
        throw new Error('Authentication session invalidated.');
      }

      // Fetch profile and resolve modes concurrently.
      // Mode resolution completes before signIn finishes, ensuring no routing before modes are ready.
      const profilePromise = authApi
        .getProfile()
        .then((profile) => {
          if (sessionId === authSessionRef.current) {
            setUser(profile);
          }
          return profile;
        })
        .catch((err) => {
          console.warn('Could not fetch user profile immediately after login:', err);
          return null;
        });

      const modePromise = resolveRolesAndModes(sessionId, isDoctor);

      await Promise.all([profilePromise, modePromise]);

      return { ...res, isDoctor };
    } finally {
      if (sessionId === authSessionRef.current) {
        setIsLoading(false);
      }
    }
  };

  const signUp = async (dto: CreateUserDto): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.register(dto);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = () => {
    authSessionRef.current += 1;
    setAuthToken(null);
    setUser(null);
    setRoles(null);
    setActiveModeState(null);
    setAvailableModes([]);
    setAdminClinics([]);
    setIsResolvingModes(false);
    setModeResolutionError(null);
    manualActiveModeRef.current = null;
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        roles,
        isLoading,
        isAuthenticated: !!token,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        activeMode,
        availableModes,
        adminClinics,
        isResolvingModes,
        modeResolutionError,
        setActiveMode,
        refreshRoleAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
