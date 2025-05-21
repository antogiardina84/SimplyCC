// Esempi di tipi condivisi

// Enums
export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  OPERATOR = 'OPERATOR'
}

export enum FlowType {
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D'
}

// Interfaces
export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
}

export interface Client {
  id: string;
  name: string;
  vatNumber: string;
  address?: string;
  city?: string;
  zipCode?: string;
  province?: string;
}

export interface Basin {
  id: string;
  code: string;
  description?: string;
  flowType: FlowType;
  clientId: string;
}