// Admin authentication hooks are no longer used now that the admin panel has been removed.
// This file is kept as a stub to avoid breaking any stray imports.

export function useAuth() {
  return { user: null, session: null, loading: false, signIn: async () => ({}), signUp: async () => ({}), signOut: async () => ({}) };
}

export function useIsAdmin() {
  return { data: false, isLoading: false } as const;
}
