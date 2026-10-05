"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      /*
       * TEMPORARY LOGIN
       *
       * For now, authentication is stored locally.
       * We will replace this with a real database/API
       * authentication system in the next step.
       */

      const storedUser = localStorage.getItem("campuspilot_user");

      if (!storedUser) {
        setError(
          "No account found. Please create a CampusPilot account first."
        );
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);

      if (
        user.email?.toLowerCase() !== email.trim().toLowerCase() ||
        user.password !== password
      ) {
        setError("Incorrect email or password.");
        setLoading(false);
        return;
      }

      localStorage.setItem(
        "campuspilot_session",
        JSON.stringify({
          email: user.email,
          name: user.name,
          loggedIn: true,
          loginTime: new Date().toISOString(),
          rememberMe,
        })
      );

      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <div className="background-glow glow-one"></div>
      <div className="background-glow glow-two"></div>

      <div className="auth-container">
        {/* LEFT SIDE */}
        <section className="brand-section">
          <Link href="/" className="brand">
            <span className="brand-icon">✦</span>
            <span>CampusPilot</span>
          </Link>

          <div className="brand-content">
            <div className="ai-badge">
              <span className="pulse"></span>
              AI-Powered Academic Assistant
            </div>

            <h1>
              Stay ahead of
              <br />
              <span>your campus life.</span>
            </h1>

            <p>
              CampusPilot turns complicated college notices into
              clear tasks, deadlines, calendar events and reminders.
            </p>

            <div className="feature-list">
              <div className="feature">
                <div className="feature-icon">✦</div>
                <div>
                  <strong>AI Notice Analysis</strong>
                  <span>
                    Understand important information instantly.
                  </span>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">✓</div>
                <div>
                  <strong>Smart Task Management</strong>
                  <span>
                    Know exactly what you need to do next.
                  </span>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">◷</div>
                <div>
                  <strong>Deadline Tracking</strong>
                  <span>
                    Never miss an important academic deadline.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="copyright">
            © 2026 CampusPilot
          </p>
        </section>

        {/* RIGHT SIDE */}
        <section className="login-section">
          <div className="login-card">
            <div className="mobile-brand">
              <Link href="/" className="brand">
                <span className="brand-icon">✦</span>
                <span>CampusPilot</span>
              </Link>
            </div>

            <div className="login-header">
              <h2>Welcome back</h2>

              <p>
                Sign in to continue to your CampusPilot dashboard.
              </p>
            </div>

            <form onSubmit={handleLogin}>
              {/* EMAIL */}
              <div className="form-group">
                <label htmlFor="email">
                  Email address
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">✉</span>

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <div className="password-label-row">
                  <label htmlFor="password">
                    Password
                  </label>

                  <button
                    type="button"
                    className="forgot-button"
                    onClick={() => {
                      setError(
                        "Password recovery will be available after we connect the database."
                      );
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="input-wrapper">
                  <span className="input-icon">●</span>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              {/* REMEMBER ME */}
              <div className="remember-row">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) =>
                      setRememberMe(e.target.checked)
                    }
                  />

                  <span className="custom-checkbox"></span>

                  <span>Remember me</span>
                </label>
              </div>

              {/* ERROR */}
              {error && (
                <div className="error-message">
                  <span>!</span>
                  <p>{error}</p>
                </div>
              )}

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className="login-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <span>→</span>
                  </>
                )}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="divider">
              <span>OR</span>
            </div>

            {/* DEMO LOGIN */}
            <button
              type="button"
              className="demo-button"
              onClick={() => {
                setEmail("demo@campuspilot.com");
                setPassword("demo123");
                setError(
                  "Demo account is not available until you create it from the Signup page."
                );
              }}
            >
              <span>⚡</span>
              Use demo account
            </button>

            {/* SIGNUP */}
            <p className="signup-text">
              Don't have an account?{" "}
              <Link href="/signup">
                Create one
              </Link>
            </p>

            <p className="security-note">
              🔒 Your academic data stays private.
            </p>
          </div>
        </section>
      </div>

      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          background: #f8f9fc;
          color: #111827;
        }

        .background-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          opacity: 0.35;
        }

        .glow-one {
          width: 400px;
          height: 400px;
          background: #c7d2fe;
          top: -180px;
          left: -100px;
        }

        .glow-two {
          width: 350px;
          height: 350px;
          background: #ddd6fe;
          bottom: -180px;
          right: -100px;
        }

        .auth-container {
          min-height: 100vh;
          width: min(1250px, 100%);
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1fr 0.85fr;
          position: relative;
          z-index: 1;
        }

        .brand-section {
          padding: 42px 60px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .brand {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          width: fit-content;
          color: #312e81;
          text-decoration: none;
          font-size: 18px;
          font-weight: 800;
        }

        .brand-icon {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          border-radius: 9px;
          background: #4f46e5;
          color: white;
          font-size: 18px;
          box-shadow: 0 6px 15px rgba(79, 70, 229, 0.25);
        }

        .brand-content {
          max-width: 560px;
          margin: auto 0;
        }

        .ai-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border-radius: 999px;
          background: #eef2ff;
          border: 1px solid #e0e7ff;
          color: #4f46e5;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 22px;
        }

        .pulse {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 0 4px #dcfce7;
        }

        .brand-content h1 {
          font-size: clamp(42px, 5vw, 66px);
          line-height: 1.03;
          letter-spacing: -2.8px;
          margin: 0;
          font-weight: 850;
        }

        .brand-content h1 span {
          color: #4f46e5;
        }

        .brand-content > p {
          max-width: 510px;
          margin: 24px 0 34px;
          color: #6b7280;
          line-height: 1.7;
          font-size: 15px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 13px;
        }

        .feature-icon {
          width: 39px;
          height: 39px;
          display: grid;
          place-items: center;
          border-radius: 11px;
          background: white;
          color: #4f46e5;
          border: 1px solid #e5e7eb;
          font-weight: 800;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.04);
        }

        .feature strong {
          display: block;
          font-size: 13px;
          margin-bottom: 3px;
        }

        .feature span {
          display: block;
          color: #9ca3af;
          font-size: 11px;
        }

        .copyright {
          color: #9ca3af;
          font-size: 11px;
          margin: 0;
        }

        .login-section {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 35px 45px;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 35px;
          box-shadow:
            0 25px 70px rgba(17, 24, 39, 0.08),
            0 5px 20px rgba(17, 24, 39, 0.03);
          backdrop-filter: blur(15px);
        }

        .mobile-brand {
          display: none;
          margin-bottom: 25px;
        }

        .login-header {
          margin-bottom: 27px;
        }

        .login-header h2 {
          margin: 0 0 7px;
          font-size: 28px;
          letter-spacing: -0.7px;
        }

        .login-header p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 19px;
        }

        .form-group label {
          display: block;
          color: #374151;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .password-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .password-label-row label {
          margin-bottom: 8px;
        }

        .forgot-button {
          border: 0;
          background: transparent;
          color: #4f46e5;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          padding: 0;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 14px;
          color: #9ca3af;
          font-size: 13px;
          pointer-events: none;
        }

        .input-wrapper input {
          width: 100%;
          height: 48px;
          border: 1px solid #d1d5db;
          border-radius: 11px;
          outline: none;
          padding: 0 14px 0 40px;
          color: #111827;
          background: #fff;
          font-size: 13px;
          transition: 0.2s;
        }

        .input-wrapper input::placeholder {
          color: #b0b5bd;
        }

        .input-wrapper input:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          border: 0;
          background: transparent;
          color: #4f46e5;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
        }

        .remember-row {
          margin: 3px 0 18px;
        }

        .checkbox-label {
          display: flex !important;
          align-items: center;
          gap: 8px;
          color: #6b7280 !important;
          font-weight: 500 !important;
          cursor: pointer;
          margin: 0 !important;
        }

        .checkbox-label input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .custom-checkbox {
          width: 16px;
          height: 16px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          position: relative;
          background: white;
        }

        .checkbox-label input:checked + .custom-checkbox {
          background: #4f46e5;
          border-color: #4f46e5;
        }

        .checkbox-label input:checked + .custom-checkbox::after {
          content: "✓";
          position: absolute;
          color: white;
          font-size: 11px;
          font-weight: 900;
          left: 3px;
          top: -1px;
        }

        .error-message {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 10px 12px;
          border-radius: 9px;
          margin-bottom: 15px;
        }

        .error-message > span {
          width: 17px;
          height: 17px;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: #dc2626;
          color: white;
          font-size: 10px;
          font-weight: 900;
          flex-shrink: 0;
        }

        .error-message p {
          margin: 0;
          font-size: 11px;
          line-height: 1.4;
        }

        .login-button {
          width: 100%;
          height: 48px;
          border: 0;
          border-radius: 11px;
          background: #4f46e5;
          color: white;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: 0.2s;
          box-shadow: 0 8px 20px rgba(79, 70, 229, 0.2);
        }

        .login-button:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-1px);
        }

        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.4);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 22px 0;
          color: #9ca3af;
          font-size: 9px;
          font-weight: 700;
        }

        .divider::before,
        .divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: #e5e7eb;
        }

        .demo-button {
          width: 100%;
          height: 44px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          background: white;
          color: #374151;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: 0.2s;
        }

        .demo-button:hover {
          background: #f9fafb;
          border-color: #c7d2fe;
        }

        .signup-text {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          margin: 23px 0 0;
        }

        .signup-text a {
          color: #4f46e5;
          font-weight: 800;
          text-decoration: none;
        }

        .security-note {
          text-align: center;
          color: #9ca3af;
          font-size: 10px;
          margin: 17px 0 0;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .auth-container {
            grid-template-columns: 1fr;
          }

          .brand-section {
            display: none;
          }

          .mobile-brand {
            display: block;
          }

          .login-section {
            min-height: 100vh;
            padding: 25px 18px;
          }
        }

        @media (max-width: 500px) {
          .login-card {
            padding: 25px 20px;
            border-radius: 18px;
          }

          .login-header h2 {
            font-size: 25px;
          }
        }
      `}</style>
    </main>
  );
}