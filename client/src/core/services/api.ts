// client/src/core/services/api.ts - FIX HARDCODED

import axios from 'axios';
import { toast } from 'react-toastify';

// 🚨 FIX TEMPORANEO: Hardcode l'URL corretto
const API_URL = 'http://localhost:4000/api';

console.log('🔧 API Configuration:');
console.log('  - Environment Variable VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  - Using API_URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url, 'to baseURL:', config.baseURL);
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url, error.message);
    
    const message = error.response?.data?.message || 'Si è verificato un errore';
    
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Sessione scaduta. Effettua nuovamente il login.');
    } else if (error.response?.status === 403) {
      // Handle forbidden
      toast.error('Non hai i permessi per eseguire questa operazione');
    } else if (error.response?.status === 404) {
      // Handle not found
      toast.error('Risorsa non trovata');
    } else if (error.response?.status >= 500) {
      // Handle server error
      toast.error('Errore del server. Riprova più tardi.');
    } else {
      // Handle other errors
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;