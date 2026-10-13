'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Award, Star, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useWishlist } from '@/context/WishlistContext';

const TABS = [
  { label: '전체 BEST', category: 'all' },
  { label: '볼캡', category: 'ballcap' },
  { label: '버킷햇', category: 'buckethat' },
  { label: '비니', category: 'beanie' },
  { label: '선바이저', category: 'sunvisor' },
];

export default function BestHatSection() {
  const [activeTab, setActiveTab] = useState('all');
  const { products } = useProducts();
  const { isWished, toggleWish } = useWishlist();

  const filteredProducts = activeTab === 'all'
    ? products
    : products.filter((p) => p.category === activeTab);

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* 섹션 타이틀 */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 text-white text-xs font-black uppercase mb-2">
              <Award className="w-3.5 h-3.5 text-amber-400" /> REAL-TIME RANKING
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              지금 가장 많이 찾는 <span className="text-amber-500">베스트 모자 랭킹</span>
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              실시간 주문량과 누적 리뷰 평점 기반으로 선별된 다써바 인기 상품
            </p>
          </div>

          <Link
            href="/category/best"
            className="inline-flex items-center gap-1 text-sm font-bold text-zinc-900 hover:text-amber-600 transition"
          >
            베스트 50 전체보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 카테고리 탭 필터 */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.category;
            return (
              <button
                key={tab.category}
                onClick={() => setActiveTab(tab.category)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-zinc-950 text-white shadow-md'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 베스트 상품 리스트 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.slice(0, 8).map((product, index) => {
            const rank = index + 1;
            const rankBadgeColor =
              rank === 1
                ? 'bg-amber-400 text-zinc-950'
                : rank === 2
                ? 'bg-zinc-300 text-zinc-900'
                : rank === 3
                ? 'bg-amber-700 text-white'
                : 'bg-zinc-800 text-zinc-200';

            return (
              <div
                key={product.id}
                className="group relative bg-white rounded-2xl overflow-hidden border border-zinc-200 hover:border-zinc-900 hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                {/* 썸네일 & 랭킹 배지 */}
                <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* 랭킹 뱃지 */}
                  <div
                    className={`absolute top-3 left-3 w-8 h-8 rounded-xl font-black text-sm flex items-center justify-center shadow-md ${rankBadgeColor}`}
                  >
                    {rank}
                  </div>

                  {/* 단체제작 가능 배지 */}
                  {product.isCustomAvailable && (
                    <div className="absolute bottom-3 left-3 bg-blue-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      자수제작 가능
                    </div>
                  )}

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

                {/* 정보 영역 */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {/* 별점 */}
                    <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-bold text-zinc-800">{product.rating}</span>
                      <span>({product.reviewCount})</span>
                    </div>

                    <Link href={`/product/${product.id}`} className="block">
                      <h4 className="font-bold text-sm text-zinc-900 line-clamp-1 group-hover:text-amber-600 transition">
                        {product.title}
                      </h4>
                    </Link>

                    <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                      {product.description}
                    </p>

                    {/* 사이즈 안내 */}
                    <div className="mt-2 text-[11px] text-zinc-500">
                      사이즈: {product.sizes.join(', ')}
                    </div>
                  </div>

                  {/* 가격 및 장바구니 */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
                    <div>
                      {product.originalPrice && (
                        <span className="text-xs text-zinc-400 line-through block">
                          {product.originalPrice.toLocaleString()}원
                        </span>
                      )}
                      <span className="text-base sm:text-lg font-black text-zinc-950">
                        {product.price.toLocaleString()}
                        <span className="text-xs font-normal text-zinc-600 ml-0.5">원</span>
                      </span>
                    </div>

                    <Link
                      href={`/product/${product.id}`}
                      className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-950 hover:text-white text-zinc-900 transition-colors"
                      title="상세보기 / 구매하기"
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
