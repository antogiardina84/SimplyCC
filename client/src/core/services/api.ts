// client/src/core/services/api.ts - CORREZIONE GESTIONE DATE

import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = '/api';

// Funzione per convertire Date in string ISO locale (senza timezone shift)
const convertDateToLocalISO = (date: Date): string => {
  console.log('🔍 convertDateToLocalISO INPUT:', date);
  console.log('🔍 convertDateToLocalISO INPUT toString():', date.toString());
  console.log('🔍 convertDateToLocalISO INPUT getDate():', date.getDate());
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const result = `${year}-${month}-${day}T12:00:00.000Z`;
  
  console.log('🔍 convertDateToLocalISO OUTPUT:', result);
  
  return result;
};

// Funzione ricorsiva per processare oggetti e convertire Date
const processObjectForAPI = (obj: any): any => {
  if (obj instanceof Date) {
    return convertDateToLocalISO(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(processObjectForAPI);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const processed: any = {};
    Object.keys(obj).forEach(key => {
      processed[key] = processObjectForAPI(obj[key]);
    });
    return processed;
  }
  
  return obj;
};

// Funzione ricorsiva per processare oggetti e convertire string in Date
const processObjectFromAPI = (obj: any): any => {
  if (typeof obj === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(obj)) {
    const date = new Date(obj);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  if (Array.isArray(obj)) {
    return obj.map(processObjectFromAPI);
  }
  
  if (obj !== null && typeof obj === 'object') {
    const processed: any = {};
    Object.keys(obj).forEach(key => {
      processed[key] = processObjectFromAPI(obj[key]);
    });
    return processed;
  }
  
  return obj;
};

console.log('🔧 API Configuration:');
console.log('  - Using API_URL:', API_URL);

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - CONVERTI DATE PRIMA DELL'INVIO
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    
    // Processa i dati per convertire Date in stringhe ISO corrette
    if (config.data) {
      config.data = processObjectForAPI(config.data);
      console.log('🔄 Date processate per API:', config.data);
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - CONVERTI STRINGHE IN DATE DOPO LA RICEZIONE
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.status, response.config.url);
    
    // Processa la risposta per convertire stringhe ISO in oggetti Date
    if (response.data) {
      response.data = processObjectFromAPI(response.data);
      console.log('🔄 Date processate da API:', response.data);
    }
    
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url, error.message);
    
    const message = error.response?.data?.message || 'Si è verificato un errore';
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      toast.error('Sessione scaduta. Effettua nuovamente il login.');
    } else if (error.response?.status === 403) {
      toast.error('Non hai i permessi per eseguire questa operazione');
    } else if (error.response?.status === 404) {
      toast.error('Risorsa non trovata');
    } else if (error.response?.status >= 500) {
      toast.error('Errore del server. Riprova più tardi.');
    } else {
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

export default api;
