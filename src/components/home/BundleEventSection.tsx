'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShoppingBag, Heart, Star, ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useWishlist } from '@/context/WishlistContext';

export default function BundleEventSection() {
  const { products } = useProducts();
  const { isWished, toggleWish } = useWishlist();
  const bundleProducts = products.filter((p) => p.isBundle1Plus1).slice(0, 4);

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-amber-50/60 to-white border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 섹션 헤더 타이틀 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black uppercase mb-2">
              <Sparkles className="w-3.5 h-3.5" /> 1+1 BUNDLE EVENT
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              원하는 컬러·옵션 마음대로! <span className="text-red-600">1+1 골라담기</span>
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              어떤 모자를 골라도 2개 선택 시 자동 할인 적용 + 전 상품 무료배송 혜택
            </p>
          </div>

          <Link
            href="/category/bundle1plus1"
            className="inline-flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700 transition"
          >
            기획전 전체보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 1+1 상품 그리드 (4열) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {bundleProducts.map((product) => {
            const discountPercent = product.originalPrice
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : null;

            return (
              <div
                key={product.id}
                className="group bg-white rounded-2xl overflow-hidden border border-zinc-200/80 hover:border-red-300 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* 썸네일 영역 */}
                <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* 1+1 뱃지 */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                    <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded shadow-sm">
                      1+1 기획
                    </span>
                    {discountPercent && (
                      <span className="bg-zinc-900 text-amber-400 text-[11px] font-bold px-1.5 py-0.5 rounded">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* 찜 버튼 */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleWish({
                        id: product.id,
                        title: product.title,
                        price: product.price,
                        image: product.images[0],
                        category: product.category,
                      });
                    }}
                    className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xs transition-all duration-200 shadow-md z-20 cursor-pointer active:scale-90 ${
                      isWished(product.id)
                        ? 'bg-white text-red-500 scale-105 border border-red-200 ring-2 ring-red-100'
                        : 'bg-white/90 hover:bg-white text-zinc-600 hover:text-red-500 hover:scale-110'
                    }`}
                    title={isWished(product.id) ? '찜 해제' : '찜하기'}
                    aria-label="위시리스트 토글"
                  >
                    <Heart
                      className={`w-4.5 h-4.5 transition-transform duration-200 ${
                        isWished(product.id) ? 'fill-red-500 text-red-500 scale-110' : ''
                      }`}
                    />
                  </button>
                </div>

                {/* 상품 정보 영역 */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* 별점 & 리뷰수 */}
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-zinc-800">{product.rating}</span>
                      <span>({product.reviewCount})</span>
                    </div>

                    <Link href={`/product/${product.id}`} className="block">
                      <h4 className="font-bold text-sm text-zinc-900 line-clamp-1 group-hover:text-red-600 transition">
                        {product.title}
                      </h4>
                    </Link>

                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {product.description}
                    </p>

                    {/* 컬러 옵션 칩 */}
                    <div className="flex items-center gap-1 mt-2.5 flex-wrap">
                      {product.colors.slice(0, 4).map((c: string, i: number) => (
                        <span
                          key={i}
                          className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded border border-zinc-200"
                        >
                          {c}
                        </span>
                      ))}
                      {product.colors.length > 4 && (
                        <span className="text-[10px] text-zinc-400">+{product.colors.length - 4}</span>
                      )}
                    </div>
                  </div>

                  {/* 가격 및 장바구니 담기 */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      {product.originalPrice && (
                        <span className="text-xs text-zinc-400 line-through block">
                          {product.originalPrice.toLocaleString()}원
                        </span>
                      )}
                      <span className="text-base sm:text-lg font-black text-red-600">
                        {product.price.toLocaleString()}
                        <span className="text-xs font-normal text-zinc-800 ml-0.5">원</span>
                      </span>
                    </div>

                    <Link
                      href={`/product/${product.id}`}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-red-600 text-white transition-colors"
                      title="1+1 선택하기"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
