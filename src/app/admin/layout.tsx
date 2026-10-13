'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Layers,
  Truck,
  FileText,
  Home,
  ShieldCheck,
  Scissors,
  LogOut,
  Lock,
  ArrowLeft,
  Loader2,
  Users,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading, openAuthModal } = useAuth();

  const navItems = [
    { name: '통합 대시보드', href: '/admin', icon: LayoutDashboard },
    { name: '상품 등록/관리', href: '/admin/products', icon: Package },
    { name: '원부자재/발주 관리', href: '/admin/materials', icon: Layers },
    { name: '주문/배송 관리', href: '/admin/orders', icon: Truck },
    { name: '세금명세서 출력', href: '/admin/tax-invoice', icon: FileText },
    { name: '회원/권한 관리', href: '/admin/members', icon: Users },
  ];

  // 1. 세션 확인 중 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-zinc-600 animate-spin" />
          <p className="text-xs font-bold text-zinc-500">관리자 인증 상태를 확인하는 중입니다...</p>
        </div>
      </div>
    );
  }

  // 2. 관리자가 아닌 경우 접근 차단 안내
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 border border-zinc-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-zinc-950">관리자 권한이 필요합니다</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              이 페이지는 관리자 계정으로 로그인한 사용자만 접근할 수 있습니다.
              {user ? ` 현재 계정(${user.name})은 일반 회원 권한입니다.` : ' 먼저 관리자로 로그인해 주세요.'}
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => openAuthModal('login')}
              data-testid="admin-guard-login-btn"
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" /> 관리자 계정으로 로그인하기
            </button>
            <Link
              href="/"
              className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> 쇼핑몰 메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex flex-col md:flex-row text-zinc-900">
      {/* 관리자 사이드바 */}
      <aside className="w-full md:w-64 bg-zinc-950 text-white shrink-0 p-5 flex flex-col justify-between border-r border-zinc-800">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-400 text-zinc-950 flex items-center justify-center font-black">
                다
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight">다써바 관리자 페이지</span>
                <span className="text-[10px] block text-zinc-400 font-mono">ADMIN CONSOLE</span>
              </div>
            </Link>
          </div>

          {/* 관리자 프로필 정보 */}
          <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-zinc-200">
                {user?.role === 'admin' ? `${user.name} (마스터)` : '관리자 데모'}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5">전체 권한 활성화됨</p>
          </div>

          {/* 사이드바 메뉴 링크 */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                    isActive
                      ? 'bg-amber-400 text-zinc-950 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* 사이드바 하단 쇼핑몰 바로가기 */}
        <div className="pt-6 border-t border-zinc-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400 hover:text-white transition"
          >
            <Home className="w-4 h-4" /> 쇼핑몰 메인으로 이동
          </Link>
        </div>
      </aside>

      {/* 관리자 메인 콘텐츠 뷰 */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-screen">
        {children}
      </main>
    </div>
  );
}
