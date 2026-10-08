import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useTitle, Wordmark } from "../components/ui.jsx";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../store.js";

export default function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useTitle(isLogin ? "Log in" : "Sign up");

  const nextPath = location.state?.from?.startsWith("/app") ? location.state.from : "/app";
  if (user) return <Navigate to={isLogin ? nextPath : "/app/profile"} replace />;

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    if (!isLogin && password !== confirm) {
      setError("Those passwords do not match.");
      return;
    }
    setPending(true);
    const result = isLogin
      ? await login(email, password)
      : await register({ name, email, password });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(isLogin ? nextPath : "/app/profile", { replace: true });
  }

  async function useDemo() {
    setError("");
    setPending(true);
    const result = await login(DEMO_EMAIL, DEMO_PASSWORD);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    navigate(nextPath, { replace: true });
  }

  return (
    <div className="auth-screen">
      <aside className="auth-aside">
        <Link to="/" className="brand-link light">
          <Wordmark />
        </Link>
        <div>
          <p className="eyebrow">University students only</p>
          <h1>Your section, your syllabus, your study partners.</h1>
          <p>
            LecturePals keeps accounts on university emails so the people you meet are enrolled students, not strangers
            from a public tutor board.
          </p>
        </div>
        <p className="aside-foot">IS 3103 · TTH 10:00 AM – 12:00 PM</p>
      </aside>
      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="brand-link auth-brand">
            <Wordmark />
          </Link>
          <h1>{isLogin ? "Log in" : "Create your account"}</h1>
          <p className="muted">
            {isLogin
              ? "Use the university email you signed up with."
              : "Use an email that ends in .edu.ph. Other addresses are turned away."}
          </p>
          <form onSubmit={onSubmit} noValidate>
            {!isLogin && (
              <label className="field">
                <span>Full name</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoComplete="name"
                  maxLength={60}
                  required
                />
              </label>
            )}
            <label className="field">
              <span>University email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                inputMode="email"
                placeholder="name@university.edu.ph"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <span className="password-row">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  minLength={8}
                  required
                />
                <button
                  type="button"
                  className="btn ghost small"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
            </label>
            {!isLogin && (
              <label className="field">
                <span>Confirm password</span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={(event) => setConfirm(event.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </label>
            )}
            {error ? (
              <p className="error" role="alert">
                {error}
              </p>
            ) : null}
            <button className="btn primary full" type="submit" disabled={pending}>
              {pending ? "Please wait…" : isLogin ? "Log in" : "Sign up"}
            </button>
          </form>
          {isLogin ? (
            <div className="demo-box">
              <p>
                Class demo: <strong>{DEMO_EMAIL}</strong>
                <br />
                Password: <strong>{DEMO_PASSWORD}</strong>
              </p>
              <button type="button" className="btn secondary full" onClick={useDemo} disabled={pending}>
                Continue as Avery Quinn
              </button>
            </div>
          ) : null}
          <p className="switch-auth">
            {isLogin ? (
              <>
                New here? <Link to="/signup">Create an account</Link>
              </>
            ) : (
              <>
                Already registered? <Link to="/login">Log in</Link>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
