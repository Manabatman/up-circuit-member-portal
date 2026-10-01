import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerAccount, ApiRequestError } from "../api/auth";
import { BrandMark, Button, FormField, TextInput } from "../components/ui";
import styles from "../components/ui.module.css";

export function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      return;
    }
    setLoading(true);
    try {
      await registerAccount({
        email: email.trim(),
        password,
        full_name: fullName.trim(),
      });
      navigate("/login", {
        replace: true,
        state: { message: "Account created. Sign in with your email and password." },
      });
    } catch (err) {
      if (err instanceof ApiRequestError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Registration failed.");
      }
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
          <p className={styles.loginBrandSubtitle}>Create your account</p>
        </div>
        <h2 className={styles.loginHeading}>Register</h2>
        <p className={styles.loginHelper}>
          Use your <strong>@up.edu.ph</strong> email. Your membership starts as{" "}
          <strong>pending</strong> until an officer approves you.
        </p>
        <form className={styles.loginForm} onSubmit={onSubmit}>
          <FormField label="Full name">
            <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </FormField>
          <FormField label="UP email">
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
              autoComplete="new-password"
            />
          </FormField>
          <Button type="submit" variant="primary" disabled={loading} className={styles.loginSubmit}>
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>
        {error ? (
          <p className={styles.loginError} role="alert">
            {error}
          </p>
        ) : null}
        <p className={styles.loginHelper}>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-bright-blue no-underline hover:underline">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
