const AUTH_KEY = "airbnb_manager_auth_v2";
const SESSION_KEY = "airbnb_manager_session_v2";

// 2 utenti demo:
// - admin / 1234 -> può modificare tutto
// - viewer / 1234 -> sola lettura
const DEFAULT = {
  users: [
    { username: "admin", password: "1234", role: "admin" },
    { username: "viewer", password: "1234", role: "viewer" },
  ],
};

export function getAuthConfig() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setAuthConfig(cfg) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(cfg));
}

export function isLoggedIn() {
  return !!localStorage.getItem(SESSION_KEY);
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getRole() {
  const s = getSession();
  return s?.role || "viewer";
}

export function login(username, password) {
  const cfg = getAuthConfig();
  const u = cfg.users.find(
    (x) => x.username === String(username).trim() && x.password === String(password)
  );
  if (!u) return false;

  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: u.username, role: u.role }));
  return true;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}
