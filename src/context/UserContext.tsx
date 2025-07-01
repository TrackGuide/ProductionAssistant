import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  username: string;
  email: string;
}

interface UserContextType {
  user: User | null;
  isGuest: boolean;
  login: (user: User) => void;
  register: (user: User) => void;
  logout: () => void;
  continueAsGuest: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
    const guest = localStorage.getItem('isGuest');
    if (guest === 'true') setIsGuest(true);
  }, []);

  const login = (user: User) => {
    setUser(user);
    setIsGuest(false);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.removeItem('isGuest');
  };

  const register = (user: User) => {
    login(user);
  };

  const logout = () => {
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem('user');
    localStorage.removeItem('isGuest');
  };

  const continueAsGuest = () => {
    setUser(null);
    setIsGuest(true);
    localStorage.setItem('isGuest', 'true');
    localStorage.removeItem('user');
  };

  return (
    <UserContext.Provider value={{ user, isGuest, login, register, logout, continueAsGuest }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
};
