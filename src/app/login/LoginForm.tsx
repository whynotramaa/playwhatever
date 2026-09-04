"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { AuthShell } from "@/components/AuthShell";
import { OtpInput, type OtpStatus } from "@/components/OtpInput";
import { Button } from "@/components/Button";
import { GoogleMark } from "@/components/GoogleMark";

const RESEND_SECONDS = 30;
const AFTER_LOGIN = "/welcome";

type Mode = "signin" | "signup";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpStatus, setOtpStatus] = useState<OtpStatus>("idle");
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  // The one place a code gets requested. Signing up fresh, signing up again
  // with an existing address, and signing in unverified all route through
  // here, so all three behave identically.
  const goToOtp = async () => {
    setStep("otp");
    setCode("");
    setOtpStatus("idle");
    setError(null);
    setResendIn(RESEND_SECONDS);
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    if (sendError) {
      setError(sendError.message ?? "Could not send the code. Try resend.");
    }
  };

  const submitCredentials = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);

    if (mode === "signup") {
      const { error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name: email.split("@")[0],
      });
      setPending(false);
      // requireEmailVerification means no session yet, and the OTP is already
      // on its way from sendVerificationOnSignUp.
      if (signUpError) {
        setError(signUpError.message ?? "Could not create that account.");
        return;
      }
      await goToOtp();
      return;
    }

    const { error: signInError } = await authClient.signIn.email({ email, password });
    setPending(false);
    if (signInError) {
      // sendOnSignIn already mailed a fresh code, so walk straight to the
      // code screen instead of showing a dead end.
      if (signInError.code === "EMAIL_NOT_VERIFIED") {
        await goToOtp();
        return;
      }
      setError(signInError.message ?? "That email and password did not match.");
      return;
    }
    router.push(AFTER_LOGIN);
  };

  const verify = useCallback(
    async (submitted: string) => {
      setOtpStatus("verifying");
      setError(null);
      const { error: verifyError } = await authClient.emailOtp.verifyEmail({
        email,
        otp: submitted,
      });
      if (verifyError) {
        setOtpStatus("error");
        setError(verifyError.message ?? "That code is not right.");
        // Let the shake finish, then hand back an empty field.
        setTimeout(() => {
          setCode("");
          setOtpStatus("idle");
        }, 420);
        return;
      }
      setOtpStatus("success");
      router.push(AFTER_LOGIN);
    },
    [email, router]
  );

  const resend = async () => {
    if (resendIn > 0) return;
    setResendIn(RESEND_SECONDS);
    setError(null);
    await authClient.emailOtp.sendVerificationOtp({ email, type: "email-verification" });
  };

  const withGoogle = async () => {
    setPending(true);
    setError(null);
    const { error: socialError } = await authClient.signIn.social({
      provider: "google",
      callbackURL: AFTER_LOGIN,
      errorCallbackURL: "/login",
    });
    if (socialError) {
      setPending(false);
      setError(socialError.message ?? "Google sign-in did not go through.");
    }
  };

  if (step === "otp") {
    return (
      <AuthShell
        title="Check your email"
        subtitle={
          <>
            We sent a six digit code to <strong>{email}</strong>.
          </>
        }
      >
        <div className="auth-stack">
          <OtpInput
            value={code}
            onChange={setCode}
            onComplete={verify}
            status={otpStatus}
            disabled={otpStatus === "verifying" || otpStatus === "success"}
          />

          <p className="auth-note" role={error ? "alert" : undefined}>
            {error ? (
              <span className="is-error">{error}</span>
            ) : otpStatus === "verifying" ? (
              "Checking your code."
            ) : otpStatus === "success" ? (
              "You are in."
            ) : (
              "Paste it or type it. It expires in 10 minutes."
            )}
          </p>

          <Button
            variant="primary"
            isBlock
            isLoading={otpStatus === "verifying"}
            disabled={code.length < 6 || otpStatus === "success"}
            onClick={() => verify(code)}
          >
            Verify
          </Button>

          <div className="auth-row">
            <button type="button" className="auth-link" onClick={() => setStep("credentials")}>
              <ArrowLeft className="w-4 h-4" />
              Use a different email
            </button>
            <button
              type="button"
              className="auth-link"
              onClick={resend}
              disabled={resendIn > 0}
            >
              {resendIn > 0 ? `Resend in ${resendIn}s` : "Resend code"}
            </button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={mode === "signin" ? "Sign in" : "Create an account"}
      subtitle={
        mode === "signin"
          ? "Host rooms, keep your stats, and hold on to your username."
          : "One username, one email, and you are set."
      }
      footer={
        mode === "signin" ? (
          <>
            New here?{" "}
            <button type="button" className="auth-link" onClick={() => setMode("signup")}>
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have one?{" "}
            <button type="button" className="auth-link" onClick={() => setMode("signin")}>
              Sign in
            </button>
          </>
        )
      }
    >
      <div className="auth-stack">
        <Button variant="outline" isBlock onClick={withGoogle} disabled={pending}>
          <GoogleMark />
          Continue with Google
        </Button>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <form className="auth-stack" onSubmit={submitCredentials} noValidate={false}>
          <div className="field">
            <label htmlFor="auth-email" className="auth-label">
              Email
            </label>
            <input
              id="auth-email"
              className="input"
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="auth-password" className="auth-label">
              Password
            </label>
            <div className="auth-password">
              <input
                id="auth-password"
                className="input"
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "At least 8 characters" : "Your password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={8}
                required
              />
              <button
                type="button"
                className="auth-reveal"
                onClick={() => setShowPassword((on) => !on)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="auth-note" role="alert">
              <span className="is-error">{error}</span>
            </p>
          )}

          <Button type="submit" variant="primary" isBlock isLoading={pending}>
            Continue
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
