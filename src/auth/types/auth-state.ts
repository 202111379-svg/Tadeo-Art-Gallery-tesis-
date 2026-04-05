export interface AuthState {
  status: 'checking' | 'not-authenticated' | 'authenticated';
  uid?: string | null;
  email?: string | null;
  fullName?: string | null;
  photoURL?: string | null;
  errorMessage?: string | null;
}
