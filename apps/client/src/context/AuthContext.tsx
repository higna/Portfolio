import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import api from '../lib/api';
import { createLogger } from '../lib/logger';
import toast from 'react-hot-toast';

const logger = createLogger('AuthContext');

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  fullName?: string | null;
  picture?: string | null;
  authProvider?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, captchaToken?: string) => Promise<void>;
  signup: (
    email: string,
    password: string,
    fullName?: string,
    captchaToken?: string,
    file?: File,
  ) => Promise<string>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    api.get('/users/me')
      .then((res) => {
        setUser(res.data);
        logger.log('Session restored');
      })
      .catch(() => {
        localStorage.removeItem('token');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string, captchaToken?: string) => {
    logger.log('Login initiated');
    const res = await api.post('/auth/login', { email, password, captchaToken });
    localStorage.setItem('token', res.data.access_token);
    const userRes = await api.get('/users/me');
    setUser(userRes.data);
    logger.log('Login successful');
  };

  const signup = async (
    email: string,
    password: string,
    fullName?: string,
    captchaToken?: string,
    file?: File,
  ): Promise<string> => {
    logger.log('Signup initiated');
    const formData = new FormData();
    formData.append('email', email);
    formData.append('password', password);
    if (fullName) formData.append('fullName', fullName);
    if (captchaToken) formData.append('captchaToken', captchaToken);
    if (file) formData.append('file', file);

    const res = await api.post('/auth/signup', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    logger.log('Signup successful, verification email sent');
    return res.data.message;
  };

  const logout = () => {
    logger.log('Logout');
    localStorage.removeItem('token');
    setUser(null);
    toast('You have been logged out.', { icon: '👋' });
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}