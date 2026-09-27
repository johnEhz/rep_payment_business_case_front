import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const SESSION_KEY = 'checkout_session_id';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Request interceptor: attach checkout session header & log
apiClient.interceptors.request.use(
  (config) => {
    try {
      const storedSession = localStorage.getItem(SESSION_KEY);
      if (storedSession && config.headers) {
        config.headers['x-checkout-session-id'] = storedSession;
      }
    } catch {}

    if (process.env.NODE_ENV === 'development') {
      console.debug(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: capture and persist checkout session header
apiClient.interceptors.response.use(
  (response) => {
    try {
      const sessionHeader = response.headers?.['x-checkout-session-id'];
      if (sessionHeader && typeof sessionHeader === 'string') {
        localStorage.setItem(SESSION_KEY, sessionHeader);
      }
    } catch {}
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('[API Error]', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
