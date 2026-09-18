import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  clearAuthSession,
  getAuthToken,
  migrateLegacyAuthStorage,
  resolvePortalFromPath,
  setAuthToken,
  type Portal,
  getPortalHome,
} from "@/utils/authStorage";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

/* ================= TYPES ================= */

export type Role = {
  id: string;
  name: string;
  roleType: string;
};

export type Account = {
  id: string;
  companyName: string;
};

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  userName?: string;
  email: string;
  phone: string;
  image?: string | null;
  role?: Role;
  account?: Account;
  userType: string;
  companyName?: string;
  commissionRate?: number;
  balance?: number;
  impersonatedBy?: {
    adminId?: string;
    adminName?: string;
    adminEmail?: string;
    resellerId?: string;
    resellerName?: string;
    resellerCompanyName?: string;
  } | null;
};

type SupportSession = {
  originToken: string;
  originPortal: Portal;
  originLabel?: string;
  adminName?: string;
  adminEmail?: string;
  resellerCompanyName?: string;
  resellerName?: string;
  customerCompanyName?: string;
  resellerToken?: string;
  resellerPortal?: "reseller";
};

/* ================= CONTEXT TYPE ================= */

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isReseller: boolean;
  isImpersonatingCustomer: boolean;
  isSupportSessionActive: boolean;
  supportSession: SupportSession | null;
  logout: () => void;
  restoreSupportSession: () => Promise<void>;
  restoreResellerSession: () => Promise<void>;
  refetchProfile: () => Promise<void>;
};

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPPORT_SESSION_KEY = "support_session";

migrateLegacyAuthStorage();

/* ================= PROVIDER ================= */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [supportSession, setSupportSession] = useState<SupportSession | null>(
    () => {
      const raw = localStorage.getItem(SUPPORT_SESSION_KEY);
      if (!raw) return null;

      try {
        return JSON.parse(raw) as SupportSession;
      } catch (error) {
        console.error("Invalid support session:", error);
        localStorage.removeItem(SUPPORT_SESSION_KEY);
        return null;
      }
    },
  );

  /* ========== FETCH PROFILE ========== */
  const fetchProfile = useCallback(async () => {
    const portal = resolvePortalFromPath();
    const token = getAuthToken(portal);

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profileUrl =
        portal === "reseller"
          ? `${API_BASE}/reseller/profile/me`
          : portal === "admin"
            ? `${API_BASE}/super-admin/profile/get`
            : `${API_BASE}/user/profile/me`;

      const res = await fetch(profileUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();

      if (!res.ok || json.status !== 1) {
        throw new Error("Invalid token");
      }

      setUser(json.data);
    } catch (err) {
      console.error("Profile fetch failed:", err);
      // Only clear the portal that failed — keep other dashboard sessions.
      clearAuthSession(portal);
      if (portal === resolvePortalFromPath()) {
        localStorage.removeItem(SUPPORT_SESSION_KEY);
        setSupportSession(null);
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ========== LOAD PROFILE ON APP START ========== */
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ========== LOGOUT (current portal only) ========== */
  const logout = useCallback(() => {
    const portal = resolvePortalFromPath();
    clearAuthSession(portal);

    // Support/impersonation sessions only apply on the customer portal.
    if (portal === "user") {
      localStorage.removeItem(SUPPORT_SESSION_KEY);
      setSupportSession(null);
    }

    setUser(null);
  }, []);

  const restoreSupportSession = useCallback(async () => {
    const originToken =
      supportSession?.originToken || supportSession?.resellerToken;
    const originPortal =
      supportSession?.originPortal || supportSession?.resellerPortal;

    if (!originToken || !originPortal) {
      logout();
      return;
    }

    const currentPortal = resolvePortalFromPath();
    setAuthToken(originPortal, originToken);
    if (currentPortal !== originPortal) {
      clearAuthSession(currentPortal);
    }
    localStorage.removeItem(SUPPORT_SESSION_KEY);
    setSupportSession(null);
    setUser(null);
    setLoading(false);
    window.location.assign(getPortalHome(originPortal));
  }, [logout, supportSession]);

  const restoreResellerSession = useCallback(async () => {
    await restoreSupportSession();
  }, [restoreSupportSession]);

  const currentPortal = resolvePortalFromPath();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.userType === "ADMIN",
        isReseller: user?.userType === "RESELLER",
        isImpersonatingCustomer:
          currentPortal === "user" && !!supportSession,
        isSupportSessionActive: !!supportSession,
        supportSession,
        logout,
        restoreSupportSession,
        restoreResellerSession,
        refetchProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ================= HOOK ================= */

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
