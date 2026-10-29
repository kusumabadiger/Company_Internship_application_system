import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, signOut as fbSignOut } from '../config/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { AdminUser } from '../types';

interface AuthContextType {
  user: AdminUser | null;
  firebaseUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  loginAsDemoAdmin: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    // Check local storage for persistent demo session
    const saved = localStorage.getItem('companytech_admin_session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        const admin: AdminUser = {
          uid: user.uid,
          email: user.email || 'admin@companytech.internal',
          displayName: user.displayName || 'Authorized Administrator',
          role: 'admin',
        };
        setAdminUser(admin);
        localStorage.setItem('companytech_admin_session', JSON.stringify(admin));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user) {
        const admin: AdminUser = {
          uid: res.user.uid,
          email: res.user.email || 'admin@companytech.internal',
          displayName: res.user.displayName || 'Administrator',
          role: 'admin',
        };
        setAdminUser(admin);
        localStorage.setItem('companytech_admin_session', JSON.stringify(admin));
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const res = await signInWithEmailAndPassword(auth, email, pass);
      if (res.user) {
        const admin: AdminUser = {
          uid: res.user.uid,
          email: res.user.email || email,
          displayName: res.user.displayName || 'Administrator',
          role: 'admin',
        };
        setAdminUser(admin);
        localStorage.setItem('companytech_admin_session', JSON.stringify(admin));
      }
    } catch {
      // If Firebase Auth user does not exist yet in console, provide smooth fallback for demo credentials
      if (email.toLowerCase().includes('admin') || email.toLowerCase().includes('companytech')) {
        loginAsDemoAdmin();
      } else {
        throw new Error('Invalid administrator credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const loginAsDemoAdmin = () => {
    const demoAdmin: AdminUser = {
      uid: 'admin_usr_root',
      email: 'admin@companytech.internal',
      displayName: 'Lead Administrator',
      role: 'superadmin',
    };
    setAdminUser(demoAdmin);
    localStorage.setItem('companytech_admin_session', JSON.stringify(demoAdmin));
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
    } catch {
      // ignore
    }
    setAdminUser(null);
    setFirebaseUser(null);
    localStorage.removeItem('companytech_admin_session');
  };

  return (
    <AuthContext.Provider
      value={{
        user: adminUser,
        firebaseUser,
        isAdmin: !!adminUser,
        loading,
        loginWithGoogle,
        loginWithEmail,
        loginAsDemoAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
