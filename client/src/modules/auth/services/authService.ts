// client/src/modules/auth/services/authService.ts - VERSIONE CORRETTA

import api from '../../../core/services/api';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    name?: string;
  };
  token: string;
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  name?: string;
  createdAt?: string;
}

// ✅ CORREZIONE: Login con gestione aggiornata dei dati utente
export const login = async (data: LoginData): Promise<AuthResponse> => {
  try {
    console.log('🔐 Tentativo di login per:', data.email);
    
    const response = await api.post('/auth/login', data);
    const result = response.data;
    
    // ✅ FORMATTA il nome utente correttamente
    const formattedUser = {
      ...result.user,
      name: result.user.name || 
            `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim() || 
            result.user.email
    };
    
    // Salva il token e i dati utente formattati
    localStorage.setItem('token', result.token);
    localStorage.setItem('user', JSON.stringify(formattedUser));
    
    console.log('✅ Login completato con successo per:', formattedUser.name);
    
    return {
      ...result,
      user: formattedUser
    };
  } catch (error: any) {
    console.error('❌ Errore durante il login:', error);
    throw error;
  }
};

export const register = async (data: RegisterData): Promise<AuthResponse> => {
  try {
    console.log('📝 Tentativo di registrazione per:', data.email);
    
    const response = await api.post('/auth/register', data);
    const result = response.data;
    
    console.log('✅ Registrazione completata con successo');
    
    return result;
  } catch (error: any) {
    console.error('❌ Errore durante la registrazione:', error);
    throw error;
  }
};

// ✅ CORREZIONE: Logout con pulizia completa
export const logout = (): void => {
  console.log('🚪 Esecuzione logout...');
  
  // Rimuovi tutti i dati di autenticazione
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // ✅ OPZIONALE: Rimuovi anche altri dati correlati all'utente
  localStorage.removeItem('userPreferences');
  localStorage.removeItem('lastActivity');
  
  console.log('✅ Logout completato');
};

// ✅ CORREZIONE: getCurrentUser con gestione migliorata
export const getCurrentUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      return null;
    }
    
    const user = JSON.parse(userStr);
    
    // ✅ VERIFICA che l'utente abbia i campi necessari
    if (!user.id || !user.email) {
      console.warn('⚠️ Dati utente incompleti nel localStorage, esecuzione pulizia');
      localStorage.removeItem('user');
      return null;
    }
    
    // ✅ FORMATTA il nome se non presente
    const formattedUser: User = {
      ...user,
      name: user.name || 
            `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
            user.email
    };
    
    return formattedUser;
  } catch (error) {
    console.error('❌ Errore nel parsing dei dati utente dal localStorage:', error);
    localStorage.removeItem('user');
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('token');
  const user = getCurrentUser();
  
  return !!(token && user);
};

// ✅ NUOVO: Funzione per aggiornare i dati utente nel localStorage
export const updateUserData = (userData: Partial<User>): void => {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      console.warn('⚠️ Tentativo di aggiornare dati utente senza utente corrente');
      return;
    }
    
    const updatedUser = {
      ...currentUser,
      ...userData,
      name: userData.name || 
            `${userData.firstName || currentUser.firstName || ''} ${userData.lastName || currentUser.lastName || ''}`.trim() || 
            userData.email || currentUser.email
    };
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
    console.log('✅ Dati utente aggiornati nel localStorage');
  } catch (error) {
    console.error('❌ Errore nell\'aggiornamento dati utente:', error);
  }
};

// ✅ NUOVO: Funzione per verificare la validità del token
export const isTokenValid = (): boolean => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // ✅ DECODIFICA del token JWT (senza verifica, solo per controllare scadenza)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Verifica se il token è scaduto
    if (payload.exp && payload.exp < currentTime) {
      console.log('🕒 Token scaduto, richiesta di nuovo login');
      logout();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Errore nella validazione del token:', error);
    logout();
    return false;
  }
};

// ✅ NUOVO: Funzione per refreshare i dati utente dal server
export const refreshUserData = async (): Promise<User | null> => {
  try {
    if (!isTokenValid()) {
      return null;
    }
    
    console.log('🔄 Refresh dati utente dal server...');
    
    const response = await api.get('/auth/me');
    const serverUser = response.data;
    
    const formattedUser: User = {
      ...serverUser,
      name: serverUser.name || 
            `${serverUser.firstName || ''} ${serverUser.lastName || ''}`.trim() || 
            serverUser.email
    };
    
    // Aggiorna i dati nel localStorage
    localStorage.setItem('user', JSON.stringify(formattedUser));
    
    console.log('✅ Dati utente refreshati con successo');
    return formattedUser;
  } catch (error: any) {
    console.error('❌ Errore nel refresh dei dati utente:', error);
    
    // Se errore 401, probabilmente token scaduto
    if (error.response?.status === 401) {
      logout();
    }
    
    return null;
  }
};

// ✅ NUOVO: Hook per il controllo periodico della validità del token
export const setupTokenRefresh = (): void => {
  const checkTokenValidity = () => {
    if (isAuthenticated() && !isTokenValid()) {
      console.log('🔄 Token non valido, reindirizzamento al login');
      logout();
      window.location.href = '/login';
    }
  };
  
  // Controlla ogni 5 minuti
  setInterval(checkTokenValidity, 5 * 60 * 1000);
  
  // Controlla anche quando la finestra ritorna in focus
  window.addEventListener('focus', checkTokenValidity);
};