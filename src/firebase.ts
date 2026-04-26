'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AccessRole, AppRole } from './lib/access';

/** Mock user type for local-only authentication */
export interface AuthUser {
  id?: string;
  uid?: string;
  email?: string;
  role?: AppRole;
  accessRole?: AccessRole;
  roleId?: AccessRole;
  entityName?: string;
  entityType?: string;
  entityId?: string;
  displayName?: string;
  status?: string;
}

/** Auth state callback function type */
type AuthStateCallback = (user: AuthUser | null) => void;

/** Unsubscribe function type */
type Unsubscriber = () => void;

// Mock Firebase for local-only operation
export const db = {
  collection: () => ({}),
  doc: () => ({}),
};

export const auth = {
  get currentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  },
  onAuthStateChanged: (callback: AuthStateCallback): Unsubscriber => {
    if (typeof window === 'undefined') {
      callback(null);
      return () => {};
    }
    const user: AuthUser | null = JSON.parse(localStorage.getItem('currentUser') || 'null');
    callback(user);
    return () => {};
  },
  signOut: async (): Promise<void> => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      window.location.reload();
    }
  }
};

/**
 * Hook to get current user authentication state
 * @returns Object containing authenticated user and loading state
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser: AuthUser | null) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe?.();
  }, []);

  return { user, loading };
}
