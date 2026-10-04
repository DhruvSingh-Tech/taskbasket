import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : (process.env.BETTER_AUTH_URL || 'http://localhost:3000'),
});

export const useSession = authClient.useSession;
export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;
