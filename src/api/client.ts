import type { ApiErrorResponse } from './types';

export const BASE_URL = 'https://med-agenda-1-three.vercel.app';

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export type UnauthorizedHandler = (session: {
  sessionId: number;
  token: string;
}) => void;

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private sessionId: number = 0;
  private unauthorizedListener: UnauthorizedHandler | null = null;

  // Single controlled validity check tracker to avoid duplicate probes or storms
  private validatingPromise: Promise<void> | null = null;
  private validatingSessionId: number = -1;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  setToken(token: string | null, sessionId?: number) {
    this.token = token;
    if (typeof sessionId === 'number') {
      this.sessionId = sessionId;
    }
  }

  setSession(token: string | null, sessionId: number) {
    this.token = token;
    this.sessionId = sessionId;
  }

  getToken(): string | null {
    return this.token;
  }

  getSessionId(): number {
    return this.sessionId;
  }

  onUnauthorized(listener: UnauthorizedHandler): () => void {
    this.unauthorizedListener = listener;
    return () => {
      if (this.unauthorizedListener === listener) {
        this.unauthorizedListener = null;
      }
    };
  }

  private isKnownPermissionDeniedResponse(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return false;
    }
    const exactMessage = "You don't have permission to access this functionality.";
    if (data.message === exactMessage) {
      return true;
    }
    if (Array.isArray(data.message) && data.message.includes(exactMessage)) {
      return true;
    }
    return false;
  }

  private notifyUnauthorized(sessionId: number, token: string) {
    if (this.token !== token || this.sessionId !== sessionId) {
      return;
    }

    try {
      this.unauthorizedListener?.({
        sessionId,
        token,
      });
    } catch (err) {
      console.error('Error executing unauthorized listener:', err);
    }
  }

  /**
   * Executes a controlled authentication validity check against GET /users/profile using raw fetch.
   * - Bypasses recursive request() interceptors.
   * - Deduplicates concurrent checks for the same active session.
   * - Distinguishes ambiguous HTTP 401 permission denials (e.g. ClinicsService.addMemberToClinic)
   *   from genuine expired or invalid JWT sessions.
   */
  private scheduleTokenValidityCheck(token: string, sessionId: number) {
    if (this.validatingPromise && this.validatingSessionId === sessionId) {
      return;
    }

    this.validatingSessionId = sessionId;
    this.validatingPromise = (async () => {
      try {
        const isValid = await this.verifyTokenWithProfile(token);

        // Ensure session has not changed or been invalidated while probe was in-flight
        if (this.token !== token || this.sessionId !== sessionId) {
          return;
        }

        if (!isValid) {
          // Token is genuinely invalid or expired
          this.notifyUnauthorized(sessionId, token);
        }
        // If isValid is true, token remains valid; 401 was a permission denial; session preserved
      } finally {
        if (this.validatingSessionId === sessionId) {
          this.validatingPromise = null;
          this.validatingSessionId = -1;
        }
      }
    })();
  }

  private async verifyTokenWithProfile(token: string): Promise<boolean> {
    const probeUrl = `${this.baseUrl}/users/profile`;
    try {
      const probeResponse = await fetch(probeUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (probeResponse.status === 200) {
        return true;
      }

      if (probeResponse.status === 401) {
        return false;
      }

      // Non-401 HTTP errors (e.g. 500, 502) are not proof of expiration
      return true;
    } catch {
      // Network failures during validation must NOT be mistaken for proof of expiration
      return true;
    }
  }

  private handleUnauthorizedResponse(
    cleanEndpoint: string,
    dispatchedToken: string | null,
    dispatchedSessionId: number,
    data: any
  ) {
    // 1. Never invalidate for requests dispatched without a bearer token (guest/public)
    if (!dispatchedToken) {
      return;
    }

    // 2. Never invalidate for public auth endpoints (/auth/login, /users/register)
    if (cleanEndpoint === '/auth/login' || cleanEndpoint === '/users/register') {
      return;
    }

    // 3. Known backend RolesGuard authorization misclassification (HTTP 401 instead of 403)
    if (this.isKnownPermissionDeniedResponse(data)) {
      return;
    }

    // 4. Stale session protection: only invalidate if the request originated from the current active session
    if (
      this.token !== dispatchedToken ||
      this.sessionId !== dispatchedSessionId
    ) {
      return;
    }

    // 5. If the failed endpoint is /users/profile, it only has JwtAuthGuard and no role guard;
    // a 401 here is definitively an expired/invalid token. Invalidate directly without recursive probe.
    if (cleanEndpoint === '/users/profile') {
      this.notifyUnauthorized(dispatchedSessionId, dispatchedToken);
      return;
    }

    // 6. Ambiguous 401: Backend can return generic UnauthorizedException() for clinic authorization denial
    // (e.g. ClinicsService.addMemberToClinic()). Run a single controlled token-validity check.
    this.scheduleTokenValidityCheck(dispatchedToken, dispatchedSessionId);
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const isAuthEndpoint =
      cleanEndpoint === '/auth/login' || cleanEndpoint === '/users/register';
    const shouldAttachToken =
      !options.skipAuth && !isAuthEndpoint && !!this.token;

    const dispatchedToken = shouldAttachToken ? this.token : null;
    const dispatchedSessionId = this.sessionId;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (dispatchedToken) {
      headers['Authorization'] = `Bearer ${dispatchedToken}`;
    } else {
      delete headers['Authorization'];
    }

    try {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`[API] ${options.method || 'GET'} ${cleanEndpoint}`);
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.log(`[API] ${response.status} ${cleanEndpoint}`);
      }

      const responseText = await response.text();
      let data: any = null;

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = responseText;
        }
      }

      if (!response.ok) {
        if (response.status === 401) {
          this.handleUnauthorizedResponse(
            cleanEndpoint,
            dispatchedToken,
            dispatchedSessionId,
            data
          );
        }

        let errorMessage = 'An error occurred with the request.';

        if (data && typeof data === 'object') {
          const errorData = data as ApiErrorResponse;
          if (Array.isArray(errorData.message)) {
            errorMessage = errorData.message.join('\n');
          } else if (typeof errorData.message === 'string') {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          }
        } else if (typeof data === 'string' && data.length > 0) {
          errorMessage = data;
        }

        const error = new Error(errorMessage) as Error & {
          status?: number;
          data?: any;
        };
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data as T;
    } catch (err: any) {
      if (err.status) {
        throw err;
      }
      throw new Error(
        err.message ||
          'Network request failed. Please check your internet connection.'
      );
    }
  }

  get<T>(endpoint: string, headers?: Record<string, string>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
      headers,
    });
  }

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  put<T>(endpoint: string, body?: any, headers?: Record<string, string>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
      headers,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
