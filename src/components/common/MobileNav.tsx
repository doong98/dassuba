'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, ChevronDown, ChevronRight, User, ShoppingBag, ShieldCheck, PhoneCall, Sparkles, Heart } from 'lucide-react';
import { CATEGORIES } from '@/lib/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const { user } = useAuth();
  const { wishlistCount } = useWishlist();
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    ballcap: true,
  });

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      {/* 백드롭 오버레이 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* 슬라이드 드로어 */}
      <div className="relative w-4/5 max-w-sm bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* 상단 사용자 세션 영역 */}
        <div className="p-5 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="font-black text-xl tracking-tight text-white">DASSEOBA</span>
            </div>
            <p className="text-xs text-zinc-400">로그인하고 회원 전용 혜택을 받아보세요.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg transition-colors"
            aria-label="메뉴 닫기"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 퀵 로그인 & 회원가입 버튼 */}
        <div className="p-4 bg-zinc-50 border-b border-zinc-200 grid grid-cols-2 gap-2">
          <Link
            href="/login"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded bg-zinc-900 text-white text-center hover:bg-zinc-800 transition"
          >
            <User className="w-3.5 h-3.5" /> 로그인
          </Link>
          <Link
            href="/signup"
            onClick={onClose}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 text-xs font-semibold rounded bg-white border border-zinc-300 text-zinc-800 text-center hover:bg-zinc-100 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> 회원가입 (+2,000P)
          </Link>
        </div>

        {/* 카테고리 내비게이션 리스트 */}
        <div className="flex-1 overflow-y-auto px-4 py-3 divide-y divide-zinc-100">
          <div className="py-2">
            <Link
              href="/category/bundle1plus1"
              onClick={onClose}
              className="flex items-center justify-between py-2.5 text-red-600 font-bold hover:bg-red-50/50 px-2 rounded-md transition"
            >
              <span className="flex items-center gap-2">
                <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">1+1</span>
                1+1 기획전 특가
              </span>
              <ChevronRight className="w-4 h-4 text-red-400" />
            </Link>
            <Link
              href="/category/best"
              onClick={onClose}
              className="flex items-center justify-between py-2.5 text-zinc-900 font-bold hover:bg-zinc-50 px-2 rounded-md transition"
            >
              <span className="flex items-center gap-2">
                <span className="bg-zinc-900 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">BEST</span>
                베스트 50 랭킹
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </Link>
            <Link
              href="/custom/inquiry"
              onClick={onClose}
              className="flex items-center justify-between py-2.5 text-emerald-700 font-bold hover:bg-emerald-50/50 px-2 rounded-md transition"
            >
              <span className="flex items-center gap-2">
                <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">FREE</span>
                단체 자수 무료시안 신청
              </span>
              <ChevronRight className="w-4 h-4 text-emerald-400" />
            </Link>
            <Link
              href="/community/reviews"
              onClick={onClose}
              className="flex items-center justify-between py-2.5 text-zinc-900 font-bold hover:bg-zinc-50 px-2 rounded-md transition"
            >
              <span className="flex items-center gap-2">
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5 rounded font-bold">REVIEW</span>
                구매포토리뷰
              </span>
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            </Link>
          </div>

          <div className="pt-3">
            <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-1">
              모자 카테고리
            </h4>
            {CATEGORIES.filter((c) => !['bundle1plus1', 'best', 'custom', 'new'].includes(c.id)).map((cat) => {
              const isExpanded = !!expandedCategories[cat.id];
              return (
                <div key={cat.id} className="py-1">
                  <div className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-zinc-50">
                    <Link
                      href={`/category/${cat.slug}`}
                      onClick={onClose}
                      className="font-semibold text-zinc-800 text-sm flex-1"
                    >
                      {cat.name}
                    </Link>
                    {cat.subcategories && cat.subcategories.length > 0 && (
                      <button
                        onClick={() => toggleCategory(cat.id)}
                        className="p-1 text-zinc-400 hover:text-zinc-600"
                        aria-label={`${cat.name} 하위 메뉴 토글`}
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    )}
                  </div>

                  {/* 서브 카테고리 */}
                  {isExpanded && cat.subcategories && (
                    <div className="pl-4 pr-2 py-1 space-y-1 bg-zinc-50/80 rounded-md mb-1">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/category/${cat.slug}?sub=${sub.slug}`}
                          onClick={onClose}
                          className="block py-1.5 px-2 text-xs text-zinc-600 hover:text-zinc-950 hover:font-medium transition"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 마이메뉴 및 고객센터 */}
          <div className="pt-3 pb-2 space-y-1">
            <h4 className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-2 mb-1">
              고객 서비스
            </h4>
            <Link
              href="/mypage"
              onClick={onClose}
              className="flex items-center gap-2 py-2 px-2 text-xs text-zinc-700 hover:bg-zinc-50 rounded"
            >
              <User className="w-4 h-4 text-zinc-400" /> 마이페이지 / 주문배송조회
            </Link>
            <Link
              href="/mypage/wishlist"
              onClick={onClose}
              className="flex items-center justify-between py-2 px-2 text-xs text-zinc-700 hover:bg-zinc-50 rounded"
            >
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" /> 찜한 상품
              </div>
              {wishlistCount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              href="/cart"
              onClick={onClose}
              className="flex items-center gap-2 py-2 px-2 text-xs text-zinc-700 hover:bg-zinc-50 rounded"
            >
              <ShoppingBag className="w-4 h-4 text-zinc-400" /> 장바구니
            </Link>
            <Link
              href="/community/qna"
              onClick={onClose}
              className="flex items-center gap-2 py-2 px-2 text-xs text-zinc-800 font-semibold hover:bg-zinc-50 rounded"
            >
              <span className="w-4 text-center">💬</span> Q&A 게시판
            </Link>
            <Link
              href="/community/cs"
              onClick={onClose}
              className="flex items-center gap-2 py-2 px-2 text-xs text-amber-900 bg-amber-50/70 font-semibold hover:bg-amber-100/70 rounded"
            >
              <PhoneCall className="w-4 h-4 text-amber-600" /> 고객센터 1:1 상담 / FAQ
            </Link>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                onClick={onClose}
                className="flex items-center gap-2 py-2 px-2 text-xs text-indigo-700 font-bold hover:bg-zinc-50 rounded"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" /> 관리자 페이지 (/admin)
              </Link>
            )}
          </div>
        </div>

        {/* 드로어 하단 고객센터 안내 */}
        <Link
          href="/community/cs"
          onClick={onClose}
          className="p-4 bg-zinc-100 hover:bg-zinc-200/80 transition border-t border-zinc-200 text-xs text-zinc-600 block"
        >
          <div className="flex items-center gap-2 font-bold text-zinc-900 mb-1">
            <PhoneCall className="w-3.5 h-3.5 text-amber-600" /> 고객센터 02-1588-9999
          </div>
          <p className="text-[11px] text-zinc-500">평일 09:30 ~ 17:30 (1:1 상담 접수 바로가기 →)</p>
        </Link>
      </div>
    </div>
  );
}
