"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    // Name validation
    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    // Email validation
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    // Student ID validation
    if (!studentId.trim()) {
      setError("Please enter your student ID.");
      return;
    }

    // Password validation
    if (!password) {
      setError("Please create a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    // Confirm password
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Terms
    if (!agreeTerms) {
      setError(
        "Please agree to the terms and conditions to continue."
      );
      return;
    }

    setLoading(true);

    try {
      // Check whether an account already exists
      const existingUser = localStorage.getItem(
        "campuspilot_user"
      );

      if (existingUser) {
        const user = JSON.parse(existingUser);

        if (
          user.email?.toLowerCase() ===
          email.trim().toLowerCase()
        ) {
          setError(
            "An account with this email already exists. Please sign in."
          );

          setLoading(false);
          return;
        }
      }

      /*
       * TEMPORARY LOCAL ACCOUNT
       *
       * This is only for the current MVP.
       * We will replace this with a real database
       * and secure authentication later.
       */

      const newUser = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        studentId: studentId.trim(),
        password,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        "campuspilot_user",
        JSON.stringify(newUser)
      );

      // Automatically create a session
      const session = {
        email: newUser.email,
        name: newUser.name,
        studentId: newUser.studentId,
        loggedIn: true,
        loginTime: new Date().toISOString(),
        rememberMe: true,
      };

      localStorage.setItem(
        "campuspilot_session",
        JSON.stringify(session)
      );

      // Go directly to dashboard
      router.push("/dashboard");
    } catch (err) {
      console.error("Signup error:", err);

      setError(
        "Something went wrong while creating your account."
      );
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
              Your campus.
              <br />
              <span>Under control.</span>
            </h1>

            <p>
              Create your CampusPilot account and let AI
              organize your academic life for you.
            </p>

            <div className="feature-list">

              <div className="feature">
                <div className="feature-icon">✦</div>

                <div>
                  <strong>Understand Notices</strong>
                  <span>
                    Turn long notices into simple actions.
                  </span>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">✓</div>

                <div>
                  <strong>Track Everything</strong>
                  <span>
                    Tasks, deadlines and academic events in one place.
                  </span>
                </div>
              </div>

              <div className="feature">
                <div className="feature-icon">◷</div>

                <div>
                  <strong>Stay Ahead</strong>
                  <span>
                    Get your next best action automatically.
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
        <section className="signup-section">

          <div className="signup-card">

            {/* MOBILE BRAND */}
            <div className="mobile-brand">
              <Link href="/" className="brand">
                <span className="brand-icon">✦</span>
                <span>CampusPilot</span>
              </Link>
            </div>

            {/* HEADER */}
            <div className="signup-header">
              <h2>Create your account</h2>

              <p>
                Start managing your academic life with
                CampusPilot.
              </p>
            </div>

            {/* FORM */}
            <form onSubmit={handleSignup}>

              {/* NAME */}
              <div className="form-group">
                <label htmlFor="name">
                  Full name
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">
                    👤
                  </span>

                  <input
                    id="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) =>
                      setName(e.target.value)
                    }
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div className="form-group">
                <label htmlFor="email">
                  Email address
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">
                    ✉
                  </span>

                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* STUDENT ID */}
              <div className="form-group">
                <label htmlFor="studentId">
                  Student ID
                </label>

                <div className="input-wrapper">
                  <span className="input-icon">
                    🎓
                  </span>

                  <input
                    id="studentId"
                    type="text"
                    placeholder="Enter your student ID"
                    value={studentId}
                    onChange={(e) =>
                      setStudentId(e.target.value)
                    }
                    autoComplete="off"
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div className="form-group">
                <label htmlFor="password">
                  Password
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    ●
                  </span>

                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>

                <p className="password-hint">
                  Use at least 6 characters.
                </p>
              </div>

              {/* CONFIRM PASSWORD */}
              <div className="form-group">
                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    ●
                  </span>

                  <input
                    id="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    autoComplete="new-password"
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  >
                    {showConfirmPassword
                      ? "Hide"
                      : "Show"}
                  </button>
                </div>
              </div>

              {/* TERMS */}
              <div className="terms-row">

                <label className="checkbox-label">

                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) =>
                      setAgreeTerms(
                        e.target.checked
                      )
                    }
                  />

                  <span className="custom-checkbox"></span>

                  <span>
                    I agree to the{" "}
                    <button
                      type="button"
                      className="terms-link"
                      onClick={() =>
                        setError(
                          "Terms and conditions will be added in the production version."
                        )
                      }
                    >
                      terms and conditions
                    </button>
                  </span>

                </label>

              </div>

              {/* ERROR */}
              {error && (
                <div className="error-message">

                  <span>!</span>

                  <p>{error}</p>

                </div>
              )}

              {/* CREATE ACCOUNT */}
              <button
                type="submit"
                className="signup-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="button-spinner"></span>
                    Creating account...
                  </>
                ) : (
                  <>
                    Create account
                    <span>→</span>
                  </>
                )}

              </button>

            </form>

            {/* LOGIN */}
            <p className="login-text">
              Already have an account?{" "}
              <Link href="/login">
                Sign in
              </Link>
            </p>

            {/* SECURITY */}
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

        .signup-section {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 30px 45px;
        }

        .signup-card {
          width: 100%;
          max-width: 440px;
          background: rgba(255, 255, 255, 0.94);
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 32px;
          box-shadow:
            0 25px 70px rgba(17, 24, 39, 0.08),
            0 5px 20px rgba(17, 24, 39, 0.03);
          backdrop-filter: blur(15px);
        }

        .mobile-brand {
          display: none;
          margin-bottom: 22px;
        }

        .signup-header {
          margin-bottom: 24px;
        }

        .signup-header h2 {
          margin: 0 0 7px;
          font-size: 28px;
          letter-spacing: -0.7px;
        }

        .signup-header p {
          margin: 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.5;
        }

        .form-group {
          margin-bottom: 15px;
        }

        .form-group label {
          display: block;
          color: #374151;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 7px;
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
          font-size: 12px;
          pointer-events: none;
        }

        .input-wrapper input {
          width: 100%;
          height: 45px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          outline: none;
          padding: 0 75px 0 40px;
          color: #111827;
          background: #fff;
          font-size: 12px;
          transition: 0.2s;
        }

        .input-wrapper input::placeholder {
          color: #b0b5bd;
        }

        .input-wrapper input:focus {
          border-color: #6366f1;
          box-shadow:
            0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          border: 0;
          background: transparent;
          color: #4f46e5;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .password-hint {
          color: #9ca3af;
          font-size: 9px;
          margin: 5px 0 0;
        }

        .terms-row {
          margin: 4px 0 16px;
        }

        .checkbox-label {
          display: flex !important;
          align-items: flex-start;
          gap: 8px;
          color: #6b7280 !important;
          font-weight: 500 !important;
          cursor: pointer;
          margin: 0 !important;
          line-height: 1.5;
        }

        .checkbox-label input {
          position: absolute;
          opacity: 0;
          pointer-events: none;
        }

        .custom-checkbox {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
          position: relative;
          background: white;
        }

        .checkbox-label input:checked
          + .custom-checkbox {
          background: #4f46e5;
          border-color: #4f46e5;
        }

        .checkbox-label input:checked
          + .custom-checkbox::after {
          content: "✓";
          position: absolute;
          color: white;
          font-size: 11px;
          font-weight: 900;
          left: 3px;
          top: -1px;
        }

        .terms-link {
          border: 0;
          background: transparent;
          padding: 0;
          color: #4f46e5;
          font-size: inherit;
          font-weight: 700;
          cursor: pointer;
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
          margin-bottom: 14px;
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

        .signup-button {
          width: 100%;
          height: 47px;
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
          box-shadow:
            0 8px 20px rgba(79, 70, 229, 0.2);
        }

        .signup-button:hover:not(:disabled) {
          background: #4338ca;
          transform: translateY(-1px);
        }

        .signup-button:disabled {
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

        .login-text {
          text-align: center;
          color: #6b7280;
          font-size: 12px;
          margin: 22px 0 0;
        }

        .login-text a {
          color: #4f46e5;
          font-weight: 800;
          text-decoration: none;
        }

        .security-note {
          text-align: center;
          color: #9ca3af;
          font-size: 10px;
          margin: 16px 0 0;
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

          .signup-section {
            min-height: 100vh;
            padding: 25px 18px;
          }
        }

        @media (max-width: 500px) {
          .signup-card {
            padding: 25px 20px;
            border-radius: 18px;
          }

          .signup-header h2 {
            font-size: 25px;
          }
        }
      `}</style>
    </main>
  );
}