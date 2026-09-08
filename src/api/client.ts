import { ApiErrorResponse } from './types';

export const BASE_URL = 'https://med-agenda-1-three.vercel.app';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = BASE_URL) {
    // Remove trailing slash if present
    this.baseUrl = baseUrl.replace(/\/+$/, '');
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

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
      throw new Error(err.message || 'Network request failed. Please check your internet connection.');
    }
  }

  get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers,
    });
  }

  post<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  put<T>(endpoint: string, body?: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers,
    });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
