// server/src/modules/auth/services/auth.service.ts

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient, User } from '@prisma/client';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '86400'; // 24 ore in secondi

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

interface UserResponse {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
}

interface AuthResponse {
  user: UserResponse;
  token: string;
}

export const register = async (
  email: string, 
  password: string, 
  firstName?: string, 
  lastName?: string
): Promise<AuthResponse> => {
  // Verifica se l'utente esiste già
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new HttpException(400, 'Email già registrata');
  }

  // Hash della password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Crea nuovo utente
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
    },
  });

  // Genera token JWT
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    token,
  };
};

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  // Trova l'utente
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new HttpException(401, 'Credenziali non valide');
  }

  // Verifica password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new HttpException(401, 'Credenziali non valide');
  }

  // Genera token JWT
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
    token,
  };
};

export const generateToken = (user: User): string => {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: parseInt(JWT_EXPIRATION),
  });
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    throw new HttpException(401, 'Token non valido o scaduto');
  }
};