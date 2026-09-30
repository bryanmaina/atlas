"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export interface UserProfile {
  id: string;
  name: string;
  skills: string;
  role: "ADMIN" | "VALIDATOR" | "CONTRIBUTOR" | string;
  email: string;
  department: string | null;
  avatarUrl: string | null;
}

export type UserPersona = UserProfile;

interface MockAuthContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  setCurrentUser: (user: UserProfile) => void;
  switchUserById: (userId: string) => void;
  isLoading: boolean;
  refreshUsers: () => Promise<void>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
  canValidateLevel: (requiredLevel: string) => boolean;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sync active user to cookie and localStorage so server-side route handlers can verify identity
  const persistActiveUser = (user: UserProfile) => {
    setCurrentUserState(user);
    if (typeof window !== "undefined") {
      localStorage.setItem("atlas-active-user-id", user.id);
      document.cookie = `atlas-active-user=${user.id}; path=/; max-age=604800; SameSite=Lax`;
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        const profiles: UserProfile[] = data.users || [];
        setUsers(profiles);

        if (profiles.length > 0) {
          const savedId = typeof window !== "undefined" ? localStorage.getItem("atlas-active-user-id") : null;
          const matched = profiles.find((u) => u.id === savedId);
          // Default to the first profile (Sarah Chen / Admin) or saved selection
          persistActiveUser(matched || profiles[0]);
        }
      }
    } catch (err) {
      console.error("Failed to load mock user profiles:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const switchUserById = useCallback(
    (userId: string) => {
      const target = users.find((u) => u.id === userId);
      if (target) {
        persistActiveUser(target);
      }
    },
    [users]
  );

  /**
   * Client-side fetch wrapper that injects authentication headers (x-atlas-user-id)
   * to ensure role verification and prevent IDOR attacks.
   */
  const authFetch = useCallback(
    async (url: string, init?: RequestInit): Promise<Response> => {
      const headers = new Headers(init?.headers);
      if (currentUser?.id) {
        headers.set("x-atlas-user-id", currentUser.id);
      }
      return fetch(url, {
        ...init,
        headers,
      });
    },
    [currentUser]
  );

  /**
   * Helper to check client-side permission before submitting approvals.
   */
  const canValidateLevel = useCallback(
    (requiredLevel: string): boolean => {
      if (!currentUser) return false;
      const role = currentUser.role.toUpperCase();
      const level = requiredLevel.toUpperCase();

      if (role === "ADMIN") return true; // Admins can validate LEVEL_1, LEVEL_2, LEVEL_3
      if (role === "VALIDATOR" && (level === "LEVEL_1" || level === "LEVEL_2")) return true;
      if (role === "CONTRIBUTOR" && level === "LEVEL_1") return true;

      return false;
    },
    [currentUser]
  );

  return (
    <MockAuthContext.Provider
      value={{
        currentUser,
        users,
        setCurrentUser: persistActiveUser,
        switchUserById,
        isLoading,
        refreshUsers: fetchUsers,
        authFetch,
        canValidateLevel,
      }}
    >
      {children}
    </MockAuthContext.Provider>
  );
}

export function useCurrentUser() {
  const context = useContext(MockAuthContext);
  if (!context) {
    throw new Error("useCurrentUser must be used within a UserProvider (MockAuthProvider)");
  }
  return context;
}
