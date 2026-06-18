import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: BASE_URL });

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sms_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Normalize errors
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.msg ||
      err.message ||
      'Something went wrong';
    return Promise.reject({ ...err, message });
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

// ── Events ────────────────────────────────────────────
export const eventsAPI = {
  list: () => api.get('/events'),
  get: (id) => api.get(`/events/${id}`),
};

// ── Reserve ───────────────────────────────────────────
export const reserveAPI = {
  reserve: (data) => api.post('/reserve', data),
  cancel: (reservationId) => api.post(`/reserve/cancel/${reservationId}`),
};

// ── Bookings ──────────────────────────────────────────
export const bookingsAPI = {
  confirm: (data) => api.post('/bookings', data),
  list: () => api.get('/bookings'),
};
