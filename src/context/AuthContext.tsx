import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/apiService';

interface UserProfile {
  uid: string;
  email: string;
  name: string;
  username?: string;
  employee_id?: string;
  role: 'admin' | 'manager' | 'intern';
  photoURL?: string;
  manually_added?: boolean;
  department?: string;
  start_date?: string;
  end_date?: string;
  required_hours?: number;
  schedule_start?: string;
  schedule_end?: string;
  active_task?: any;
  is_default_password?: boolean;
  program?: string;
  school?: string;
  year_level?: string;
  emergency_contact_name?: string;
  emergency_contact_relation?: string;
  emergency_contact_phone?: string;
  emergency_contact_email?: string;
  emergency_contact_location?: string;
  skills?: string | string[];
  documents?: any;
}

interface AuthContextType {
  user: any | null; // Mocked to profile for compatibility
  profile: UserProfile | null;
  loading: boolean;
  loginUser: (email: string, password?: string) => Promise<void>;
  logoutUser: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null, 
  loading: true,
  loginUser: async () => {},
  logoutUser: () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const p = await api.getUser(uid);
      setProfile(p);
      localStorage.setItem('local_uid', p.uid);
    } catch (err) {
      console.error('Failed to sync profile with SQL:', err);
      setProfile(null);
      localStorage.removeItem('local_uid');
    } finally {
      setLoading(false);
    }
  };

  const loginUser = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const response = await api.login(email, password);
      setProfile(response.user);
      localStorage.setItem('local_uid', response.user.uid);
    } catch (err) {
      console.error('Login error', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    setProfile(null);
    localStorage.removeItem('local_uid');
  };

  const refreshProfile = async () => {
    if (profile) {
      await fetchProfile(profile.uid);
    }
  };

  useEffect(() => {
    const uid = localStorage.getItem('local_uid');
    if (uid) {
      fetchProfile(uid);
    } else {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user: profile, profile, loading, loginUser, logoutUser, refreshProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
