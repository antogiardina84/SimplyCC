// server/src/modules/users/services/users.service.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { HttpException } from '../../../core/middleware/error.middleware';

const prisma = new PrismaClient();

export const findAllUsers = async () => {
  return prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const findUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new HttpException(404, 'Utente non trovato');
  }

  return user;
};

export const createUser = async (userData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: userData.email },
  });

  if (existingUser) {
    throw new HttpException(400, 'Email già registrata');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  return prisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const updateUser = async (
  id: string,
  userData: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    role?: string;
    active?: boolean;
  }
) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new HttpException(404, 'Utente non trovato');
  }

  // Se viene fornita una nuova password, la codifichiamo
  const updatedUserData = { ...userData };
  if (userData.password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    updatedUserData.password = hashedPassword;
  }

  return prisma.user.update({
    where: { id },
    data: updatedUserData,
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};

export const deleteUser = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new HttpException(404, 'Utente non trovato');
  }

  return prisma.user.delete({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      active: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};