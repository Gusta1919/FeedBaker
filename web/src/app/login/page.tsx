"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useToast } from "@/components/ui/Toast";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "sign-in" | "sign-up";

const MIN_PASSWORD_LENGTH = 6;

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useToast();
  const redirectTo = searchParams.get("redirect") ?? "/feed";
  const callbackError = searchParams.get("error");

  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    callbackError ? "That sign-in link expired. Use your email and password." : null,
  );

  const resetFormErrors = () => setError(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    resetFormErrors();
    setConfirmPassword("");
  };

  const validate = (): string | null => {
    if (!email.includes("@")) return "Enter a valid email address.";
    if (password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (mode === "sign-up") {
      if (confirmPassword !== password) return "Passwords don't match.";
      if (username.trim() && !/^[a-zA-Z0-9_]{3,24}$/.test(username.trim())) {
        return "Username: 3–24 characters, letters, numbers, underscore only.";
      }
    }
    return null;
  };

  const finishAuth = () => {
    router.push(redirectTo);
    router.refresh();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setBusy(true);
    setError(null);

    const supabase = createClient();

    if (mode === "sign-in") {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      setBusy(false);

      if (signInError) {
        setError(
          signInError.message === "Invalid login credentials"
            ? "Wrong email or password."
            : signInError.message,
        );
        return;
      }

      finishAuth();
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          username: username.trim() || undefined,
        },
      },
    });

    setBusy(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      notify("Account created — welcome!", "success");
      finishAuth();
      return;
    }

    notify("Account created. You can log in now.", "success");
    switchMode("sign-in");
  };

  const handleOAuthSoon = (provider: "Google" | "Apple") => {
    notify(`${provider} sign-in is coming soon.`, "info");
  };

  return (
    <main className="app-shell app-bg">
      <div className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 py-12">
        <Logo href="/" size="lg" className="mb-10" />

        <div className="panel w-full max-w-sm p-7">
          <div className="mb-6 flex rounded-[var(--radius-btn)] border border-line bg-surface p-1">
            <ModeTab
              label="Log in"
              active={mode === "sign-in"}
              onClick={() => switchMode("sign-in")}
            />
            <ModeTab
              label="Sign up"
              active={mode === "sign-up"}
              onClick={() => switchMode("sign-up")}
            />
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {mode === "sign-in" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-paper-muted">
            {mode === "sign-in"
              ? "Sign in with your email and password to vote and create polls."
              : "One account per person — keeps votes honest."}
          </p>

          <div className="mt-7 space-y-2.5">
            <OAuthButton
              label="Continue with Google"
              onClick={() => handleOAuthSoon("Google")}
              icon={<GoogleMark />}
            />
            <OAuthButton
              label="Continue with Apple"
              onClick={() => handleOAuthSoon("Apple")}
              icon={<AppleMark />}
            />
          </div>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-paper-faint">
              or email
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "sign-up" && (
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Username (optional)"
                autoComplete="username"
                className="field"
              />
            )}

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className="field"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Password"
                autoComplete={
                  mode === "sign-in" ? "current-password" : "new-password"
                }
                required
                minLength={MIN_PASSWORD_LENGTH}
                className="field pr-16"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute inset-y-0 right-0 px-3 text-[11px] font-semibold text-paper-muted transition-colors hover:text-paper"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {mode === "sign-up" && (
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm password"
                autoComplete="new-password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                className="field"
              />
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn-brand flex w-full items-center justify-center gap-2 py-3.5 text-sm"
            >
              {busy ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                  {mode === "sign-in" ? "Signing in" : "Creating account"}
                </>
              ) : mode === "sign-in" ? (
                "Log in"
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {error && (
            <p className="anim-rise mt-4 rounded-md border border-red-500/25 bg-red-500/8 px-3.5 py-2.5 text-xs text-red-200">
              {error}
            </p>
          )}

          {mode === "sign-in" && (
            <p className="mt-5 text-center text-xs text-paper-faint">
              Demo account:{" "}
              <span className="font-medium text-paper-muted">
                demo@feedbacker.local
              </span>{" "}
              /{" "}
              <span className="font-medium text-paper-muted">demo123456</span>
            </p>
          )}
        </div>

        <Link
          href="/feed"
          className="mt-6 text-xs font-medium text-paper-faint transition-colors hover:text-paper-muted"
        >
          Just browse for now →
        </Link>
      </div>
    </main>
  );
}

function ModeTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-md py-2.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-surface-2 text-paper"
          : "text-paper-muted hover:text-paper"
      }`}
    >
      {label}
    </button>
  );
}

function OAuthButton({
  label,
  onClick,
  icon,
}: {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-ghost flex w-full items-center justify-center gap-2.5 py-3.5 text-sm"
    >
      {icon}
      {label}
      <span className="ml-1 rounded-full border border-line px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-paper-faint">
        Soon
      </span>
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.57c2.08-1.92 3.27-4.74 3.27-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.76c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.18a11 11 0 0 0 0 9.9l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="app-shell grid min-h-dvh place-items-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white" />
        </main>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
