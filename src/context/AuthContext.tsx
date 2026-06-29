import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  token: string | null;
  role: string | null;
  isLoading: boolean;
  login: (token: string, role: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedRole = await AsyncStorage.getItem('userRole');
        
        if (storedToken) {
          setToken(storedToken);
          setRole(storedRole || 'STUDENT');
        }
      } catch (error) {
        console.error('Failed to load auth state', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAuth();
  }, []);

  const login = async (newToken: string, newRole: string) => {
    try {
      await AsyncStorage.setItem('userToken', newToken);
      await AsyncStorage.setItem('userRole', newRole);
      setToken(newToken);
      setRole(newRole);
    } catch (error) {
      console.error('Failed to save auth state', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userRole');
      setToken(null);
      setRole(null);
    } catch (error) {
      console.error('Failed to remove auth state', error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, role, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
