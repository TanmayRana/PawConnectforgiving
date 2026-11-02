/**
 * PawConnect Authentication API
 * Connects to Spring Boot /api/auth and /api/me endpoints.
 */

import {
  apiGet,
  apiPost,
  apiPut,
  setStoredTokens,
  clearStoredTokens,
  getStoredRefreshToken,
} from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "PET_OWNER" | "VETERINARIAN" | "SERVICE_PROVIDER" | "ADMIN";

export interface AuthUser {
  id: number | string;
  firstName: string;
  lastName: string;
  fullName?: string;
  email: string;
  phone?: string;
  roles: string[];
  profileImage?: string | null;
  status?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  createdAt?: string;
  lastLoginAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: number;
  user: AuthUser;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  resetToken: string;
  newPassword: string;
  confirmPassword?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImage?: string;
}

// ─── Role Verification Helpers ────────────────────────────────────────────────

export function hasRole(user: AuthUser | null | undefined, targetRole: UserRole): boolean {
  if (!user || !Array.isArray(user.roles)) return false;
  return user.roles.some((r) => {
    const normalized = r.toUpperCase().replace(/^ROLE_/, "");
    return normalized === targetRole.toUpperCase().replace(/^ROLE_/, "");
  });
}

export function getPrimaryRole(user: AuthUser | null | undefined): UserRole {
  if (!user || !user.roles || user.roles.length === 0) return "PET_OWNER";
  if (hasRole(user, "ADMIN")) return "ADMIN";
  if (hasRole(user, "VETERINARIAN")) return "VETERINARIAN";
  if (hasRole(user, "SERVICE_PROVIDER")) return "SERVICE_PROVIDER";
  return "PET_OWNER";
}

// ─── API Functions ────────────────────────────────────────────────────────────

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>("/auth/login", data, { skipRefresh: true });
  if (response?.accessToken) {
    setStoredTokens(response.accessToken, response.refreshToken);
  }
  return response;
}

export async function requestRegisterOtp(data: RegisterRequest): Promise<void> {
  await apiPost<void>("/auth/register/otp", data, { skipRefresh: true });
}

export async function resendRegisterOtp(email: string): Promise<void> {
  await apiPost<void>("/auth/register/otp/resend", { email }, { skipRefresh: true });
}

export async function verifyRegisterOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>("/auth/register/verify", data, { skipRefresh: true });
  if (response?.accessToken) {
    setStoredTokens(response.accessToken, response.refreshToken);
  }
  return response;
}

export async function refresh(refreshToken?: string): Promise<AuthResponse> {
  const token = refreshToken || getStoredRefreshToken();
  if (!token) throw new Error("No refresh token available");
  const response = await apiPost<AuthResponse>(
    "/auth/refresh",
    { refreshToken: token },
    { skipRefresh: true }
  );
  if (response?.accessToken) {
    setStoredTokens(response.accessToken, response.refreshToken);
  }
  return response;
}

export async function logout(): Promise<void> {
  const refreshToken = getStoredRefreshToken();
  try {
    await apiPost<void>(
      "/auth/logout",
      refreshToken ? { refreshToken } : undefined,
      { skipRefresh: true }
    );
  } catch {
    // Ignore backend logout error, clear locally
  } finally {
    clearStoredTokens();
  }
}

export async function forgotPassword(data: ForgotPasswordRequest): Promise<void> {
  await apiPost<void>("/auth/forgot-password", data, { skipRefresh: true });
}

export async function verifyOtp(data: VerifyOtpRequest): Promise<{ resetToken: string }> {
  return apiPost<{ resetToken: string }>("/auth/verify-otp", data, { skipRefresh: true });
}

export async function resetPassword(data: ResetPasswordRequest): Promise<void> {
  await apiPost<void>("/auth/reset-password", data, { skipRefresh: true });
}

let currentUserPromise: Promise<AuthUser> | null = null;

export async function getCurrentUser(): Promise<AuthUser> {
  if (currentUserPromise) {
    return currentUserPromise;
  }
  currentUserPromise = apiGet<AuthUser>("/me").finally(() => {
    currentUserPromise = null;
  });
  return currentUserPromise;
}

export async function updateProfile(data: UpdateProfileRequest): Promise<AuthUser> {
  return apiPut<AuthUser>("/me", data);
}

export async function changePassword(data: ChangePasswordRequest): Promise<void> {
  await apiPut<void>("/me/password", data);
}
