import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { login, verifyCode } from "../api/auth";
import { describeApiError } from "../api/client";
import { FIRST_TIME_RENEWAL_FORM_URL } from "../constants";
import { BrandMark, Button, ExternalLink, FormField, TextInput } from "../components/ui";
import styles from "../components/ui.module.css";

function FirstTimeRenewalPanel() {
  return (
    <aside className={styles.loginOnboarding} aria-label="First-time renewal">
      <h3 className={styles.loginOnboardingTitle}>Don&apos;t have a Member Portal account yet?</h3>
      <p className={styles.loginOnboardingBody}>
        <strong>Existing members</strong> — sign in above with your UP Circuit email and password.
      </p>
      <p className={styles.loginOnboardingBody}>
        <strong>New to the portal?</strong>{" "}
        <Link to="/register" className="font-medium text-bright-blue">
          Create an account
        </Link>{" "}
        with your @up.edu.ph email.
      </p>
      <ExternalLink href={FIRST_TIME_RENEWAL_FORM_URL} className={styles.loginOnboardingCta}>
        First-time renewal form ↗
      </ExternalLink>
    </aside>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const registerMessage = (location.state as { message?: string } | null)?.message;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"password" | "otp">("password");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onPasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    setLoading(true);
    try {
      const result = await login(email.trim(), password);
      if (result.verification_required) {
        setStep("otp");
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  }

  async function onOtpSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from the backend console.");
      return;
    }
    setLoading(true);
    try {
      await verifyCode(email.trim(), code);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(describeApiError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={styles.loginPage}>
      <section className={styles.loginCard}>
        <div className={styles.loginBrand}>
          <BrandMark size="xl" />
          <p className={styles.loginBrandTitle}>UP Circuit</p>
          <p className={styles.loginBrandSubtitle}>Member Portal</p>
        </div>

        {step === "password" ? (
          <>
            <h2 className={styles.loginHeading}>Sign in</h2>
            <p className={styles.loginHelper}>
              Use your UP Circuit email and password. You will receive a one-time verification code
              after signing in.
            </p>
            <form className={styles.loginForm} onSubmit={onPasswordSubmit}>
              <FormField label="Email">
                <TextInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                />
              </FormField>
              <FormField label="Password">
                <TextInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </FormField>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className={styles.loginSubmit}
              >
                {loading ? "Signing in…" : "Log In"}
              </Button>
            </form>
          </>
        ) : (
          <div className={styles.otpPanel}>
            <h2 className={styles.loginHeading}>Verification code</h2>
            <p className={styles.loginHelper}>
              Check the backend console for your one-time code.
            </p>
            <form className={styles.loginForm} onSubmit={onOtpSubmit}>
              <FormField label="Verification code">
                <TextInput
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </FormField>
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
                className={styles.loginSubmit}
              >
                {loading ? "Verifying…" : "Verify"}
              </Button>
            </form>
          </div>
        )}

        {registerMessage ? (
          <p className={styles.loginSuccess} role="status">
            {registerMessage}
          </p>
        ) : null}
        {error ? <p className={styles.loginError} role="alert">{error}</p> : null}

        {step === "password" ? <FirstTimeRenewalPanel /> : null}
      </section>
    </main>
  );
}

