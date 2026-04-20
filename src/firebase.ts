'use client';

import { useState, useEffect } from 'react';

// Mock Firebase for local-only operation
export const db = {
  collection: () => ({}),
  doc: () => ({}),
} as any;

export const auth = {
  get currentUser() {
    if (typeof window === 'undefined') return null;
    return JSON.parse(localStorage.getItem('currentUser') || 'null');
  },
  onAuthStateChanged: (callback: any) => {
    if (typeof window === 'undefined') {
      callback(null);
      return () => {};
    }
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    callback(user);
    return () => {};
  },
  signOut: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentUser');
      window.location.reload();
    }
  }
} as any;

/**
 * Hook to get current user authentication state
 */
export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser: any) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe?.();
  }, []);

  return { user, loading };
}
