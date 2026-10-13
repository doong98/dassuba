'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, X, ChevronRight } from 'lucide-react';

export default function TopBanner() {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) return null;

  return (
    <aside aria-label="이벤트 공지" className="bg-zinc-950 text-white text-xs py-2 px-4 transition-all duration-300 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
          <span className="bg-amber-400 text-zinc-950 font-bold px-2 py-0.5 rounded-full text-[11px] flex items-center gap-1 shrink-0">
            <Sparkles className="w-3 h-3 fill-zinc-950" /> EVENT
          </span>
          <p className="truncate text-zinc-200">
            신규 회원가입 시 <strong className="text-amber-400 font-semibold">2,000P</strong> 즉시 증정! 1+1 기획전 전 품목 무료배송
          </p>
          <Link
            href="/category/bundle1plus1"
            className="hidden sm:inline-flex items-center text-amber-400 hover:text-amber-300 font-medium ml-2 underline underline-offset-2 shrink-0"
          >
            기획전 보기 <ChevronRight className="w-3 h-3 ml-0.5" />
          </Link>
        </div>

        <div className="flex items-center gap-4 text-zinc-400 shrink-0">
          <span className="hidden md:inline text-[11px]">오늘 16:00 이전 주문 시 당일 발송</span>
          <button
            onClick={() => setIsOpen(false)}
            className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors"
            aria-label="상단 배너 닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
