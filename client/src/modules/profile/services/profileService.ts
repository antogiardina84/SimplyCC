// client/src/modules/profile/services/profileService.ts

import api from '../../../core/services/api';

export interface ProfileData {
  email: string;
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const getProfile = async () => {
  const response = await api.get('/users/profile');
  return response.data;
};

export const updateProfile = async (data: ProfileData) => {
  const response = await api.put('/users/profile', data);
  return response.data;
};

export const changePassword = async (data: ChangePasswordData) => {
  const response = await api.put('/users/change-password', data);
  return response.data;
};