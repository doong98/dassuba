'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MOCK_PRODUCTS } from '@/lib/data/mockData';
import { useProducts } from '@/hooks/useProducts';
import {
  Star,
  Heart,
  ShoppingBag,
  Truck,
  ShieldCheck,
  Sparkles,
  Scissors,
  Check,
  ChevronRight,
  Share2,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductDetailPage({ params }: ProductDetailPageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;
  const router = useRouter();
  const { addToCart } = useCart();
  const { products } = useProducts();
  const { isWished, toggleWish } = useWishlist();

  const product =
    products.find((p) => p.id === productId) ||
    MOCK_PRODUCTS.find((p) => p.id === productId) ||
    MOCK_PRODUCTS[0];

  const [selectedImage, setSelectedImage] = useState(product.images[0] || '/images/products/bundle-1.png');
  const [selectedColor, setSelectedColor] = useState(product.colors[0] || '기본');
  const [selectedSize, setSelectedSize] = useState(product.sizes[0] || 'FREE');
  const [customEmbroidery, setCustomEmbroidery] = useState<'none' | 'front' | 'side' | 'back'>('none');
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'size' | 'shipping' | 'reviews'>('desc');
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (product) {
      setSelectedImage(product.images[0] || '/images/products/bundle-1.png');
      setSelectedColor(product.colors[0] || '기본');
      setSelectedSize(product.sizes[0] || 'FREE');
    }
  }, [product.id, product.images, product.colors, product.sizes]);

  const totalPrice = product.price * quantity;

  const handleAddToCart = () => {
    addToCart({
      productId: product.id,
      title: `${product.title} ${customEmbroidery !== 'none' ? '(커스텀자수)' : ''}`,
      price: product.price,
      image: selectedImage,
      color: selectedColor,
      size: selectedSize,
      quantity,
      isBundle1Plus1: product.isBundle1Plus1,
    });
    setToastMessage('장바구니에 상품을 담았습니다!');
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 bg-zinc-950 text-white px-6 py-3 rounded-full text-xs font-bold shadow-2xl z-50 flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
          <Link href="/cart" className="underline text-amber-400 ml-2">장바구니 이동</Link>
        </div>
      )}

      {/* 브레드크럼 */}
      <div className="border-b border-zinc-100 py-3.5 px-4 sm:px-6 text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <Link href="/" className="hover:text-zinc-700">홈</Link>
          <span>›</span>
          <Link href={`/category/${product.category}`} className="hover:text-zinc-700 capitalize">
            {product.category}
          </Link>
          <span>›</span>
          <span className="text-zinc-800 font-medium truncate max-w-xs">{product.title}</span>
        </div>
      </div>

      {/* 메인 상세 섹션 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* 좌측: 상품 이미지 갤러리 */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-zinc-100 border border-zinc-200 shadow-xs">
              <img
                src={selectedImage}
                alt={product.title}
                className="w-full h-full object-cover"
              />
              {product.isBundle1Plus1 && (
                <span className="absolute top-4 left-4 bg-red-600 text-white text-xs font-black px-3 py-1 rounded-full shadow-md">
                  1+1 번들 기획전 상품
                </span>
              )}

              {/* 찜 버튼 */}
              <button
                type="button"
                onClick={() => {
                  toggleWish({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.images[0] || selectedImage,
                    category: product.category,
                  });
                }}
                className={`absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-xs transition-all duration-200 shadow-lg z-20 cursor-pointer active:scale-90 ${
                  isWished(product.id)
                    ? 'bg-white text-red-500 scale-105 border border-red-200 ring-2 ring-red-100'
                    : 'bg-white/90 hover:bg-white text-zinc-600 hover:text-red-500 hover:scale-110'
                }`}
                title={isWished(product.id) ? '찜 해제' : '찜하기'}
                aria-label="위시리스트 토글"
              >
                <Heart
                  className={`w-5.5 h-5.5 transition-transform duration-200 ${
                    isWished(product.id) ? 'fill-red-500 text-red-500 scale-110' : ''
                  }`}
                />
              </button>
            </div>

            {/* 썸네일 리스트 */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3">
                {product.images.map((img: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition ${
                      selectedImage === img ? 'border-zinc-950 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 우측: 상품 옵션 및 주문 패널 */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              {/* 상단 뱃지 & 평점 */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  DASSEOBA ORIGINAL
                </span>
                <div className="flex items-center gap-1 text-xs text-zinc-600">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-zinc-900">{product.rating}</span>
                  <span>({product.reviewCount}개 리뷰)</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-2 tracking-tight">
                {product.title}
              </h1>

              <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
                {product.description}
              </p>

              {/* 1+1 기획전 혜택 안내 상자 */}
              {product.isBundle1Plus1 && (
                <div className="mt-4 p-4 rounded-2xl bg-red-50/70 border border-red-200/80 text-red-900 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="bg-red-600 text-white font-black px-2 py-0.5 rounded text-[10px]">
                      1+1 혜택
                    </span>
                    <span className="font-medium">
                      2개 담으면 <strong>자동 10,000원 추가 할인</strong> 적용!
                    </span>
                  </div>
                  <Link href="/category/bundle1plus1" className="text-red-700 underline font-bold shrink-0">
                    다른 1+1 상품 보기
                  </Link>
                </div>
              )}

              {/* 가격 영역 */}
              <div className="mt-5 pb-5 border-b border-zinc-200 flex items-baseline gap-3">
                {product.originalPrice && (
                  <span className="text-base text-zinc-400 line-through">
                    {product.originalPrice.toLocaleString()}원
                  </span>
                )}
                <span className="text-3xl font-black text-zinc-950">
                  {product.price.toLocaleString()}
                  <span className="text-sm font-normal text-zinc-600 ml-1">원</span>
                </span>
                {product.originalPrice && (
                  <span className="text-sm font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </span>
                )}
              </div>

              {/* 배송 및 적립금 안내 */}
              <div className="py-4 border-b border-zinc-200 space-y-2 text-xs text-zinc-600">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-zinc-500" />
                  <span>배송비: 3,000원 (30,000원 이상 구매 시 <strong>무료배송</strong>)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>구매 적립금: 실결제금액의 <strong>1% 즉시 적립</strong> (포토리뷰 작성 시 +1,500P)</span>
                </div>
              </div>

              {/* 옵션 1: 색상 선택 */}
              <div className="mt-5 space-y-2">
                <label className="text-xs font-bold text-zinc-800">
                  색상 선택 <span className="text-zinc-400 font-normal">({selectedColor})</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color: string) => {
                    const isSelected = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        className={`px-3.5 py-2 text-xs rounded-xl font-semibold border transition ${
                          isSelected
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400'
                        }`}
                      >
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 옵션 2: 사이즈 선택 */}
              <div className="mt-4 space-y-2">
                <label className="text-xs font-bold text-zinc-800">
                  사이즈 선택 <span className="text-zinc-400 font-normal">({selectedSize})</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size: string) => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`px-3.5 py-2 text-xs rounded-xl font-semibold border transition ${
                          isSelected
                            ? 'bg-zinc-950 text-white border-zinc-950 shadow-xs'
                            : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400'
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 옵션 3: 단체/커스텀 자수 옵션 (PRD 요구사항) */}
              {product.isCustomAvailable && (
                <div className="mt-4 p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-950">
                    <span className="flex items-center gap-1.5">
                      <Scissors className="w-3.5 h-3.5 text-blue-600" /> 커스텀 자수 옵션 (선택)
                    </span>
                    <span className="text-[11px] text-blue-600 font-normal">1개부터 제작 가능</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 text-xs">
                    {[
                      { id: 'none', label: '무자수 (완제품)' },
                      { id: 'front', label: '정면 컴퓨터 자수' },
                      { id: 'side', label: '좌측 측면 자수' },
                      { id: 'back', label: '후면 스트랩 자수' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCustomEmbroidery(opt.id as any)}
                        className={`py-2 px-1 text-[11px] font-semibold rounded-lg border text-center transition ${
                          customEmbroidery === opt.id
                            ? 'bg-blue-700 text-white border-blue-700'
                            : 'bg-white border-blue-200 text-blue-900 hover:bg-blue-100/50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 수량 조절 및 총 결제액 */}
              <div className="mt-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-200 flex items-center justify-between">
                <div className="flex items-center border border-zinc-300 rounded-xl bg-white overflow-hidden">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold min-w-8 text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3 py-1.5 text-zinc-600 hover:bg-zinc-100 font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="text-right">
                  <span className="text-xs text-zinc-400 block">총 상품 금액</span>
                  <span className="text-xl font-black text-zinc-950">
                    {totalPrice.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>

            {/* CTA 버튼 그룹 (찜하기 / 장바구니 담기 / 바로 구매) */}
            <div className="flex items-center gap-2 sm:gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  toggleWish({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.images[0] || selectedImage,
                    category: product.category,
                  });
                }}
                className={`p-4 rounded-2xl border-2 flex items-center justify-center transition shrink-0 ${
                  isWished(product.id)
                    ? 'border-red-500 bg-red-50 text-red-500'
                    : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-red-500'
                }`}
                title={isWished(product.id) ? '찜 해제' : '찜하기'}
                aria-label="찜하기 토글"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isWished(product.id) ? 'fill-red-500 text-red-500' : ''
                  }`}
                />
              </button>

              <button
                onClick={handleAddToCart}
                className="flex-1 py-4 rounded-2xl bg-white border-2 border-zinc-950 hover:bg-zinc-50 text-zinc-950 font-bold text-sm flex items-center justify-center gap-2 transition"
              >
                <ShoppingBag className="w-4 h-4" /> 장바구니 담기
              </button>

              <button
                onClick={handleBuyNow}
                className="flex-1 py-4 rounded-2xl bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm flex items-center justify-center gap-2 transition shadow-lg"
              >
                바로 구매하기
              </button>
            </div>
          </div>
        </div>

        {/* 상세 탭 영역 */}
        <div className="mt-16 border-t border-zinc-200 pt-10">
          <div className="flex border-b border-zinc-200">
            {[
              { id: 'desc', label: '상품 상세정보' },
              { id: 'size', label: '사이즈 가이드' },
              { id: 'shipping', label: '배송/교환/반품 안내' },
              { id: 'reviews', label: `구매후기 (${product.reviewCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-6 font-bold text-sm border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-zinc-950 text-zinc-950'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="py-8 text-zinc-700 leading-relaxed text-sm">
            {activeTab === 'desc' && (
              <div className="space-y-4 max-w-3xl">
                <h3 className="text-lg font-black text-zinc-900">다써바 프리미엄 모자 제작 포인트</h3>
                <p>
                  한국인의 두상 데이터와 오랜 모자 제작 노하우를 바탕으로, 정수리부터 관자놀이까지 자연스럽게 감싸주는 황금 비율 크라운을 완성했습니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                    <h4 className="font-bold text-zinc-900 mb-1">고밀도 14수 바이오 코튼</h4>
                    <p className="text-xs text-zinc-500">잦은 세탁에도 형태 뒤틀림이 없는 탄탄한 조직감</p>
                  </div>
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                    <h4 className="font-bold text-zinc-900 mb-1">흡한속건 땀받이 헤드밴드</h4>
                    <p className="text-xs text-zinc-500">여름철 야외 활동에도 이마의 땀을 빠르게 배출</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'size' && (
              <div className="max-w-2xl space-y-3">
                <h3 className="text-lg font-black text-zinc-900">상세 사이즈 측정 기준 (cm)</h3>
                <table className="w-full text-xs text-left border border-zinc-200">
                  <thead className="bg-zinc-100 font-bold text-zinc-900">
                    <tr>
                      <th className="p-2.5 border-b border-zinc-200">구분</th>
                      <th className="p-2.5 border-b border-zinc-200">머리둘레</th>
                      <th className="p-2.5 border-b border-zinc-200">깊이 (높이)</th>
                      <th className="p-2.5 border-b border-zinc-200">챙길이</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-zinc-100">
                      <td className="p-2.5 font-bold">FREE</td>
                      <td className="p-2.5">56 ~ 60cm</td>
                      <td className="p-2.5">16.5cm</td>
                      <td className="p-2.5">7.5cm</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold">빅사이즈 (XL)</td>
                      <td className="p-2.5">59 ~ 63cm</td>
                      <td className="p-2.5">18.0cm</td>
                      <td className="p-2.5">8.0cm</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'shipping' && (
              <div className="max-w-3xl space-y-3 text-xs leading-relaxed">
                <h3 className="text-sm font-bold text-zinc-900">배송 및 반품 규정 (PRD 정책 준수)</h3>
                <p>• <strong>배송 안내</strong>: 평일 16:00 이전 결제 시 당일 출고 (우체국/CJ대한통운)</p>
                <p>• <strong>취소 규정</strong>: '결제완료' 단계 즉시 취소 가능. '배송준비/제작중' 상태는 고객센터 확인 필수</p>
                <p>• <strong>반품/환불</strong>: 배송 완료 후 7일 이내 접수 가능, 단순 변심 시 왕복 배송비 6,000원 자동 정산 반영</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-900">구매 고객 후기 작성 혜택</span>
                    <p className="text-amber-800">일반 리뷰 작성 시 500P, 포토 리뷰 작성 시 1,500P 즉시 적립!</p>
                  </div>
                  <button className="px-4 py-2 bg-zinc-950 text-white font-bold rounded-xl">리뷰 작성하기</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
