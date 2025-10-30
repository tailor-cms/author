import type { User } from '@tailor-cms/interfaces/user';
import request from './request';

const urls = {
  root: '/users',
  login: () => `${urls.root}/login`,
  logout: () => `${urls.root}/logout`,
  forgotPassword: () => `${urls.root}/forgot-password`,
  resetPassword: () => `${urls.root}/reset-password`,
  resetTokenStatus: () => `${urls.resetPassword()}/token-status`,
  profile: () => `${urls.root}/me`,
  changePassword: () => `${urls.profile()}/change-password`,
};

function login(credentials: { email: string; password: string }) {
  return request.post(urls.login(), credentials);
}

function logout() {
  return request.get(urls.logout());
}

function forgotPassword(email: string) {
  return request.post(urls.forgotPassword(), { email });
}

function resetPassword(token: string, password: string) {
  return request.post(urls.resetPassword(), { token, password });
}

function validateResetToken(token: string) {
  return request.base.post(urls.resetTokenStatus(), { token });
}

function changePassword(currentPassword: string, newPassword: string) {
  return request.post(urls.changePassword(), { currentPassword, newPassword });
}

function getUserInfo() {
  return request.get(urls.profile());
}

function updateUserInfo(userData: Partial<User>) {
  return request.patch(urls.profile(), userData);
}

export default {
  login,
  logout,
  forgotPassword,
  resetPassword,
  getUserInfo,
  updateUserInfo,
  changePassword,
  validateResetToken,
};
