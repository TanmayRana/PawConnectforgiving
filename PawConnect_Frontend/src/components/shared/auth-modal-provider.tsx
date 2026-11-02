"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useAuthModal } from "@/stores/auth-modal.store";
import { useAuthStore } from "@/stores/auth.store";
import {
  login as apiLogin,
  requestRegisterOtp,
  resendRegisterOtp,
  verifyRegisterOtp,
  forgotPassword as apiForgotPassword,
  verifyOtp as apiVerifyOtp,
  resetPassword as apiResetPassword,
} from "@/lib/api/auth";
import {
  Dialog,
  DialogContent,
  DialogBody,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BrandLogo } from "@/components/shared/brand-logo";
import { Check, Eye, EyeOff, Loader2 } from "lucide-react";
import { showSuccess } from "@/lib/utils/toast";
import { extractFieldErrors } from "@/lib/utils/form-errors";

function LoginForm() {
  const { openRegister, openForgotPassword, close } = useAuthModal();
  const setUser = useAuthStore((s) => s.setUser);
  const [showPassword, setShowPassword] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("Please correct the errors before continuing.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});

    try {
      const res = await apiLogin({ email: trimmedEmail, password });
      setUser(res.user);
      showSuccess(`Welcome back, ${res.user.firstName || "Pet Parent"}!`);
      close();
    } catch (err: unknown) {
      const parsed = extractFieldErrors(err);
      setFieldErrors(parsed.fieldErrors);
      setErrorMsg(
        parsed.generalError ||
          (Object.keys(parsed.fieldErrors).length > 0
            ? null
            : "Invalid email or password.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-3">
          <BrandLogo variant="compact" animate={false} href={null} />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Welcome back</h2>
        <p className="text-sm text-muted-foreground">Sign in to your PawConnect account</p>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive font-medium border border-destructive/20">
          {errorMsg}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          id="login-email"
          autoComplete="email"
          value={email}
          error={fieldErrors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: "" }));
          }}
          disabled={isSubmitting}
          required
        />
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="••••••••"
            id="login-password"
            autoComplete="current-password"
            value={password}
            error={fieldErrors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: "" }));
            }}
            disabled={isSubmitting}
            required
            className="pr-11"
          />
          <button
            type="button"
            className="absolute right-4 top-9 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={openForgotPassword}
          >
            Forgot password?
          </button>
        </div>

        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <button
          className="text-primary font-medium hover:underline"
          onClick={openRegister}
        >
          Sign up
        </button>
      </p>
    </div>
  );
}

const RESEND_WAIT_SECONDS = 60;

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

const PASSWORD_RULES: { id: string; label: string; test: (password: string) => boolean }[] = [
  { id: "length", label: "At least 8 characters", test: (password) => password.length >= 8 },
  { id: "lower", label: "One lowercase letter", test: (password) => /[a-z]/.test(password) },
  { id: "upper", label: "One uppercase letter", test: (password) => /[A-Z]/.test(password) },
  { id: "digit", label: "One digit", test: (password) => /\d/.test(password) },
  { id: "special", label: "One special character (@$!%*?&)", test: (password) => /[@$!%*?&]/.test(password) },
  {
    id: "allowed",
    label: "Only letters, digits, and @$!%*?&",
    test: (password) => password.length > 0 && /^[A-Za-z\d@$!%*?&]+$/.test(password),
  },
];

function passwordRuleResults(password: string) {
  return PASSWORD_RULES.map((rule) => ({ ...rule, met: rule.test(password) }));
}

function passwordPolicyError(password: string): string | null {
  if (!password) return "Password is required.";
  const missing = passwordRuleResults(password).filter((rule) => !rule.met);
  if (missing.length === 0) return null;
  return `Password still needs: ${missing.map((rule) => rule.label.toLowerCase()).join(", ")}.`;
}

