// client/src/core/context/AuthContext.tsx

import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'USER';
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Mock implementation - da sostituire con la vera implementazione
  const mockUser: User = {
    id: 'mock-user-id',
    email: 'manager@example.com',
    role: 'MANAGER',
    firstName: 'Mario',
    lastName: 'Rossi'
  };

  const authValue: AuthContextType = {
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
    login: async (email: string, _password: string) => {
      console.log('Mock login:', email);
      // Implementazione mock
    },
    logout: () => {
      console.log('Mock logout');
      // Implementazione mock
    },
    refreshUser: async () => {
      console.log('Mock refresh user');
      // Implementazione mock
    }
  };

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;