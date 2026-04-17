import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

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
};

/* ================= CONTEXT TYPE ================= */

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isReseller: boolean;
  logout: () => void;
  refetchProfile: () => Promise<void>;
};

/* ================= CONTEXT ================= */

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/* ================= PROVIDER ================= */

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /* ========== FETCH PROFILE ========== */
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    const portal = localStorage.getItem("auth_portal") || "user";

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const profileUrl =
        portal === "reseller"
          ? `${API_BASE}/reseller/profile/me`
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
      logout(); // token invalid → force logout
    } finally {
      setLoading(false);
    }
  }, []);

  /* ========== LOAD PROFILE ON APP START ========== */
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  /* ========== LOGOUT ========== */
  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user");
    localStorage.removeItem("auth_portal");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.userType === "ADMIN",
        isReseller: user?.userType === "RESELLER",
        logout,
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
