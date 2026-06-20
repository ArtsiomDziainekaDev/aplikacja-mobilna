import axios from 'axios';
import { store } from '../store';
import { logout } from '../store/slices/authSlice';

// Use relative URL for Docker, fallback to localhost for development
const getBaseURL = () => {
  // In Docker, use same-origin (nginx will proxy /api)
  if (window.location.hostname === 'localhost' && window.location.port === '5173') {
    return 'http://localhost:8081';
  }
  return '';
};

const axiosInstance = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Добавляем перехватчик для добавления токена к запросам
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Добавляем перехватчик для обработки ответов
axiosInstance.interceptors.response.use(
  (response) => {
    // Токен обязателен только при логине (при регистрации сервер zwraca komunikat)
    if (response.config.url?.includes('/api/auth/signin') && !response.data.token) {
      return Promise.reject(new Error('Токен отсутствует в ответе'));
    }
    return response;
  },
  (error) => {
    if (error.response) {
      const { status, config } = error.response;
      
      // Перенаправляем только для серверных ошибок, не для обычных API ошибок
      const isErrorPage = window.location.pathname.startsWith('/error/');
      
      if (!isErrorPage && !config.url?.includes('/api/')) {
        // Перенаправление только для серверных ошибок
        switch (status) {
          case 500:
          case 502:
          case 503:
          case 504:
            window.location.href = '/error/500';
            break;
        }
      }
      
      // Jeśli otrzymujemy 401 lub 403, wylogowujemy się
              // Ale nie dla żądań uwierzytelniania
      if ((status === 401 || status === 403) && 
          !config.url?.includes('/api/auth/signin') && 
          !config.url?.includes('/api/auth/signup') &&
          !config.url?.includes('/api/auth/check')) {
        store.dispatch(logout());
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 