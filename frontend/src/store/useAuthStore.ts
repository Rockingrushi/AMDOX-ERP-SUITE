import { create } from 'zustand';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  setUser: (user: UserProfile | null) => void;
  setToken: (token: string | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('amx_erp_token') : null,
  loading: true,
  error: null,
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('amx_erp_token', token);
      } else {
        localStorage.removeItem('amx_erp_token');
      }
    }
    set({ token });
  },
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('amx_erp_token');
    }
    set({ user: null, token: null, error: null });
  },
}));
