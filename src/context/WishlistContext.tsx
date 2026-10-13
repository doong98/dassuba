'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Heart, X, Check } from 'lucide-react';
import { useAuth } from './AuthContext';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  product_image?: string;
  category?: string;
  created_at?: string;
}

export interface WishProductInput {
  id: string;
  title: string;
  price: number;
  image?: string;
  images?: string[];
  category?: string;
}

interface ToastState {
  visible: boolean;
  type: 'added' | 'removed';
  title: string;
}

interface WishlistContextType {
  wishlistItems: WishlistItem[];
  wishlistCount: number;
  isLoading: boolean;
  isWished: (productId: string) => boolean;
  toggleWish: (product: WishProductInput) => Promise<boolean>;
  removeWish: (productId: string, title?: string, wishId?: string) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'dasseoba_wishlist';

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'usr-demo-01';

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    type: 'added',
    title: '',
  });

  // 토스트 타이머
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast.visible]);

  // 로컬 스토리지에서 초기 데이터 로드 (SSR 하이드레이션 이후)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`);
        if (cached) {
          setWishlistItems(JSON.parse(cached));
        }
      } catch (err) {
        console.error('Failed to read wishlist cache:', err);
      }
    }
  }, [userId]);

  // 서버 API로부터 찜 목록 동기화
  const fetchWishlist = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/wishlist?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setWishlistItems(json.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(json.data));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  // 특정 상품 찜 여부 확인
  const isWished = useCallback(
    (productId: string) => {
      return wishlistItems.some((item) => String(item.product_id) === String(productId));
    },
    [wishlistItems]
  );

  // 찜 삭제
  const removeWish = useCallback(
    async (productId: string, title?: string, wishId?: string) => {
      // Optimistic UI update
      const targetItem = wishlistItems.find(
        (item) => String(item.product_id) === String(productId) || (wishId && item.id === wishId)
      );
      const productTitle = title || targetItem?.product_title || '상품';
      const resolvedWishId = wishId || targetItem?.id;
      const resolvedUserId = targetItem?.user_id || userId;

      const previous = [...wishlistItems];
      const updated = wishlistItems.filter(
        (item) => !(String(item.product_id) === String(productId) || (resolvedWishId && item.id === resolvedWishId))
      );
      
      setWishlistItems(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(updated));
      }

      // 토스트 피드백 노출
      setToast({
        visible: true,
        type: 'removed',
        title: productTitle,
      });

      try {
        const res = await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: resolvedWishId,
            user_id: resolvedUserId,
            product_id: productId,
          }),
        });

        if (!res.ok) {
          // 롤백
          setWishlistItems(previous);
          return false;
        }
        return true;
      } catch (err) {
        console.error('Failed to delete wish item:', err);
        setWishlistItems(previous);
        return false;
      }
    },
    [wishlistItems, userId]
  );

  // 찜 추가 및 토글
  const toggleWish = useCallback(
    async (product: WishProductInput) => {
      const alreadyWished = wishlistItems.some((item) => String(item.product_id) === String(product.id));

      if (alreadyWished) {
        await removeWish(product.id, product.title);
        return false; // 찜 해제됨
      } else {
        // Optimistic UI update
        const imageUrl = product.image || (product.images && product.images[0]) || '';
        const tempItem: WishlistItem = {
          id: `wish-${Date.now()}`,
          user_id: userId,
          product_id: String(product.id),
          product_title: product.title,
          product_price: Number(product.price) || 0,
          product_image: imageUrl,
          category: product.category || 'general',
          created_at: new Date().toISOString(),
        };

        const updated = [tempItem, ...wishlistItems];
        setWishlistItems(updated);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(updated));
        }

        // 토스트 피드백 노출
        setToast({
          visible: true,
          type: 'added',
          title: product.title,
        });

        try {
          const res = await fetch('/api/wishlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              product_id: String(product.id),
              product_title: product.title,
              product_price: Number(product.price) || 0,
              product_image: imageUrl,
              category: product.category || 'general',
            }),
          });
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.data) {
              setWishlistItems((prev) =>
                prev.map((it) => (String(it.product_id) === String(product.id) ? json.data : it))
              );
            }
          }
          return true; // 찜 활성화됨
        } catch (err) {
          console.error('Failed to add wish item:', err);
          return true; // Optimistic 유지
        }
      }
    },
    [wishlistItems, userId, removeWish]
  );

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistCount: wishlistItems.length,
        isLoading,
        isWished,
        toggleWish,
        removeWish,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}

      {/* 전역 찜 토스트 알림 팝업 */}
      {toast.visible && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-zinc-950 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-zinc-800 animate-in fade-in slide-in-from-bottom-5 duration-200">
          {toast.type === 'added' ? (
            <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 fill-red-500 text-red-500 animate-pulse" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5" />
            </div>
          )}

          <div className="text-xs sm:text-sm">
            <p className="font-bold text-white flex items-center gap-1.5">
              {toast.type === 'added' ? (
                <>
                  <span className="text-red-500">❤️</span> 찜한 상품에 추가되었습니다!
                </>
              ) : (
                <>
                  <span>🤍</span> 찜 목록에서 삭제되었습니다.
                </>
              )}
            </p>
            <p className="text-zinc-400 text-[11px] line-clamp-1 max-w-[200px] sm:max-w-[280px]">
              {toast.title}
            </p>
          </div>

          {toast.type === 'added' && (
            <Link
              href="/mypage/wishlist"
              onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
              className="ml-2 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs whitespace-nowrap transition shadow-sm"
            >
              찜 목록 보기 →
            </Link>
          )}

          <button
            onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
            className="text-zinc-400 hover:text-white p-1 ml-1 rounded-md transition"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
