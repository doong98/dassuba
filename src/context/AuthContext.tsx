'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  points: number;
}

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (
    email: string,
    password?: string,
    asAdmin?: boolean,
    isDemo?: boolean
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, name: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  deductPoints: (amount: number) => boolean;
  addPoints: (amount: number) => void;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: UserProfile = {
  id: 'usr-demo-01',
  email: 'customer@dasseoba.com',
  name: '홍길동',
  phone: '010-1234-5678',
  role: 'user',
  points: 2000, // 신규 가입 축하금
};

const DEMO_ADMIN: UserProfile = {
  id: 'usr-admin-01',
  email: 'admin@dasseoba.com',
  name: '김관리자',
  phone: '010-9999-8888',
  role: 'admin',
  points: 50000,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const supabase = createClient();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // 이전에 localStorage에 영구 보존되어 있던 잔여 로그인 정보 정리
      localStorage.removeItem('dasseoba_user');

      // 브라우저 창/탭을 닫으면 자동으로 삭제되는 sessionStorage에서 세션 복원
      const savedUser = sessionStorage.getItem('dasseoba_user');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          setUser(null);
          sessionStorage.removeItem('dasseoba_user');
        }
      } else {
        // 브라우저를 닫고 다시 열었거나 저장된 세션이 없으면 로그아웃 상태 유지
        setUser(null);
      }
      setIsLoading(false);
    }
  }, []);

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const login = async (
    email: string,
    password?: string,
    asAdmin: boolean = false,
    isDemo: boolean = false
  ) => {
    setIsLoading(true);
    try {
      // 데모 모드일 때는 즉시 처리
      if (isDemo || asAdmin) {
        const demoProfile = asAdmin ? DEMO_ADMIN : DEMO_USER;
        setUser(demoProfile);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('dasseoba_user', JSON.stringify(demoProfile));
          localStorage.removeItem('dasseoba_user');
        }
        setIsLoading(false);
        closeAuthModal();
        return { success: true };
      }

      // 서버 라우트를 통한 로그인 및 Supabase members 조회
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, asAdmin, isDemo }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        return {
          success: false,
          error: data.error || '로그인에 실패했습니다.',
        };
      }

      const loggedUser: UserProfile = data.member;
      setUser(loggedUser);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dasseoba_user', JSON.stringify(loggedUser));
        localStorage.removeItem('dasseoba_user');
      }
      setIsLoading(false);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || '로그인 서버 통신 오류가 발생했습니다.' };
    }
  };

  const signup = async (email: string, name: string, password?: string) => {
    setIsLoading(true);
    try {
      // 서버 라우트를 통한 Supabase public.members INSERT 호출
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setIsLoading(false);
        return {
          success: false,
          error: data.error || '회원가입에 실패했습니다.',
        };
      }

      const createdUser: UserProfile = data.member;
      setUser(createdUser);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('dasseoba_user', JSON.stringify(createdUser));
        localStorage.removeItem('dasseoba_user');
      }
      setIsLoading(false);
      closeAuthModal();
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || '회원가입 서버 통신 오류가 발생했습니다.' };
    }
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('dasseoba_user');
      localStorage.removeItem('dasseoba_user');
    }
    supabase.auth.signOut().catch(() => {});
  };

  const deductPoints = (amount: number) => {
    if (!user || user.points < amount) return false;
    const newPoints = user.points - amount;
    const updated = { ...user, points: newPoints };
    setUser(updated);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dasseoba_user', JSON.stringify(updated));
    }

    // Supabase DB 업데이트 시도 (비동기)
    (async () => {
      try {
        await (supabase.from('members') as any)
          .update({ points: newPoints })
          .eq('id', user.id);
      } catch {}
    })();

    return true;
  };

  const addPoints = (amount: number) => {
    if (!user) return;
    const newPoints = user.points + amount;
    const updated = { ...user, points: newPoints };
    setUser(updated);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('dasseoba_user', JSON.stringify(updated));
    }

    // Supabase DB 업데이트 시도 (비동기)
    (async () => {
      try {
        await (supabase.from('members') as any)
          .update({ points: newPoints })
          .eq('id', user.id);
      } catch {}
    })();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        deductPoints,
        addPoints,
        openAuthModal,
        closeAuthModal,
        isAuthModalOpen,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
