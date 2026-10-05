export type CampusPilotUser = {
  name: string;
  email: string;
  studentId: string;
  password?: string;
  createdAt?: string;
};

export type CampusPilotSession = {
  name: string;
  email: string;
  studentId: string;
  loggedIn: boolean;
  loginTime?: string;
  rememberMe?: boolean;
};

const USER_STORAGE_KEY = "campuspilot_user";
const SESSION_STORAGE_KEY = "campuspilot_session";

/**
 * Get the currently registered CampusPilot user.
 */
export function getStoredUser(): CampusPilotUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);

    if (!storedUser) {
      return null;
    }

    return JSON.parse(storedUser) as CampusPilotUser;
  } catch (error) {
    console.error("Failed to read CampusPilot user:", error);
    return null;
  }
}

/**
 * Get the current login session.
 */
export function getSession(): CampusPilotSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedSession = localStorage.getItem(
      SESSION_STORAGE_KEY
    );

    if (!storedSession) {
      return null;
    }

    const session = JSON.parse(
      storedSession
    ) as CampusPilotSession;

    if (!session.loggedIn) {
      return null;
    }

    return session;
  } catch (error) {
    console.error(
      "Failed to read CampusPilot session:",
      error
    );

    return null;
  }
}

/**
 * Check whether a user is currently logged in.
 */
export function isLoggedIn(): boolean {
  return getSession() !== null;
}

/**
 * Create a CampusPilot session.
 */
export function createSession(
  user: CampusPilotUser,
  rememberMe = true
): CampusPilotSession {
  if (typeof window === "undefined") {
    throw new Error(
      "createSession can only be used in the browser."
    );
  }

  const session: CampusPilotSession = {
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    loggedIn: true,
    loginTime: new Date().toISOString(),
    rememberMe,
  };

  localStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(session)
  );

  return session;
}

/**
 * Log the current user out.
 */
export function logout(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Clear the complete local CampusPilot account.
 *
 * Useful during development/testing.
 */
export function clearAccount(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(USER_STORAGE_KEY);
  localStorage.removeItem(SESSION_STORAGE_KEY);
}

/**
 * Get the logged-in user's display name.
 */
export function getUserName(): string {
  const session = getSession();

  return session?.name || "Student";
}

/**
 * Get the logged-in user's email.
 */
export function getUserEmail(): string {
  const session = getSession();

  return session?.email || "";
}

/**
 * Get the logged-in user's student ID.
 */
export function getStudentId(): string {
  const session = getSession();

  return session?.studentId || "";
}

/**
 * Protect a client-side page.
 *
 * If the user isn't logged in, redirect them to /login.
 *
 * Returns true when the user is authenticated.
 */
export function requireAuth(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const session = getSession();

  if (!session) {
    window.location.href = "/login";
    return false;
  }

  return true;
}