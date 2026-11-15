import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  headers: { Accept: 'application/json' },
  timeout: 15000,
});

export function setAccessToken(token: string | null) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export function getApiErrorMessage(error: unknown): {
  message: string;
  details: ApiErrorDetail[];
} {
  if (axios.isAxiosError(error)) {
    const message: string = error.response?.data?.message ?? 'تعذر الاتصال بالخادم';
    const details: ApiErrorDetail[] = error.response?.data?.details ?? [];
    return { message, details };
  }
  return { message: 'حدث خطأ غير متوقع', details: [] };
}
