import { create } from "zustand";

export type AuthModalView =
  | "closed"
  | "login"
  | "register"
  | "forgot-password"
  | "otp"
  | "reset-password"
  | "success";

export type OtpPurpose = "reset" | "register";

interface AuthModalState {
  view: AuthModalView;
  email: string | null;
  resetToken: string | null;
  otpPurpose: OtpPurpose;
  openLogin: () => void;
  openRegister: () => void;
  openForgotPassword: () => void;
  openOtp: (email: string, purpose?: OtpPurpose) => void;
  openResetPassword: (resetToken?: string) => void;
  openSuccess: () => void;
  close: () => void;
  setView: (view: AuthModalView) => void;
  setResetToken: (token: string | null) => void;
}

export const useAuthModal = create<AuthModalState>((set) => ({
  view: "closed",
  email: null,
  resetToken: null,
  otpPurpose: "reset",
  openLogin: () => set({ view: "login" }),
  openRegister: () => set({ view: "register" }),
  openForgotPassword: () => set({ view: "forgot-password" }),
  openOtp: (email: string, purpose: OtpPurpose = "reset") =>
    set({ view: "otp", email, otpPurpose: purpose }),
  openResetPassword: (resetToken?: string) =>
    set((state) => ({
      view: "reset-password",
      resetToken: resetToken !== undefined ? resetToken : state.resetToken,
    })),
  openSuccess: () => set({ view: "success" }),
  close: () => set({ view: "closed", email: null, resetToken: null, otpPurpose: "reset" }),
  setView: (view: AuthModalView) => set({ view }),
  setResetToken: (token) => set({ resetToken: token }),
}));