function PasswordStrength({ password }: { password: string }) {
  const rules = passwordRuleResults(password);
  const metCount = rules.filter((rule) => rule.met).length;
  const percent = Math.round((metCount / rules.length) * 100);
  const barClass =
    metCount === rules.length
      ? "bg-emerald-500"
      : metCount >= 3
        ? "bg-amber-500"
        : "bg-destructive";

  if (!password) return null;

  return (
    <div className="space-y-2 pt-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="font-medium text-foreground">Password strength</span>
        <span className="text-muted-foreground">{percent}%</span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Password strength"
      >
        <div className={`h-full rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${barClass}`} style={{ width: `${percent}%` }} />
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
        {rules.map((rule) => (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 text-[11px] ${rule.met ? "text-emerald-600" : "text-muted-foreground"}`}
          >
            <Check className={`h-3 w-3 shrink-0 ${rule.met ? "opacity-100" : "opacity-30"}`} />
            <span>{rule.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RegisterForm() {
  const { openLogin, openOtp } = useAuthModal();
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedFirst || trimmedFirst.length < 2) {
      errors.firstName = "First name must be at least 2 characters.";
    }
    if (!trimmedLast) {
      errors.lastName = "Last name is required.";
    }
    if (!trimmedEmail) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Please enter a valid email address.";
    }

    const passwordError = passwordPolicyError(password);
    if (passwordError) {
      errors.password = passwordError;
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("Please fix the highlighted errors before submitting.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});

    try {
      await requestRegisterOtp({
        firstName: trimmedFirst,
        lastName: trimmedLast,
        email: trimmedEmail,
        password,
        confirmPassword,
      });
      showSuccess("Verification code sent. Enter it to create your account.");
      openOtp(trimmedEmail, "register");
    } catch (err: unknown) {
      const parsed = extractFieldErrors(err);
      setFieldErrors(parsed.fieldErrors);
      setErrorMsg(
        parsed.generalError ||
          (Object.keys(parsed.fieldErrors).length > 0
            ? null
            : "Failed to create account. Email may already be in use.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <div className="flex justify-center mb-3">
          <BrandLogo variant="compact" animate={false} href={null} />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Create account</h2>
        <p className="text-sm text-muted-foreground">Join PawConnect to care for your pet</p>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive font-medium border border-destructive/20" role="alert">
          {errorMsg}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="First name"
            placeholder="John"
            id="register-first-name"
            autoComplete="given-name"
            value={firstName}
            error={fieldErrors.firstName}
            onChange={(e) => {
              setFirstName(e.target.value);
              if (fieldErrors.firstName) setFieldErrors((p) => ({ ...p, firstName: "" }));
            }}
            disabled={isSubmitting}
            required
          />
          <Input
            label="Last name"
            placeholder="Doe"
            id="register-last-name"
            autoComplete="family-name"
            value={lastName}
            error={fieldErrors.lastName}
            onChange={(e) => {
              setLastName(e.target.value);
              if (fieldErrors.lastName) setFieldErrors((p) => ({ ...p, lastName: "" }));
            }}
            disabled={isSubmitting}
            required
          />
        </div>
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          id="register-email"
          autoComplete="email"
          value={email}
          error={fieldErrors.email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: "" }));
          }}
          disabled={isSubmitting}
          required
        />
        <div className="relative">
          <Input
            type={showPassword ? "text" : "password"}
            label="Password"
            placeholder="At least 8 characters"
            id="register-password"
            autoComplete="new-password"
            value={password}
            error={fieldErrors.password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: "" }));
            }}
            disabled={isSubmitting}
            required
            className="pr-11"
          />
          <button
            type="button"
            className="absolute right-4 top-9 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <PasswordStrength password={password} />
        </div>

        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm password"
            placeholder="Repeat your password"
            id="register-confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            error={fieldErrors.confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
            }}
            disabled={isSubmitting}
            required
            className="pr-11"
          />
          <button
            type="button"
            className="absolute right-4 top-9 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          {confirmPassword.length > 0 && confirmPassword !== password && (
            <p className="mt-1.5 text-xs text-destructive">Passwords do not match.</p>
          )}
        </div>

        <Button
          className="w-full"
          type="submit"
          disabled={
            isSubmitting ||
            passwordRuleResults(password).some((rule) => !rule.met) ||
            confirmPassword !== password
          }
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending OTP...
            </>
          ) : (
            "Send OTP"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <button
          className="text-primary font-medium hover:underline"
          onClick={openLogin}
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

function ForgotPasswordForm() {
  const { openLogin, openOtp } = useAuthModal();
  const [email, setEmail] = React.useState("");
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setFieldError("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFieldError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setFieldError(null);

    try {
      await apiForgotPassword({ email: trimmedEmail });
      showSuccess("If an account exists, a 6-digit code was emailed.");
      openOtp(trimmedEmail, "reset");
    } catch (err: unknown) {
      const parsed = extractFieldErrors(err);
      if (parsed.fieldErrors.email) {
        setFieldError(parsed.fieldErrors.email);
      } else {
        setErrorMsg(parsed.generalError || "Failed to request password reset. Try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Reset password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset code.
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive font-medium border border-destructive/20" role="alert">
          {errorMsg}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <Input
          type="email"
          label="Email"
          placeholder="you@example.com"
          id="forgot-email"
          autoComplete="email"
          value={email}
          error={fieldError || undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldError) setFieldError(null);
          }}
          disabled={isSubmitting}
          required
        />
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending OTP...
            </>
          ) : (
            "Send OTP"
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Remember your password?{" "}
        <button className="text-primary font-medium hover:underline" onClick={openLogin}>
          Sign in
        </button>
      </p>
    </div>
  );
}

function OtpForm() {
  const { email, otpPurpose, openResetPassword, openRegister, openForgotPassword, close } = useAuthModal();
  const setUser = useAuthStore((s) => s.setUser);
  const [digits, setDigits] = React.useState(["", "", "", "", "", ""]);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [resendAvailableAt, setResendAvailableAt] = React.useState(() => Date.now() + RESEND_WAIT_SECONDS * 1000);
  const [now, setNow] = React.useState(() => Date.now());
  const isRegister = otpPurpose === "register";
  const resendRemaining = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));

  React.useEffect(() => {
    if (resendRemaining <= 0) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [resendRemaining]);

  const handleDigitChange = (index: number, value: string) => {
    if (value.length > 1) {
      // Handle paste
      const pasted = value.slice(0, 6).split("");
      const updated = [...digits];
      pasted.forEach((char, i) => {
        if (index + i < 6) updated[index + i] = char;
      });
      setDigits(updated);
      const nextFocus = Math.min(index + pasted.length, 5);
      const nextInput = document.getElementById(`otp-digit-${nextFocus}`);
      if (nextInput) nextInput.focus();
      return;
    }

    const updated = [...digits];
    updated[index] = value;
    setDigits(updated);

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-digit-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-digit-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 6 || !/^\d{6}$/.test(otp)) {
      setErrorMsg("Please enter a valid 6-digit numeric verification code.");
      return;
    }
    if (!email) {
      setErrorMsg("Email address missing. Please start password reset again.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      if (isRegister) {
        const res = await verifyRegisterOtp({ email, otp });
        setUser(res.user);
        showSuccess("Account created successfully! Welcome to PawConnect.");
        close();
        return;
      }

      const res = await apiVerifyOtp({ email, otp });
      if (res?.resetToken) {
        showSuccess("Code verified successfully!");
        openResetPassword(res.resetToken);
      } else {
        setErrorMsg("Invalid OTP response received from server.");
      }
    } catch (err: unknown) {
      const parsed = extractFieldErrors(err);
      setErrorMsg(parsed.generalError || "Invalid or expired verification code.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Check your email</h2>
        <p className="text-sm text-muted-foreground">
          We sent a 6-digit code to <span className="font-medium text-foreground break-all">{email}</span>
          {isRegister
            ? ". The account is created only after you enter it."
            : ". After the code matches, you can set a new password."}
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive font-medium border border-destructive/20" role="alert">
          {errorMsg}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Verification code</label>
          <div className="flex gap-2 justify-center">
            {digits.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={isSubmitting}
                className="w-11 h-12 text-center text-lg font-semibold rounded-xl border border-input focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-background"
                aria-label={`Digit ${i + 1}`}
                id={`otp-digit-${i}`}
              />
            ))}
          </div>
        </div>
        <Button className="w-full" type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Verifying Code...
            </>
          ) : isRegister ? (
            "Verify and create account"
          ) : (
            "Verify Code"
          )}
        </Button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
          onClick={isRegister ? openRegister : openForgotPassword}
          disabled={isSubmitting || isResending}
        >
          Back
        </button>
        <button
          type="button"
          className="text-primary font-medium hover:underline disabled:opacity-60 disabled:no-underline"
          disabled={isSubmitting || isResending || !email || resendRemaining > 0}
          onClick={async () => {
            if (!email || resendRemaining > 0) return;
            setIsResending(true);
            setErrorMsg(null);
            try {
              if (isRegister) {
                await resendRegisterOtp(email);
              } else {
                await apiForgotPassword({ email });
              }
              setDigits(["", "", "", "", "", ""]);
              setResendAvailableAt(Date.now() + RESEND_WAIT_SECONDS * 1000);
              setNow(Date.now());
              showSuccess("A new verification code was emailed.");
            } catch (err: unknown) {
              const parsed = extractFieldErrors(err);
              setErrorMsg(parsed.generalError || "Could not send a new code.");
            } finally {
              setIsResending(false);
            }
          }}
        >
          {isResending
            ? "Sending..."
            : resendRemaining > 0
              ? `Resend code in ${formatCountdown(resendRemaining)}`
              : "Resend code"}
        </button>
      </div>
    </div>
  );
}

function ResetPasswordForm() {
  const { email, resetToken, openSuccess } = useAuthModal();
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showNewPassword, setShowNewPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const passwordError = passwordPolicyError(newPassword);
    if (passwordError) {
      errors.newPassword = passwordError;
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Confirm password is required.";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setErrorMsg("Please fix the errors below.");
      return;
    }

    if (!email || !resetToken) {
      setErrorMsg("Session expired. Please request a new OTP.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setFieldErrors({});

    try {
      await apiResetPassword({
        email,
        resetToken,
        newPassword,
        confirmPassword,
      });
      showSuccess("Password reset successfully!");
      openSuccess();
    } catch (err: unknown) {
      const parsed = extractFieldErrors(err);
      setFieldErrors(parsed.fieldErrors);
      setErrorMsg(
        parsed.generalError ||
          (Object.keys(parsed.fieldErrors).length > 0 ? null : "Failed to reset password. Please try again.")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-foreground">New password</h2>
        <p className="text-sm text-muted-foreground">Enter and confirm your new password.</p>
      </div>

      {errorMsg && (
        <div className="p-3 text-xs rounded-lg bg-destructive/10 text-destructive font-medium border border-destructive/20" role="alert">
          {errorMsg}
        </div>
      )}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="relative">
          <Input
            type={showNewPassword ? "text" : "password"}
            label="New password"
            placeholder="At least 8 characters"
            id="reset-password"
            autoComplete="new-password"
            value={newPassword}
            error={fieldErrors.newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (fieldErrors.newPassword) setFieldErrors((p) => ({ ...p, newPassword: "" }));
            }}
            disabled={isSubmitting}
            required
            className="pr-11"
          />
          <button
            type="button"
            className="absolute right-4 top-9 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowNewPassword(!showNewPassword)}
            aria-label={showNewPassword ? "Hide password" : "Show password"}
          >
            {showNewPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          <PasswordStrength password={newPassword} />
        </div>

        <div className="relative">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            label="Confirm password"
            placeholder="Repeat your password"
            id="reset-confirm-password"
            autoComplete="new-password"
            value={confirmPassword}
            error={fieldErrors.confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword) setFieldErrors((p) => ({ ...p, confirmPassword: "" }));
            }}
            disabled={isSubmitting}
            required
            className="pr-11"
          />
          <button
            type="button"
            className="absolute right-4 top-9 text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
          >
            {showConfirmPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
          {confirmPassword.length > 0 && confirmPassword !== newPassword && (
            <p className="mt-1.5 text-xs text-destructive">Passwords do not match.</p>
          )}
        </div>

        <Button
          className="w-full"
          type="submit"
          disabled={
            isSubmitting ||
            passwordRuleResults(newPassword).some((rule) => !rule.met) ||
            confirmPassword !== newPassword
          }
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving password...
            </>
          ) : (
            "Save new password"
          )}
        </Button>
      </form>
    </div>
  );
}

function SuccessView() {
  const { openLogin } = useAuthModal();

  return (
    <div className="space-y-4 text-center py-4">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      <div className="space-y-1">
        <h2 className="text-xl font-semibold text-foreground">Password updated!</h2>
        <p className="text-sm text-muted-foreground">Your password has been changed successfully.</p>
      </div>
      <Button className="w-full" onClick={openLogin}>Continue to Sign In</Button>
    </div>
  );
}

export function AuthModals() {
  const { view, close } = useAuthModal();
  const shouldReduceMotion = useReducedMotion();

  const isOpen = view !== "closed";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <DialogContent showCloseButton size="default">
        <DialogHeader className="sr-only">
          <DialogTitle>
            {view === "login" && "Sign In"}
            {view === "register" && "Create Account"}
            {view === "forgot-password" && "Reset Password"}
            {view === "otp" && "Verify Email"}
            {view === "reset-password" && "New Password"}
            {view === "success" && "Success"}
          </DialogTitle>
          <DialogDescription>
            {view === "login" && "Sign in to your PawConnect account"}
            {view === "register" && "Create a new PawConnect account"}
            {view === "forgot-password" && "Enter your email to reset your password"}
            {view === "otp" && "Enter the OTP sent to your email"}
            {view === "reset-password" && "Enter your new password"}
            {view === "success" && "Your password has been updated"}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="p-6 sm:p-8 overflow-x-hidden">
          <motion.div
            layout
            transition={{
              duration: shouldReduceMotion ? 0.05 : 0.22,
              ease: [0.215, 0.61, 0.355, 1],
            }}
            className="w-full"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={view}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -6 }}
                transition={{
                  duration: shouldReduceMotion ? 0.05 : 0.16,
                  ease: [0.215, 0.61, 0.355, 1],
                }}
              >
                {view === "login" && <LoginForm />}
                {view === "register" && <RegisterForm />}
                {view === "forgot-password" && <ForgotPasswordForm />}
                {view === "otp" && <OtpForm />}
                {view === "reset-password" && <ResetPasswordForm />}
                {view === "success" && <SuccessView />}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const init = useAuthStore((s) => s.init);

  React.useEffect(() => {
    init();
  }, [init]);

  return (
    <>
      {children}
      <AuthModals />
    </>
  );
}
