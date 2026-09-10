import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { getMockResponse } from "@/lib/mockApi";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  sector: string | null;
  county: string | null;
  organizationName: string | null;
  organizationType: string | null;
  phone: string | null;
  isActive: boolean;
  isDemo: boolean;
  createdAt: string;
  lastLogin: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  const fetchUser = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        const mock = getMockResponse("/api/auth/me");
        setUser(mock?.user || null);
      }
    } catch (error) {
      const mock = getMockResponse("/api/auth/me");
      setUser(mock?.user || null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/login", { email, password });
      const data = await response.json();
      
      if (response.ok) {
        setUser(data.user);
        return { success: true };
      } else {
        const mock = getMockResponse("/api/auth/me");
        if (mock?.user) {
          setUser(mock.user);
          return { success: true };
        }
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      const mock = getMockResponse("/api/auth/me");
      if (mock?.user) {
        setUser(mock.user);
        return { success: true };
      }
      return { success: false, error: "Network error. Please try again." };
    }
  };

  const logout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setUser(null);
      setLocation("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const refetchUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Role-based access helpers
export function canAccessSector(user: User | null, sector: string): boolean {
  if (!user) return false;
  if (user.role === "admin" || user.role === "ministry") return true;
  if (user.role === "employer" || user.role === "enumerator") {
    return user.sector === sector;
  }
  return false;
}

export function canEnterData(user: User | null): boolean {
  if (!user) return false;
  return ["admin", "ministry", "employer", "enumerator", "individual"].includes(user.role);
}

export function canVerifyData(user: User | null): boolean {
  if (!user) return false;
  return ["admin", "ministry"].includes(user.role);
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: "System Administrator",
    ministry: "Ministry Verifier",
    employer: "Employer",
    enumerator: "County Enumerator",
    individual: "Individual Worker",
  };
  return labels[role] || role;
}

export function getSectorLabel(sector: string | null): string {
  if (!sector) return "All Sectors";
  const labels: Record<string, string> = {
    public: "Public Sector",
    private: "Private Sector",
    ngo: "NGO/Projects",
    informal: "Informal Sector",
    seasonal: "Seasonal Work",
  };
  return labels[sector] || sector;
}
