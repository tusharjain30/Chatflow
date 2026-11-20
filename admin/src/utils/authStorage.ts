export type Portal = "user" | "reseller" | "admin";

const TOKEN_KEYS: Record<Portal, string> = {
  user: "auth_token_user",
  reseller: "auth_token_reseller",
  admin: "auth_token_admin",
};

const LEGACY_TOKEN_KEY = "auth_token";
const LEGACY_PORTAL_KEY = "auth_portal";

export function resolvePortalFromPath(
  pathname = typeof window !== "undefined" ? window.location.pathname : "/",
): Portal {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/reseller")) return "reseller";
  return "user";
}

export function getPortalHome(portal: Portal): string {
  if (portal === "admin") return "/admin";
  if (portal === "reseller") return "/reseller";
  return "/";
}

export function getPortalLogin(portal: Portal): string {
  if (portal === "admin") return "/admin/login";
  if (portal === "reseller") return "/reseller/login";
  return "/login";
}

/** One-time migration from shared auth_token / auth_portal keys. */
export function migrateLegacyAuthStorage(): void {
  if (typeof window === "undefined") return;

  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
  const legacyPortal = (localStorage.getItem(LEGACY_PORTAL_KEY) ||
    "user") as Portal;

  if (legacyToken && !localStorage.getItem(TOKEN_KEYS[legacyPortal])) {
    localStorage.setItem(TOKEN_KEYS[legacyPortal], legacyToken);
  }

  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_PORTAL_KEY);
}

export function getAuthToken(portal?: Portal): string | null {
  const resolved = portal ?? resolvePortalFromPath();
  const key = TOKEN_KEYS[resolved];
  return localStorage.getItem(key) || sessionStorage.getItem(key);
}

export function setAuthToken(
  portal: Portal,
  token: string,
  rememberMe = true,
): void {
  const key = TOKEN_KEYS[portal];

  if (rememberMe) {
    sessionStorage.removeItem(key);
    localStorage.setItem(key, token);
    return;
  }

  localStorage.removeItem(key);
  sessionStorage.setItem(key, token);
}

export function clearAuthToken(portal: Portal): void {
  const key = TOKEN_KEYS[portal];
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}

export function clearAuthSession(portal: Portal): void {
  clearAuthToken(portal);
  // Legacy key used by older customer flows
  if (portal === "user") {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
  }
}

export function getAuthHeader(portal?: Portal): { Authorization: string } | {} {
  const token = getAuthToken(portal);
  return token ? { Authorization: `Bearer ${token}` } : {};
}
