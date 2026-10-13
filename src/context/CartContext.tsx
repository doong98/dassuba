'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CartItem } from '@/types/shop';
import { MOCK_PRODUCTS } from '@/lib/data/mockData';
import { useAuth } from './AuthContext';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (
    itemOrProduct: any,
    maybeColor?: string,
    maybeSize?: string,
    maybeQty?: number
  ) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  totalItemsCount: number;
  subtotal: number;
  bundleDiscount: number;
  shippingFee: number;
  finalTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'dasseoba_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'usr-demo-01';

  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // 1. 서버 API 및 Supabase DB에서 장바구니 목록 동기화
  const fetchCartFromDb = useCallback(async () => {
    try {
      const res = await fetch(`/api/cart?user_id=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCartItems(json.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(json.data));
          }
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch cart from DB, checking localStorage:', err);
    }

    // DB 데이터가 없을 때 로컬스토리지 또는 데모 데이터 로드
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${userId}`) || localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCartItems(parsed);
            return;
          }
        } catch {}
      }

      // 초기 기본 데모 장바구니
      const initialDemoCart: CartItem[] = [
        {
          id: 'cart-demo-01',
          productId: 'prod-1',
          title: '시그니처 딥핏 코튼 무지 볼캡',
          price: 19800,
          image: 'https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-1-signature-ballcap.png',
          color: '블랙',
          size: 'FREE (56-60cm)',
          quantity: 1,
          isBundle1Plus1: true,
        },
        {
          id: 'cart-demo-02',
          productId: 'prod-2',
          title: '빈티지 피그먼트 워싱 로우 볼캡',
          price: 24900,
          image: 'https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-2-vintage-washing-ballcap.png',
          color: '피그먼트그레이',
          size: 'FREE (56-60cm)',
          quantity: 1,
          isBundle1Plus1: true,
        },
      ];
      setCartItems(initialDemoCart);
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(initialDemoCart));
    }
  }, [userId]);

  useEffect(() => {
    fetchCartFromDb();
  }, [fetchCartFromDb]);

  // 로컬 스토리지 동기화 헬퍼
  const persistLocally = (items: CartItem[]) => {
    setCartItems(items);
    if (typeof window !== 'undefined') {
      localStorage.setItem(`${LOCAL_STORAGE_KEY}_${userId}`, JSON.stringify(items));
    }
  };

  // 2. 장바구니 상품 추가 (객체 또는 다중 인자 완벽 호환 + Supabase cart 테이블 저장)
  const addToCart = async (
    itemOrProduct: any,
    maybeColor?: string,
    maybeSize?: string,
    maybeQty?: number
  ) => {
    let resolvedItem: Omit<CartItem, 'id'>;

    if (!itemOrProduct || typeof itemOrProduct !== 'object') return;

    if ('productId' in itemOrProduct && 'price' in itemOrProduct) {
      // [케이스 1] CartItem 규격 객체
      resolvedItem = {
        productId: String(itemOrProduct.productId),
        title: String(itemOrProduct.title || '상품'),
        price: Number(itemOrProduct.price) || 0,
        image:
          itemOrProduct.image ||
          (Array.isArray(itemOrProduct.images) ? itemOrProduct.images[0] : '') ||
          '/images/products/bundle-1.png',
        color: itemOrProduct.color || maybeColor || '기본',
        size: itemOrProduct.size || maybeSize || 'FREE',
        quantity: Math.max(1, Number(itemOrProduct.quantity || maybeQty) || 1),
        isBundle1Plus1: Boolean(itemOrProduct.isBundle1Plus1),
      };
    } else {
      // [케이스 2] ProductItem 또는 WishlistItem 형태 객체
      const rawImg =
        itemOrProduct.image ||
        itemOrProduct.product_image ||
        (Array.isArray(itemOrProduct.images) ? itemOrProduct.images[0] : '') ||
        '/images/products/bundle-1.png';

      resolvedItem = {
        productId: String(itemOrProduct.product_id || itemOrProduct.id || 'prod-unknown'),
        title: String(itemOrProduct.product_title || itemOrProduct.title || '상품'),
        price: Number(itemOrProduct.product_price || itemOrProduct.price) || 0,
        image: rawImg,
        color: itemOrProduct.color || maybeColor || (Array.isArray(itemOrProduct.colors) ? itemOrProduct.colors[0] : '기본') || '기본',
        size: itemOrProduct.size || maybeSize || (Array.isArray(itemOrProduct.sizes) ? itemOrProduct.sizes[0] : 'FREE') || 'FREE',
        quantity: Math.max(1, Number(itemOrProduct.quantity || maybeQty) || 1),
        isBundle1Plus1: Boolean(
          itemOrProduct.isBundle1Plus1 ||
          itemOrProduct.is_bundle_1plus1 ||
          itemOrProduct.category === 'bundle1plus1'
        ),
      };
    }

    // Optimistic UI 반영
    const existingIndex = cartItems.findIndex(
      (i) =>
        i.productId === resolvedItem.productId &&
        i.color === resolvedItem.color &&
        i.size === resolvedItem.size
    );

    let updated: CartItem[];
    if (existingIndex > -1) {
      updated = [...cartItems];
      updated[existingIndex].quantity += resolvedItem.quantity;
    } else {
      const newItem: CartItem = {
        ...resolvedItem,
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      updated = [...cartItems, newItem];
    }
    persistLocally(updated);

    // Supabase cart 테이블에 실시간 저장 (API 통신)
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          product_id: resolvedItem.productId,
          title: resolvedItem.title,
          price: resolvedItem.price,
          image: resolvedItem.image,
          color: resolvedItem.color,
          size: resolvedItem.size,
          quantity: resolvedItem.quantity,
          is_bundle_1plus1: resolvedItem.isBundle1Plus1,
        }),
      });
    } catch (err) {
      console.error('Failed to sync addToCart with Supabase:', err);
    }
  };

  // 3. 장바구니 항목 삭제
  const removeFromCart = async (id: string) => {
    const updated = cartItems.filter((i) => i.id !== id);
    persistLocally(updated);

    try {
      await fetch(`/api/cart?id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to sync removeFromCart with Supabase:', err);
    }
  };

  // 4. 수량 변경
  const updateQuantity = async (id: string, delta: number) => {
    let finalQty = 1;
    const updated = cartItems
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          finalQty = newQty;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    persistLocally(updated);

    try {
      await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          user_id: userId,
          delta,
          quantity: finalQty,
        }),
      });
    } catch (err) {
      console.error('Failed to sync updateQuantity with Supabase:', err);
    }
  };

  // 5. 장바구니 전체 비우기
  const clearCart = async () => {
    persistLocally([]);

    try {
      await fetch(`/api/cart?clear=true&user_id=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });
    } catch (err) {
      console.error('Failed to sync clearCart with Supabase:', err);
    }
  };

  // 계산 로직 (PRD)
  const totalItemsCount = cartItems.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);

  const subtotal = cartItems.reduce(
    (acc, i) => acc + (Number(i.price) || 0) * (Number(i.quantity) || 1),
    0
  );

  const bundleItemsCount = cartItems
    .filter((i) => i.isBundle1Plus1)
    .reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);

  // 1+1 짝마다 10,000원 묶음 할인
  const bundleDiscount = Math.floor(bundleItemsCount / 2) * 10000;

  // 배송비: 30,000원 이상 구매 시 무료배송, 미만 시 3,000원
  const shippingFee = subtotal - bundleDiscount >= 30000 || cartItems.length === 0 ? 0 : 3000;

  const finalTotal = Math.max(0, subtotal - bundleDiscount + shippingFee);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        refreshCart: fetchCartFromDb,
        totalItemsCount,
        subtotal,
        bundleDiscount,
        shippingFee,
        finalTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
