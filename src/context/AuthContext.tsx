import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';
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
  refreshRoleAccess: () => Promise<AdminClinic[]>;
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

  // Ref tracking current available modes synchronously to avoid render lag in transition callbacks
  const availableModesRef = useRef<AppMode[]>([]);

  // Tracks explicit manual mode selection by the user across role refreshes
  const manualActiveModeRef = useRef<AppMode | null>(null);

  // Tracks whether capabilities have been successfully resolved at least once
  const hasResolvedModesRef = useRef<boolean>(false);

  // Monotonically increasing session counter (increments on every signIn and signOut)
  const authSessionRef = useRef<number>(0);

  // Monotonically increasing generation counter for role resolutions (prevents out-of-order refreshes)
  const roleResolutionGenRef = useRef<number>(0);

  // Mounted status to prevent React state updates after unmount
  const isMountedRef = useRef<boolean>(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

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
   * Concurrency-guarded by session ID and resolution generation ID.
   */
  const resolveRolesAndModes = async (
    sessionId: number,
    resolutionGen: number,
    isDoctorCapability: boolean
  ): Promise<AdminClinic[]> => {
    if (!isMountedRef.current) return [];
    setIsResolvingModes(true);
    setModeResolutionError(null);

    try {
      const clinics = await adminApi.getMyClinics();

      // Ensure this response matches the current session and resolution generation
      if (
        !isMountedRef.current ||
        sessionId !== authSessionRef.current ||
        resolutionGen !== roleResolutionGenRef.current
      ) {
        return [];
      }

      const verifiedClinics = Array.isArray(clinics) ? clinics : [];
      const hasAdminClinics = verifiedClinics.length > 0;

      const modes: AppMode[] = ['patient'];
      if (isDoctorCapability) {
        modes.push('doctor');
      }
      if (hasAdminClinics) {
        modes.push('admin');
      }

      hasResolvedModesRef.current = true;
      availableModesRef.current = modes;
      setAdminClinics(verifiedClinics);
      setRoles({ isAdmin: hasAdminClinics, isDoctor: isDoctorCapability });
      setAvailableModes(modes);
      setModeResolutionError(null);

      // Mode selection:
      // Maintain user's manually selected valid mode if still available, otherwise recalculate default
      let nextMode: AppMode;
      if (manualActiveModeRef.current && modes.includes(manualActiveModeRef.current)) {
        nextMode = manualActiveModeRef.current;
      } else {
        manualActiveModeRef.current = null;
        nextMode = computeDefaultMode(modes);
      }
      setActiveModeState(nextMode);
      return verifiedClinics;
    } catch (error: any) {
      if (
        !isMountedRef.current ||
        sessionId !== authSessionRef.current ||
        resolutionGen !== roleResolutionGenRef.current
      ) {
        return [];
      }

      const errorMessage =
        error?.message || 'Error al obtener clínicas de administración.';
      setModeResolutionError(errorMessage);

      if (!hasResolvedModesRef.current) {
        // Initial resolution failed: do NOT expose a supposedly verified active mode or guessed capabilities
        setAdminClinics([]);
        setRoles(null);
        availableModesRef.current = [];
        setAvailableModes([]);
        setActiveModeState(null);
      } else {
        // Refresh failed after previous success: preserve last successfully verified capabilities.
        // Do NOT replace valid admin access with a guessed patient-only result.
        // modeResolutionError remains set for error/retry presentation.
      }
      throw error;
    } finally {
      if (
        isMountedRef.current &&
        sessionId === authSessionRef.current &&
        resolutionGen === roleResolutionGenRef.current
      ) {
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
      const currentAvailable =
        availableModesRef.current.length > 0
          ? availableModesRef.current
          : availableModes;
      if (!currentAvailable.includes(mode)) {
        console.warn(
          `Cannot set active mode to "${mode}". Available modes:`,
          currentAvailable
        );
        return;
      }
      manualActiveModeRef.current = mode;
      setActiveModeState(mode);
    },
    [token, availableModes]
  );

  const refreshRoleAccess = async (): Promise<AdminClinic[]> => {
    if (!token && !apiClient.getToken()) {
      console.warn('Cannot refresh role access when unauthenticated');
      return [];
    }
    const sessionId = authSessionRef.current;
    const resolutionGen = ++roleResolutionGenRef.current;

    let isDoc = roles?.isDoctor ?? false;
    try {
      isDoc = await doctorsApi.isUserDoctorAnywhere();
    } catch {
      // Retain previously verified doctor capability on network error
    }

    if (
      !isMountedRef.current ||
      sessionId !== authSessionRef.current ||
      resolutionGen !== roleResolutionGenRef.current
    ) {
      return [];
    }

    return await resolveRolesAndModes(sessionId, resolutionGen, isDoc);
  };

  const refreshProfile = async (): Promise<void> => {
    if (!token && !apiClient.getToken()) {
      throw new Error('No hay sesión autenticada activa.');
    }
    const sessionId = authSessionRef.current;
    try {
      const profile = await authApi.getProfile();
      if (!isMountedRef.current || sessionId !== authSessionRef.current) return;
      setUser(profile);
    } catch (error) {
      console.warn('Failed to load user profile:', error);
      if (sessionId === authSessionRef.current) {
        throw error;
      }
    }
  };

  const signIn = async (dto: LoginDto): Promise<LoginResponse> => {
    setIsLoading(true);
    const startSessionId = authSessionRef.current;
    let sessionId: number | null = null;
    let resolutionGen: number | null = null;

    try {
      const res = await authApi.login(dto);
      if (!isMountedRef.current || authSessionRef.current !== startSessionId) {
        throw new Error('Authentication session invalidated.');
      }

      // New login credentials accepted: establish new session and reset previous account state
      sessionId = ++authSessionRef.current;
      resolutionGen = ++roleResolutionGenRef.current;

      hasResolvedModesRef.current = false;
      manualActiveModeRef.current = null;
      setUser(null);
      setRoles(null);
      setActiveModeState(null);
      availableModesRef.current = [];
      setAvailableModes([]);
      setAdminClinics([]);
      setModeResolutionError(null);

      setAuthToken(res.token);

      let isDoctor = res.isDoctor;
      if (isDoctor === undefined) {
        try {
          isDoctor = await doctorsApi.isUserDoctorAnywhere();
        } catch {
          isDoctor = false;
        }
      }
      if (!isMountedRef.current || sessionId !== authSessionRef.current) {
        throw new Error('Authentication session invalidated.');
      }

      // Fetch profile and resolve modes concurrently.
      // Mode resolution finishes before signIn returns.
      const profilePromise = authApi
        .getProfile()
        .then((profile) => {
          if (isMountedRef.current && sessionId === authSessionRef.current) {
            setUser(profile);
          }
          return profile;
        })
        .catch((err) => {
          console.warn('Could not fetch user profile immediately after login:', err);
          return null;
        });

      const modePromise = resolveRolesAndModes(sessionId, resolutionGen, isDoctor).catch(() => []);

      await Promise.all([profilePromise, modePromise]);

      // Recheck session validity after all async login/profile/mode work before reporting success
      if (!isMountedRef.current || sessionId !== authSessionRef.current) {
        throw new Error('Authentication session invalidated.');
      }

      return { ...res, isDoctor };
    } finally {
      if (isMountedRef.current) {
        if (sessionId === null || sessionId === authSessionRef.current) {
          setIsLoading(false);
        }
      }
    }
  };

  const signUp = async (dto: CreateUserDto): Promise<void> => {
    setIsLoading(true);
    try {
      await authApi.register(dto);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  const signOut = () => {
    authSessionRef.current += 1;
    roleResolutionGenRef.current += 1;
    setAuthToken(null);
    setUser(null);
    setRoles(null);
    setActiveModeState(null);
    availableModesRef.current = [];
    setAvailableModes([]);
    setAdminClinics([]);
    setIsLoading(false);
    setIsResolvingModes(false);
    setModeResolutionError(null);
    manualActiveModeRef.current = null;
    hasResolvedModesRef.current = false;
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
