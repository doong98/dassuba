'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ArrowRight, Sparkles, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface LoginRequiredProps {
  title?: string;
  description?: string;
  pageName?: string;
}

export default function LoginRequired({
  title = '로그인이 필요한 서비스입니다',
  description = '해당 서비스의 내용을 확인하시려면 먼저 로그인해 주세요.',
  pageName,
}: LoginRequiredProps) {
  const { openAuthModal } = useAuth();

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4 py-16 bg-zinc-50/50">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* 잠금 아이콘 배지 */}
        <div className="w-18 h-18 bg-amber-50 text-amber-600 rounded-3xl mx-auto flex items-center justify-center border border-amber-200 shadow-xs">
          <Lock className="w-9 h-9" />
        </div>

        {/* 안내 문구 */}
        <div className="space-y-2">
          {pageName && (
            <span className="inline-block px-3 py-1 bg-zinc-100 text-zinc-700 text-xs font-bold rounded-full mb-1">
              {pageName}
            </span>
          )}
          <h2 className="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight">
            {title}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed whitespace-pre-line">
            {description}
          </p>
        </div>

        {/* 액션 버튼 */}
        <div className="space-y-2.5 pt-2">
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3.5 px-4 bg-zinc-950 hover:bg-zinc-800 text-white rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-md active:scale-98"
          >
            <span>로그인하기</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => openAuthModal('signup')}
            className="w-full py-3 px-4 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>신규 회원가입 (+2,000P 혜택)</span>
          </button>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-700 transition"
          >
            <Home className="w-3.5 h-3.5" />
            <span>다써바 홈으로 이동</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
