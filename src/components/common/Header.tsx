'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Search,
  ShoppingBag,
  User,
  Heart,
  Menu,
  ChevronDown,
  Layers,
  Sparkles,
  Phone,
  Settings,
} from 'lucide-react';
import TopBanner from './TopBanner';
import MobileNav from './MobileNav';
import { CATEGORIES } from '@/lib/data/mockData';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

export default function Header() {
  const { user, logout, openAuthModal } = useAuth();
  const { totalItemsCount } = useCart();
  const { wishlistCount } = useWishlist();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAllCategoryOpen, setIsAllCategoryOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const categoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 외부 클릭 시 전체 카테고리 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target as Node)) {
        setIsAllCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="w-full bg-white text-zinc-900 border-b border-zinc-200 sticky top-0 z-40 transition-shadow duration-200">
      {/* 1. 상단 공지 배너 */}
      <TopBanner />

      {/* 2. 최상단 유틸리티 바 (데스크톱) */}
      <div className="hidden lg:block border-b border-zinc-100 bg-zinc-50/70 text-xs text-zinc-500 py-1.5 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-medium text-zinc-700">다써바 모자 전문 온라인 커머스</span>
            <span className="text-zinc-300">|</span>
            <span className="flex items-center gap-1 text-zinc-600">
              <Phone className="w-3 h-3 text-amber-600" /> 고객센터 02-1588-9999
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-zinc-500">단체 자수·인쇄 주문 대환영</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="font-semibold text-zinc-900 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  {user.name}님
                </span>
                <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded-full font-bold">
                  {user.points.toLocaleString()}P
                </span>
                <span className="text-zinc-300">|</span>
                <button
                  onClick={logout}
                  className="hover:text-red-600 transition font-medium"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => openAuthModal('login')}
                  className="hover:text-zinc-900 font-medium transition"
                >
                  로그인
                </button>
                <span className="text-zinc-300">|</span>
                <button
                  onClick={() => openAuthModal('signup')}
                  className="hover:text-zinc-900 font-medium transition flex items-center gap-0.5"
                >
                  <span className="text-amber-600 font-semibold">회원가입</span>
                  <span className="bg-amber-100 text-amber-800 text-[10px] px-1 rounded font-bold">+2,000P</span>
                </button>
              </>
            )}
            <span className="text-zinc-300">|</span>
            <Link href="/mypage/orders" className="hover:text-zinc-900 transition">
              주문배송조회
            </Link>
            <span className="text-zinc-300">|</span>
            <Link href="/community/qna" className="hover:text-zinc-900 transition">
              Q&A게시판
            </Link>
            <span className="text-zinc-300">|</span>
            <Link href="/community/cs" className="hover:text-zinc-900 transition font-medium">
              고객센터
            </Link>
            {user?.role === 'admin' && (
              <>
                <span className="text-zinc-300">|</span>
                <Link
                  href="/admin"
                  data-testid="header-admin-link"
                  className="hover:text-indigo-600 font-semibold flex items-center gap-1 transition text-indigo-700"
                >
                  <Settings className="w-3 h-3" /> 관리자 페이지
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. 메인 헤더 영역 (로고 / 검색창 / 퀵 아이콘) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-4">
        {/* 모바일 햄버거 메뉴 버튼 */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-zinc-800 hover:text-black hover:bg-zinc-100 rounded-lg transition"
            aria-label="메뉴 열기"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* 로고: 단순하고 세련된 미니멀 브랜드 워드마크 */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 text-zinc-950 group-hover:text-amber-500 transition-colors"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 15a8 8 0 0 1 16 0" />
              <path d="M2 15h14c3.5 0 6 1.2 6 3H2z" />
            </svg>
            <span className="font-black text-2xl sm:text-3xl tracking-tight text-zinc-950 group-hover:text-amber-500 transition-colors">
              DASSEOBA
            </span>
          </Link>
        </div>

        {/* 데스크톱 중앙 검색바 */}
        <div className="hidden md:flex flex-1 max-w-lg mx-6">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="깊은 볼캡, 피그먼트 워싱, 버킷햇, 비니 검색..."
              className="w-full bg-zinc-100/90 text-sm pl-4 pr-11 py-2.5 rounded-full border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:bg-white transition-all shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-zinc-900 text-white hover:bg-amber-500 hover:text-zinc-950 flex items-center justify-center transition-colors"
              aria-label="상품 검색"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* 우측 퀵 유틸리티 (위시리스트, 마이페이지, 장바구니) */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/mypage/wishlist"
            className="p-2 text-zinc-700 hover:text-red-500 rounded-full hover:bg-zinc-100 transition relative flex flex-col items-center group"
            title="찜 목록"
          >
            <div className="relative">
              <Heart
                className={`w-5 h-5 group-hover:scale-110 transition-transform ${
                  user && wishlistCount > 0 ? 'text-red-500 fill-red-50' : ''
                }`}
              />
              {user && wishlistCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[11px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-in zoom-in-75">
                  {wishlistCount}
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 hidden md:block">찜한상품</span>
          </Link>

          <Link
            href="/mypage"
            className="p-2 text-zinc-700 hover:text-zinc-950 rounded-full hover:bg-zinc-100 transition flex flex-col items-center group"
            title="마이페이지"
          >
            <User className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] text-zinc-500 mt-0.5 hidden md:block">마이페이지</span>
          </Link>

          <Link
            href="/cart"
            className="p-2 text-zinc-900 hover:text-amber-600 rounded-full hover:bg-zinc-100 transition relative flex flex-col items-center group"
            title="장바구니"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {user && totalItemsCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[11px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItemsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 hidden md:block font-medium">장바구니</span>
          </Link>
        </div>
      </div>

      {/* 모바일 검색바 (모바일 전용 표시) */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="찾으시는 모자 스타일 검색..."
            className="w-full bg-zinc-100 text-xs pl-3.5 pr-10 py-2 rounded-full border border-zinc-200 focus:outline-none focus:border-zinc-900 focus:bg-white"
          />
          <button
            type="submit"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-zinc-900 text-white flex items-center justify-center"
            aria-label="상품 검색"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 4. GNB 내비게이션 바 (Desktop iamcap.com 스타일) */}
      <nav className="border-t border-zinc-200 bg-white relative hidden lg:block select-none z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-0.5 shrink-0">
            {/* 전체 카테고리 드롭다운 토글 버튼 */}
            <div
              ref={categoryRef}
              className="relative shrink-0"
              onMouseEnter={() => setIsAllCategoryOpen(true)}
              onMouseLeave={() => setIsAllCategoryOpen(false)}
            >
              <button
                type="button"
                onClick={() => setIsAllCategoryOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-4 py-3.5 font-bold text-xs xl:text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isAllCategoryOpen
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
                aria-expanded={isAllCategoryOpen}
                aria-haspopup="true"
              >
                <Layers className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="whitespace-nowrap">전체 카테고리</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 shrink-0 ${
                    isAllCategoryOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* 전체 카테고리 메가 드롭다운 메뉴 */}
              {isAllCategoryOpen && (
                <div className="absolute top-full left-0 w-80 bg-white shadow-2xl border border-zinc-200 rounded-b-xl py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-zinc-100 mb-2">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      모자 종류별 바로가기
                    </p>
                  </div>
                  {CATEGORIES.filter((c) => c.subcategories && c.subcategories.length > 0).map((cat) => (
                    <div key={cat.id} className="group/sub relative px-4 py-2 hover:bg-zinc-50">
                      <div className="flex items-center justify-between">
                        <Link
                          href={`/category/${cat.slug}`}
                          className="font-bold text-sm text-zinc-800 hover:text-amber-600 flex items-center gap-2 whitespace-nowrap"
                        >
                          {cat.name}
                          {cat.isHot && (
                            <span className="bg-red-500 text-white text-[10px] px-1 rounded font-bold">
                              HOT
                            </span>
                          )}
                          {cat.isNew && (
                            <span className="bg-blue-600 text-white text-[10px] px-1 rounded font-bold">
                              NEW
                            </span>
                          )}
                        </Link>
                        <span className="text-xs text-zinc-400 group-hover/sub:text-zinc-600">›</span>
                      </div>

                      {/* 서브 카테고리 가로 펼침 */}
                      <div className="hidden group-hover/sub:flex flex-col absolute top-0 left-full w-64 bg-white shadow-xl border border-zinc-200 rounded-r-xl p-3 space-y-1.5 z-50">
                        <div className="font-semibold text-xs text-zinc-400 pb-1 border-b border-zinc-100">
                          {cat.name} 세부 옵션
                        </div>
                        {cat.subcategories?.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/category/${cat.slug}?sub=${sub.slug}`}
                            className="text-xs text-zinc-600 hover:text-amber-600 hover:bg-amber-50/50 p-1.5 rounded transition font-medium whitespace-nowrap"
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="p-3 mt-2 bg-amber-50/60 border-t border-amber-100 text-xs">
                    <Link
                      href="/custom"
                      className="font-bold text-amber-900 flex items-center justify-between hover:underline whitespace-nowrap"
                    >
                      <span>✨ 단체 자수/커스텀 견적 요청</span>
                      <span>바로가기 →</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* 메인 GNB 링크 목록 (줄바꿈 없이 한 줄로 유지) */}
            <div className="flex items-center ml-1 xl:ml-2 shrink-0 flex-nowrap">
              <Link
                href="/category/best"
                className="px-2.5 xl:px-3.5 py-3.5 text-xs xl:text-sm font-bold text-zinc-900 hover:text-amber-600 transition flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span>베스트 50</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
              </Link>

              <Link
                href="/category/bundle1plus1"
                className="px-2.5 xl:px-3.5 py-3.5 text-xs xl:text-sm font-bold text-red-600 hover:text-red-700 transition flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <span className="bg-red-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0">
                  1+1
                </span>
                <span>기획전</span>
              </Link>

              <Link
                href="/category/ballcap"
                className="px-2 xl:px-3 py-3.5 text-xs xl:text-sm font-semibold text-zinc-700 hover:text-zinc-950 transition shrink-0 whitespace-nowrap"
              >
                볼캡
              </Link>

              <Link
                href="/category/buckethat"
                className="px-2 xl:px-3 py-3.5 text-xs xl:text-sm font-semibold text-zinc-700 hover:text-zinc-950 transition shrink-0 whitespace-nowrap"
              >
                버킷햇
              </Link>

              <Link
                href="/category/beanie"
                className="px-2 xl:px-3 py-3.5 text-xs xl:text-sm font-semibold text-zinc-700 hover:text-zinc-950 transition shrink-0 whitespace-nowrap"
              >
                비니
              </Link>

              <Link
                href="/category/sunvisor"
                className="px-2 xl:px-3 py-3.5 text-xs xl:text-sm font-semibold text-zinc-700 hover:text-zinc-950 transition shrink-0 whitespace-nowrap"
              >
                선바이저
              </Link>

              <Link
                href="/custom"
                className="px-2 xl:px-3 py-3.5 text-xs xl:text-sm font-bold text-blue-700 hover:text-blue-800 transition flex items-center gap-1 shrink-0 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>단체주문제작</span>
              </Link>

              <Link
                href="/community/reviews"
                className="px-2 xl:px-3 py-3.5 text-xs xl:text-sm font-semibold text-zinc-700 hover:text-zinc-950 transition shrink-0 whitespace-nowrap"
              >
                구매포토리뷰
              </Link>

              <Link
                href="/community/qna"
                className="px-2 xl:px-3 py-3.5 text-xs xl:text-sm font-semibold text-zinc-700 hover:text-zinc-950 transition shrink-0 whitespace-nowrap"
              >
                Q&A게시판
              </Link>

              <Link
                href="/community/cs"
                className="px-2 xl:px-3 py-3.5 text-xs xl:text-sm font-semibold text-zinc-700 hover:text-zinc-950 transition shrink-0 whitespace-nowrap"
              >
                고객센터
              </Link>
            </div>
          </div>

          {/* 우측 단체문의 핫라인 배너 태그 */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/custom/inquiry"
              className="text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold px-3 py-1.5 rounded-full transition border border-zinc-200 flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              <span className="whitespace-nowrap">단체 자수 무료시안 신청</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* 모바일 햄버거 슬라이드 드로어 */}
      <MobileNav
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
    </header>
  );
}
