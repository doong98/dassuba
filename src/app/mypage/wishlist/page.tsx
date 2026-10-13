'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Sparkles,
  PackageOpen,
  ArrowLeft,
  Check,
} from 'lucide-react';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LoginRequired from '@/components/auth/LoginRequired';

export default function WishlistPage() {
  const { wishlistItems, removeWish, isLoading } = useWishlist();
  const { addToCart } = useCart();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleAddToCart = (item: any) => {
    const rawImage =
      item.product_image ||
      (Array.isArray(item.images) ? item.images[0] : '') ||
      '/images/products/bundle-1.png';

    addToCart({
      productId: item.product_id || item.id,
      title: item.product_title || item.title,
      price: Number(item.product_price || item.price) || 0,
      image: rawImage,
      color: '기본',
      size: 'FREE',
      quantity: 1,
      isBundle1Plus1: item.category === 'bundle1plus1',
    });
    showToast(`'${item.product_title || item.title}'이(가) 장바구니에 담겼습니다.`);
  };

  const handleRemove = async (productId: string, title: string, wishId?: string) => {
    await removeWish(productId, title, wishId);
    showToast(`'${title}' 찜이 해제되었습니다.`);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginRequired
        pageName="찜한 상품"
        title="찜한 상품 로그인 안내"
        description="관심 있는 모자 상품을 보관하고 언제든 다시 확인하시려면 먼저 로그인해 주세요."
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 pb-20">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 상단 브레드크럼 및 헤더 */}
      <div className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Link href="/" className="hover:text-zinc-700">홈</Link>
            <span>/</span>
            <Link href="/mypage" className="hover:text-zinc-700">마이페이지</Link>
            <span>/</span>
            <span className="text-zinc-900 font-bold">찜한 상품</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
                  <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-zinc-950">찜한 상품 목록</h1>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    마음에 들어 찜해둔 모자들을 한눈에 확인하고 바로 주문하세요.
                  </p>
                </div>
              </div>
            </div>

            {/* 마이메뉴 탭 링크 */}
            <div className="flex items-center gap-2">
              <Link
                href="/mypage"
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
              >
                마이페이지 홈
              </Link>
              <Link
                href="/cart"
                className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white transition flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                장바구니 가기
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 본문 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* 요약 바 */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-6">
          <div className="text-sm font-bold text-zinc-900">
            전체 <span className="text-red-600 font-black">{wishlistItems.length}</span>개
          </div>
          <div className="text-xs text-zinc-500">
            * 찜 목록은 Supabase DB 및 회원 계정에 안전하게 보관됩니다.
          </div>
        </div>

        {/* 로딩 상태 */}
        {isLoading && wishlistItems.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-8 h-8 border-4 border-zinc-200 border-t-red-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-zinc-500 font-medium">찜한 상품을 불러오는 중입니다...</p>
          </div>
        ) : wishlistItems.length === 0 ? (
          /* 빈 상태 (Empty State) */
          <div className="bg-white rounded-3xl border border-zinc-200 p-12 sm:p-16 text-center max-w-lg mx-auto my-8 shadow-xs">
            <div className="w-20 h-20 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto mb-5">
              <Heart className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900">찜한 상품이 아직 없습니다</h3>
            <p className="text-xs sm:text-sm text-zinc-500 mt-2 leading-relaxed">
              모자 상세 페이지나 랭킹 목록에서 하트(찜) 아이콘을 눌러<br />
              마음에 드는 상품을 나만의 위시리스트에 담아보세요!
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/category/best"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-zinc-900 hover:bg-amber-500 hover:text-zinc-950 text-white font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                베스트 모자 둘러보기 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/category/bundle1plus1"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs transition flex items-center justify-center gap-1.5"
              >
                1+1 특가 기획전 가기
              </Link>
            </div>
          </div>
        ) : (
          /* 상품 그리드 */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id || item.product_id}
                className="group bg-white rounded-2xl overflow-hidden border border-zinc-200 hover:border-zinc-900 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* 썸네일 */}
                <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                  <Link href={`/product/${item.product_id}`} className="block w-full h-full">
                    <img
                      src={item.product_image || 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600'}
                      alt={item.product_title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>

                  {/* 찜 삭제 버튼 (우측 상단) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemove(item.product_id, item.product_title, item.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-red-500 hover:text-red-700 flex items-center justify-center shadow-md backdrop-blur-xs transition z-10 cursor-pointer active:scale-90"
                    title="찜 목록에서 삭제"
                    aria-label="찜 목록에서 삭제"
                  >
                    <Heart className="w-4 h-4 fill-red-500" />
                  </button>

                  {/* 카테고리 칩 */}
                  {item.category && (
                    <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {item.category}
                    </div>
                  )}
                </div>

                {/* 상품 정보 */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <Link href={`/product/${item.product_id}`} className="block">
                      <h3 className="font-bold text-sm text-zinc-900 line-clamp-2 group-hover:text-amber-600 transition leading-snug">
                        {item.product_title}
                      </h3>
                    </Link>

                    <div className="mt-2.5">
                      <span className="text-base sm:text-lg font-black text-zinc-950">
                        {Number(item.product_price).toLocaleString()}
                        <span className="text-xs font-normal text-zinc-700 ml-0.5">원</span>
                      </span>
                    </div>
                  </div>

                  {/* 액션 버튼 (장바구니 담기 & 삭제) */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddToCart(item)}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-amber-500 hover:text-zinc-950 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      장바구니 담기
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.product_id, item.product_title, item.id)}
                      className="p-2.5 rounded-xl border border-zinc-200 hover:border-red-300 hover:bg-red-50 text-zinc-400 hover:text-red-600 transition cursor-pointer active:scale-90"
                      title="삭제"
                      aria-label="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
