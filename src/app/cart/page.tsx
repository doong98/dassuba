'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import LoginRequired from '@/components/auth/LoginRequired';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles, Truck, AlertCircle } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    bundleDiscount,
    shippingFee,
    finalTotal,
  } = useCart();

  const bundleCount = cartItems.filter((i) => i.isBundle1Plus1).reduce((acc, i) => acc + i.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginRequired
        pageName="장바구니"
        title="장바구니 로그인 안내"
        description="담아두신 모자 상품을 확인하고 주문 결제를 진행하시려면 먼저 로그인해 주세요."
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-zinc-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
              <ShoppingBag className="w-7 h-7" /> 장바구니
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              장바구니에 담긴 모자 상품을 확인하고 주문을 진행하세요.
            </p>
          </div>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-zinc-400 hover:text-red-600 transition"
            >
              장바구니 비우기
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-zinc-200 shadow-xs max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400 mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-zinc-800">장바구니가 비어 있습니다</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-6">
              다써바의 인기 모자와 1+1 기획전 상품을 만나보세요!
            </p>
            <Link
              href="/"
              className="px-6 py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-full font-bold text-xs inline-flex items-center gap-1.5 transition"
            >
              쇼핑 계속하기 <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* 장바구니 상품 목록 */}
            <div className="lg:col-span-8 space-y-4">
              {/* 1+1 번들 할인 알림 바 */}
              {bundleCount > 0 && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-red-500 to-amber-500 text-white shadow-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-200" />
                    <div>
                      <p className="font-extrabold text-xs">
                        1+1 번들 기획전 상품 {bundleCount}개 담김
                      </p>
                      <p className="text-[11px] text-white/90">
                        {bundleCount % 2 === 0
                          ? `🎉 짝수(${bundleCount}개) 조건 충족! 총 ${bundleDiscount.toLocaleString()}원 할인 적용 중`
                          : `💡 1개 더 담으시면 추가 10,000원 묶음 할인이 적용됩니다!`}
                      </p>
                    </div>
                  </div>
                  {bundleCount % 2 !== 0 && (
                    <Link
                      href="/category/bundle1plus1"
                      className="text-xs font-bold bg-white text-red-600 px-3 py-1.5 rounded-full hover:bg-zinc-100 transition shrink-0"
                    >
                      +1개 더 고르기
                    </Link>
                  )}
                </div>
              )}

              {/* 개별 아이템 카드 */}
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-zinc-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={item.image || '/images/products/bundle-1.png'}
                      alt={item.title}
                      className="w-20 h-20 rounded-xl object-cover bg-zinc-100 border border-zinc-100 shrink-0"
                    />
                    <div>
                      {item.isBundle1Plus1 && (
                        <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                          1+1 기획전
                        </span>
                      )}
                      <h3 className="font-bold text-sm text-zinc-900 mt-0.5">{item.title}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        옵션: {item.color || '기본'} / {item.size || 'FREE'}
                      </p>
                      <p className="text-sm font-black text-zinc-900 mt-1">
                        {(Number(item.price) || 0).toLocaleString()}원
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-zinc-100">
                    {/* 수량 변경 */}
                    <div className="flex items-center border border-zinc-200 rounded-xl bg-zinc-50 overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-200"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-center min-w-8">
                        {Number(item.quantity) || 1}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-2.5 py-1 text-zinc-600 hover:bg-zinc-200"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 소계 & 삭제 */}
                    <div className="text-right flex items-center gap-3">
                      <span className="font-black text-sm text-zinc-900">
                        {((Number(item.price) || 0) * (Number(item.quantity) || 1)).toLocaleString()}원
                      </span>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg transition"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 결제 요약 패널 */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4 sticky top-28">
              <h2 className="font-black text-base text-zinc-950 pb-3 border-b border-zinc-100">
                주문 결제 금액
              </h2>

              <div className="space-y-2 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span>총 상품 금액</span>
                  <span className="font-bold text-zinc-900">{subtotal.toLocaleString()}원</span>
                </div>

                {bundleDiscount > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>1+1 번들 특별할인</span>
                    <span>-{bundleDiscount.toLocaleString()}원</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>배송비 (30,000원 이상 무료)</span>
                  <span className="font-bold text-zinc-900">
                    {shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-200 flex justify-between items-baseline">
                <div>
                  <span className="text-xs text-zinc-400 block">최종 결제 예상 금액</span>
                  <span className="text-2xl font-black text-zinc-950">
                    {finalTotal.toLocaleString()}원
                  </span>
                </div>
              </div>

              <button
                onClick={() => router.push('/checkout')}
                className="w-full py-4 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm rounded-2xl transition shadow-lg flex items-center justify-center gap-2 mt-2"
              >
                <span>주문서 작성 / 결제하기</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2 text-[11px] text-zinc-400 space-y-1">
                <p>• 가입 즉시 지급된 2,000P 적립금을 결제창에서 적용하실 수 있습니다.</p>
                <p>• 토스페이먼츠 및 포트원 안심 에스크로 결제 시스템이 적용됩니다.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
