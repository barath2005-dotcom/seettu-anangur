export const PRODUCTION_API_URL = 'https://seettu-anangur.vercel.app/api';

// Use production backend URL by default, or localhost in dev when proxy is present
const API_BASE = (import.meta as any).env?.VITE_API_BASE || PRODUCTION_API_URL;

export function getAuthToken(): string | null {
  return localStorage.getItem('seettu_access_token');
}

export function setAuthTokens(accessToken: string, refreshToken?: string) {
  localStorage.setItem('seettu_access_token', accessToken);
  if (refreshToken) {
    localStorage.setItem('seettu_refresh_token', refreshToken);
  }
}

export function clearAuthTokens() {
  localStorage.removeItem('seettu_access_token');
  localStorage.removeItem('seettu_refresh_token');
  localStorage.removeItem('seettu_user');
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle token expiration
  if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
    const refreshToken = localStorage.getItem('seettu_refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const refreshData = await refreshRes.json();
        if (refreshData.success && refreshData.data?.accessToken) {
          setAuthTokens(refreshData.data.accessToken);
          // Retry original request
          headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
          const retryRes = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
          return retryRes.json();
        }
      } catch (e) {
        // Fall through to logout
      }
    }
    clearAuthTokens();
    window.location.reload();
  }

  let data: any;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = { error: 'Invalid JSON response from server' };
    }
  } else {
    data = {
      error: response.ok
        ? 'Unexpected response from server'
        : `Backend server error (${response.status}). The API backend is not yet connected.`,
    };
  }

  if (!response.ok) {
    throw new Error(data.error || `Request failed with status ${response.status}`);
  }
  return data;
}

// API Module Methods
export const api = {
  // Auth
  login: (credentials: { identifier?: string; email?: string; password: string }) =>
    apiFetch<{ success: boolean; data: { accessToken: string; refreshToken: string; user: any } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  getMe: () => apiFetch<{ success: boolean; data: any }>('/auth/me'),

  // Dashboard
  getDashboard: () => apiFetch<{ success: boolean; data: any }>('/dashboard'),

  // Members
  getMembers: (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ success: boolean; data: any[]; pagination: any }>(`/members?${query}`);
  },
  getMember: (id: string) => apiFetch<{ success: boolean; data: any }>(`/members/${id}`),
  createMember: (data: any) =>
    apiFetch<{ success: boolean; data: any; message: string }>('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateMember: (id: string, data: any) =>
    apiFetch<{ success: boolean; data: any; message: string }>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteMember: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/members/${id}`, {
      method: 'DELETE',
    }),
  batchDeleteMembers: (ids: string[]) =>
    apiFetch<{ success: boolean; message: string; data: { deletedCount: number } }>('/members/batch-delete', {
      method: 'POST',
      body: JSON.stringify({ ids }),
    }),
  importMembers: (members: any[]) =>
    apiFetch<{ success: boolean; data: any; message: string }>('/members/import', {
      method: 'POST',
      body: JSON.stringify({ members }),
    }),

  // Schemes
  getSchemes: (params?: { status?: string; type?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ success: boolean; data: any[] }>(`/schemes?${query}`);
  },
  getScheme: (id: string) => apiFetch<{ success: boolean; data: any }>(`/schemes/${id}`),
  createScheme: (data: any) =>
    apiFetch<{ success: boolean; data: any; message: string }>('/schemes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateScheme: (id: string, data: any) =>
    apiFetch<{ success: boolean; data: any; message: string }>(`/schemes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  enrollMember: (schemeId: string, data: { memberId: string; slotNumber?: number }) =>
    apiFetch<{ success: boolean; data: any; message: string }>(`/schemes/${schemeId}/enroll`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  unenrollMember: (schemeId: string, memberId: string) =>
    apiFetch<{ success: boolean; message: string }>(`/schemes/${schemeId}/members/${memberId}`, {
      method: 'DELETE',
    }),

  // Payments
  getPayments: (params?: any) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ success: boolean; data: any[]; pagination: any }>(`/payments?${query}`);
  },
  getPayment: (id: string) => apiFetch<{ success: boolean; data: any }>(`/payments/${id}`),
  recordPayment: (data: any) =>
    apiFetch<{ success: boolean; data: any; message: string }>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  reversePayment: (id: string, reason: string) =>
    apiFetch<{ success: boolean; message: string }>(`/payments/${id}/reverse`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  // Payouts
  getPayouts: (params?: any) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ success: boolean; data: any[] }>(`/payouts?${query}`);
  },
  preparePayout: (data: any) =>
    apiFetch<{ success: boolean; data: any; message: string }>('/payouts/prepare', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  approvePayout: (id: string, approved: boolean, rejectionReason?: string) =>
    apiFetch<{ success: boolean; message: string }>(`/payouts/${id}/approve`, {
      method: 'POST',
      body: JSON.stringify({ approved, rejectionReason }),
    }),
  disbursePayout: (id: string, data: any) =>
    apiFetch<{ success: boolean; message: string }>(`/payouts/${id}/disburse`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Reports
  getCashFlowReport: () => apiFetch<{ success: boolean; data: any }>('/reports/cash-flow'),
  getSchemeSummary: () => apiFetch<{ success: boolean; data: any[] }>('/reports/scheme-summary'),
  getMemberStatement: (memberId: string) =>
    apiFetch<{ success: boolean; data: any }>(`/reports/member-statements/${memberId}`),
  getOutstandingBalances: () => apiFetch<{ success: boolean; data: any[] }>('/reports/outstanding-balances'),

  // Notifications
  getNotifications: () => apiFetch<{ success: boolean; data: any[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) =>
    apiFetch<{ success: boolean; message: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () =>
    apiFetch<{ success: boolean; message: string }>('/notifications/read-all', { method: 'POST' }),

  // Staff & Audit
  getStaff: () => apiFetch<{ success: boolean; data: any[] }>('/staff'),
  createStaff: (data: any) =>
    apiFetch<{ success: boolean; data: any; message: string }>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleStaffStatus: (id: string, isActive: boolean) =>
    apiFetch<{ success: boolean; message: string }>(`/staff/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  getAuditLogs: (params?: any) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ success: boolean; data: any[]; pagination: any }>(`/audit?${query}`);
  },

  // Monthly Report Entries
  getMonthlyReport: (params?: { chitNo?: string; date?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ success: boolean; data: any }>(`/monthly-reports?${query}`);
  },
  saveMonthlyReport: (data: { chitNo: string; date: string; entries: any[]; templeCharityFund?: number }) =>
    apiFetch<{ success: boolean; data: any; message: string }>('/monthly-reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deleteMonthlyReport: (params: { chitNo: string; date: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return apiFetch<{ success: boolean; data: any; message: string }>(`/monthly-reports?${query}`, {
      method: 'DELETE',
    });
  },
  getMonthlyReportDates: () => apiFetch<{ success: boolean; data: any[] }>('/monthly-reports/dates'),
};
