'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/data/mockData';
import { ProductItem } from '@/types/shop';
import { useProducts } from '@/hooks/useProducts';
import { Star, Heart, ShoppingBag, ArrowLeft, SlidersHorizontal, Sparkles } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export default function CategoryPage({ params }: CategoryPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { isWished, toggleWish } = useWishlist();

  const [sortOrder, setSortOrder] = useState<'popular' | 'new' | 'priceAsc' | 'priceDesc'>('popular');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string>('');

  const currentCategory = CATEGORIES.find((c) => c.slug === slug);
  const categoryTitle =
    slug === 'bundle1plus1'
      ? '1+1 기획전 특가'
      : slug === 'best'
      ? '실시간 베스트 50'
      : slug === 'new'
      ? '2026 S/S 신상품'
      : currentCategory?.name || '전체 상품';

  // 상품 필터링
  let filtered = products.filter((product) => {
    if (slug === 'bundle1plus1') return product.isBundle1Plus1;
    if (slug === 'best') return true;
    if (slug === 'new') return product.badge === 'NEW' || product.badge === 'BEST';
    return product.category === slug;
  });

  if (selectedSubCategory !== 'all') {
    filtered = filtered.filter((p) => p.subCategory === selectedSubCategory);
  }

  // 정렬
  filtered.sort((a, b) => {
    if (sortOrder === 'popular') return b.reviewCount - a.reviewCount;
    if (sortOrder === 'new') return b.price - a.price; // 데모용
    if (sortOrder === 'priceAsc') return a.price - b.price;
    if (sortOrder === 'priceDesc') return b.price - a.price;
    return 0;
  });

  const handleQuickAdd = (product: ProductItem) => {
    addToCart({
      productId: product.id,
      title: product.title,
      price: product.price,
      image: product.images[0],
      color: product.colors[0],
      size: product.sizes[0],
      quantity: 1,
      isBundle1Plus1: product.isBundle1Plus1,
    });
    setToastMessage(`"${product.title}" 장바구니에 담겼습니다!`);
    setTimeout(() => setToastMessage(''), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-zinc-950 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-50 flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          {toastMessage}
        </div>
      )}

      {/* 상단 브레드크럼 & 타이틀 */}
      <div className="border-b border-zinc-200 bg-zinc-50/50 py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-3">
            <Link href="/" className="hover:text-zinc-800 transition">홈</Link>
            <span>›</span>
            <span className="text-zinc-800 font-semibold">{categoryTitle}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
                {categoryTitle}
                {slug === 'bundle1plus1' && (
                  <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded font-bold">
                    골라담기 2개 특별할인
                  </span>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                총 <strong className="text-zinc-900">{filtered.length}</strong>개의 모자 상품이 준비되어 있습니다.
              </p>
            </div>

            {/* 정렬 셀렉터 */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-zinc-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5" /> 정렬:
              </span>
              <button
                onClick={() => setSortOrder('popular')}
                className={`font-semibold ${sortOrder === 'popular' ? 'text-zinc-950 underline underline-offset-4' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                인기순
              </button>
              <span className="text-zinc-300">|</span>
              <button
                onClick={() => setSortOrder('new')}
                className={`font-semibold ${sortOrder === 'new' ? 'text-zinc-950 underline underline-offset-4' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                신상품순
              </button>
              <span className="text-zinc-300">|</span>
              <button
                onClick={() => setSortOrder('priceAsc')}
                className={`font-semibold ${sortOrder === 'priceAsc' ? 'text-zinc-950 underline underline-offset-4' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                낮은가격순
              </button>
              <span className="text-zinc-300">|</span>
              <button
                onClick={() => setSortOrder('priceDesc')}
                className={`font-semibold ${sortOrder === 'priceDesc' ? 'text-zinc-950 underline underline-offset-4' : 'text-zinc-400 hover:text-zinc-600'}`}
              >
                높은가격순
              </button>
            </div>
          </div>

          {/* 서브 카테고리 칩 (있을 경우) */}
          {currentCategory?.subcategories && (
            <div className="flex items-center gap-2 pt-5 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setSelectedSubCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                  selectedSubCategory === 'all'
                    ? 'bg-zinc-950 text-white'
                    : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
                }`}
              >
                전체
              </button>
              {currentCategory.subcategories.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubCategory(sub.slug)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap ${
                    selectedSubCategory === sub.slug
                      ? 'bg-zinc-950 text-white'
                      : 'bg-white border border-zinc-200 text-zinc-600 hover:border-zinc-400'
                  }`}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 상품 그리드 리스트 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-zinc-400">
            <p className="text-base font-semibold">해당 카테고리에 등록된 모자가 없습니다.</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1.5 text-xs text-amber-600 font-bold hover:underline"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 홈으로 돌아가기
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {filtered.map((product) => {
              const discountPercent = product.originalPrice
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                : null;

              return (
                <div
                  key={product.id}
                  className="group bg-white rounded-2xl overflow-hidden border border-zinc-200 hover:border-zinc-900 hover:shadow-xl transition-all duration-300 flex flex-col"
                >
                  {/* 썸네일 */}
                  <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden">
                    <img
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* 배지 */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
                      {product.isBundle1Plus1 && (
                        <span className="bg-red-600 text-white text-xs font-black px-2 py-0.5 rounded shadow-xs">
                          1+1 기획
                        </span>
                      )}
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

                  {/* 정보 */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-zinc-500 mb-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-zinc-800">{product.rating}</span>
                        <span>({product.reviewCount})</span>
                      </div>

                      <Link href={`/product/${product.id}`} className="block">
                        <h3 className="font-bold text-sm text-zinc-900 line-clamp-1 group-hover:text-amber-600 transition">
                          {product.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                        {product.description}
                      </p>

                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {product.colors.map((c: string, i: number) => (
                          <span
                            key={i}
                            className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 가격 및 퀵 담기 */}
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

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickAdd(product)}
                          className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-900 hover:text-white text-zinc-800 transition-colors"
                          title="장바구니 바로 담기"
                        >
                          <ShoppingBag className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
