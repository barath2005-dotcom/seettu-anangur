import { formatINR, formatKolkataDate } from '@seettu/shared';

// Default to 10.0.2.2 for Android Studio Emulator, localhost for iOS / web test, or production URL
let API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api';
let authToken: string | null = null;

export function setCustomApiUrl(url: string) {
  API_BASE_URL = url.replace(/\/$/, '');
}

export function getApiUrl(): string {
  return API_BASE_URL;
}

export function setMobileAuthToken(token: string | null) {
  authToken = token;
}

export function getMobileAuthToken(): string | null {
  return authToken;
}

export async function mobileFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Server request failed');
    }
    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Unable to connect to Seettu API');
  }
}

export const mobileApi = {
  login: (credentials: { email: string; password: string }) =>
    mobileFetch<{ success: boolean; data: { accessToken: string; user: any } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => mobileFetch('/auth/me'),
  getDashboard: () => mobileFetch('/dashboard'),
  getMembers: (search?: string) => mobileFetch(`/members?search=${encodeURIComponent(search || '')}`),
  getMember: (id: string) => mobileFetch(`/members/${id}`),
  getSchemes: () => mobileFetch('/schemes'),
  getScheme: (id: string) => mobileFetch(`/schemes/${id}`),
  recordPayment: (data: any) =>
    mobileFetch('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getPayments: () => mobileFetch('/payments'),
  getPayouts: () => mobileFetch('/payouts'),
  getNotifications: () => mobileFetch('/notifications'),
};
