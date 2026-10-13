'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  Camera,
  ThumbsUp,
  Filter,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  X,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface PhotoReview {
  id: string;
  author: string;
  date: string;
  rating: number;
  productName: string;
  productOption: string;
  productPrice: number;
  productImage: string;
  reviewImage?: string;
  content: string;
  fitTag: string; // 깊이감, 착용감
  likes: number;
  isLiked?: boolean;
}

const INITIAL_REVIEWS: PhotoReview[] = [
  {
    id: 'rev-1',
    author: '김*현 (러닝크루)',
    date: '2026-10-11',
    rating: 5,
    productName: '시그니처 딥핏 코튼 무지 볼캡',
    productOption: '차콜 블랙 / FREE (대두추천)',
    productPrice: 29800,
    productImage: '/images/products/bundle-1.png',
    reviewImage: '/images/products/bundle-1.png',
    content:
      '머리가 큰 편이라 백화점 브랜드 모자는 귀 위가 붕 떠서 항상 실패했는데, 다써바 딥핏 볼캡은 진짜 깊이가 귀 바로 위까지 푹 덮어줘서 얼굴이 작아 보여요! 원단도 탄탄하고 땀 흡수 밴드가 편안합니다. 1+1 기획전으로 베이지 컬러도 같이 샀는데 대만족입니다.',
    fitTag: '깊이감 깊음 · 둘레 여유로움 · 얼굴소멸핏',
    likes: 42,
  },
  {
    id: 'rev-2',
    author: '이*우 (캠핑매니아)',
    date: '2026-10-10',
    rating: 5,
    productName: '빅사이즈 대두 깊은 사계절 벙거지 버킷햇',
    productOption: '카키 올리브 / XL',
    productPrice: 43800,
    productImage: '/images/products/bundle-2.png',
    reviewImage: '/images/products/bundle-2.png',
    content:
      '캠핑 갈 때 자외선 차단용으로 샀는데 챙 각도가 너무 예쁘게 떨어집니다. 바람 불어도 스트랩 있어서 안 날아가고 생활 방수 코팅도 아주 훌륭해요! 주변 크루원들도 어디서 샀냐고 물어봐서 다써바 링크 바로 보내줬습니다.',
    fitTag: '챙 각도 완벽 · 방수 원단 · 착용감 편안함',
    likes: 28,
  },
  {
    id: 'rev-3',
    author: '박*진',
    date: '2026-10-09',
    rating: 5,
    productName: '빈티지 피그먼트 워싱 딥 볼캡',
    productOption: '워싱 네이비 / FREE',
    productPrice: 34700,
    productImage: '/images/products/bundle-3.png',
    reviewImage: '/images/products/bundle-3.png',
    content:
      '색감이 실물이 훨씬 고급스럽습니다! 자연스러운 워싱 텍스처라 어떤 옷에 입어도 찰떡이고, 정수리 핏이 들뜨지 않고 예쁘게 감싸줘요. 가을 데일리 모자로 매일 쓰고 다닙니다.',
    fitTag: '자연스러운 워싱 · 두상 보정 · 데일리 최적',
    likes: 19,
  },
  {
    id: 'rev-4',
    author: '최*민 (헬스트레이너)',
    date: '2026-10-08',
    rating: 5,
    productName: '초경량 발수 나일론 캠프캡 5패널',
    productOption: '매트 블랙 / FREE',
    productPrice: 28900,
    productImage: '/images/products/bundle-4.png',
    reviewImage: '/images/products/bundle-4.png',
    content:
      '운동할 때 무거운 모자 쓰면 머리 아픈데, 이건 깃털처럼 가볍고 땀 흘려도 금방 말라요. 5패널 특유의 스트릿한 감성이 살아있어서 운동복뿐 아니라 캐주얼 셋업에도 잘 어울립니다.',
    fitTag: '초경량 50g · 빠른 건조 · 스포티핏',
    likes: 15,
  },
  {
    id: 'rev-5',
    author: '정*아',
    date: '2026-10-07',
    rating: 4,
    productName: '골지 롱 와치캡 니트 숏비니',
    productOption: '오트밀 베이지 / FREE',
    productPrice: 19800,
    productImage: '/images/products/bundle-5.png',
    reviewImage: '/images/products/bundle-5.png',
    content:
      '도톰하고 쫀쫀해서 바람 하나도 안 들어와요. 숏비니로 접어 써도 되고 롱으로 펴서 써도 예쁩니다. 니트 특유의 따가움 없이 부드러워서 피부 예민한 분들께도 추천해요.',
    fitTag: '부드러운 촉감 · 보온성 우수 · 2WAY 연출',
    likes: 11,
  },
];

export default function PhotoReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<PhotoReview[]>(INITIAL_REVIEWS);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'ballcap' | 'bucket' | 'bundle'>('all');
  const [onlyPhoto, setOnlyPhoto] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'likes'>('recent');

  // 모달 상태
  const [selectedReviewImage, setSelectedReviewImage] = useState<string | null>(null);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // 리뷰 작성 폼 상태
  const [writeProductName, setWriteProductName] = useState('시그니처 딥핏 코튼 무지 볼캡');
  const [writeRating, setWriteRating] = useState(5);
  const [writeFitTag, setWriteFitTag] = useState('깊이감 깊음 · 얼굴소멸핏');
  const [writeContent, setWriteContent] = useState('');
  const [writeImageUrl, setWriteImageUrl] = useState('/images/products/bundle-1.png');

  // 좋아요 토글 핸들러
  const handleLike = (id: string) => {
    setReviews(
      reviews.map((r) => {
        if (r.id === id) {
          const isLiked = !r.isLiked;
          return {
            ...r,
            isLiked,
            likes: isLiked ? r.likes + 1 : r.likes - 1,
          };
        }
        return r;
      })
    );
  };

  // 리뷰 등록 핸들러
  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!writeContent.trim()) {
      alert('착용 후기 내용을 10자 이상 작성해 주세요.');
      return;
    }

    const newReview: PhotoReview = {
      id: 'rev-' + Date.now(),
      author: user?.name ? `${user.name.slice(0, 1)}*${user.name.slice(2) || '고객'}` : '홍*동 (구매회원)',
      date: new Date().toISOString().split('T')[0],
      rating: writeRating,
      productName: writeProductName,
      productOption: '선택 옵션 / FREE',
      productPrice: 29800,
      productImage: writeImageUrl,
      reviewImage: writeImageUrl,
      content: writeContent,
      fitTag: writeFitTag,
      likes: 0,
    };

    setReviews([newReview, ...reviews]);
    setIsWriteModalOpen(false);
    setWriteContent('');
    alert('🎉 포토리뷰가 성공적으로 등록되었습니다!\n포토리뷰 작성 혜택 500P 적립금이 지급되었습니다.');
  };

  // 필터링 및 정렬
  const filtered = reviews
    .filter((r) => {
      if (onlyPhoto && !r.reviewImage) return false;
      if (categoryFilter === 'ballcap') return r.productName.includes('볼캡');
      if (categoryFilter === 'bucket') return r.productName.includes('버킷햇') || r.productName.includes('벙거지');
      if (categoryFilter === 'bundle') return r.productName.includes('기획전') || r.productOption.includes('1+1');
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'likes') return b.likes - a.likes;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 상단 타이틀 & 리뷰 작성 배너 */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-200">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold mb-3">
              <Camera className="w-3.5 h-3.5" /> 다써바 실착 리얼 포토 후기
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-zinc-950 tracking-tight">
              구매 고객 실착 포토리뷰
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-2">
              실제 구매하신 고객님들의 리얼 착용 핏과 둘레감, 원단 후기를 사진으로 직접 확인하세요.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsWriteModalOpen(true)}
              className="px-5 py-3 bg-zinc-950 hover:bg-zinc-800 text-white rounded-2xl font-bold text-xs inline-flex items-center gap-2 transition shadow-md"
            >
              <Camera className="w-4 h-4 text-amber-400" />
              <span>포토리뷰 작성하고 500P 받기</span>
            </button>
          </div>
        </div>

        {/* 평점 통계 하이라이트 배너 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-4 text-center md:border-r border-zinc-100 pr-0 md:pr-6">
            <span className="text-4xl sm:text-5xl font-black text-zinc-950 tracking-tight">4.9</span>
            <div className="flex justify-center items-center gap-1 text-amber-400 my-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs text-zinc-500 font-medium">전체 구매 리뷰 1,284건 기준</p>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <span className="text-zinc-400 block text-[11px]">깊이감 만족도</span>
              <span className="font-black text-zinc-900 text-sm mt-0.5 block">98% 귀까지 푹 덮임</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
              <span className="text-zinc-400 block text-[11px]">둘레 사이즈</span>
              <span className="font-black text-zinc-900 text-sm mt-0.5 block">95% 대두도 여유로움</span>
            </div>
            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-100 col-span-2 sm:col-span-1">
              <span className="text-zinc-400 block text-[11px]">원단 및 마감</span>
              <span className="font-black text-zinc-900 text-sm mt-0.5 block">99% 탄탄하고 늘어짐 없음</span>
            </div>
          </div>
        </div>

        {/* 포토 리뷰 미리보기 갤러리 썸네일 바 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-base text-zinc-950 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> 포토 갤러리 모아보기
            </h2>
            <span className="text-xs text-zinc-400">사진 클릭 시 크게 보기</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-5 gap-3">
            {reviews
              .filter((r) => r.reviewImage)
              .slice(0, 5)
              .map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedReviewImage(r.reviewImage!)}
                  className="aspect-square rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 cursor-pointer group relative shadow-xs"
                >
                  <img
                    src={r.reviewImage}
                    alt={r.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold gap-1">
                    <Camera className="w-4 h-4" /> 크게보기
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 필터 및 정렬 바 */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white rounded-2xl border border-zinc-200">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: '전체 상품' },
              { id: 'ballcap', label: '볼캡 실착' },
              { id: 'bucket', label: '버킷햇 실착' },
              { id: 'bundle', label: '1+1 기획전' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setCategoryFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  categoryFilter === f.id
                    ? 'bg-zinc-950 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {f.label}
              </button>
            ))}

            <label className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 ml-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyPhoto}
                onChange={(e) => setOnlyPhoto(e.target.checked)}
                className="w-3.5 h-3.5 rounded text-zinc-950"
              />
              <span>포토 리뷰만 보기</span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-400">정렬:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-50 border border-zinc-200 rounded-lg p-1.5 font-bold text-zinc-800 focus:outline-none"
            >
              <option value="recent">최신순</option>
              <option value="rating">별점 높은순</option>
              <option value="likes">추천 많은순</option>
            </select>
          </div>
        </div>

        {/* 리뷰 상세 목록 리스트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs flex flex-col justify-between space-y-4 hover:border-zinc-300 transition"
            >
              <div className="space-y-3">
                {/* 작성자 & 별점 */}
                <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-700 font-bold flex items-center justify-center text-xs">
                      {rev.author.slice(0, 1)}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-zinc-900 block">{rev.author}</span>
                      <span className="text-[11px] text-zinc-400">{rev.date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400" />
                    ))}
                  </div>
                </div>

                {/* 구매 상품 정보 미니 바 */}
                <div className="flex items-center gap-3 p-2.5 bg-zinc-50 rounded-xl">
                  <img
                    src={rev.productImage}
                    alt={rev.productName}
                    className="w-12 h-12 rounded-lg object-cover bg-white border border-zinc-200"
                  />
                  <div className="flex-1 truncate">
                    <p className="font-bold text-xs text-zinc-900 truncate">{rev.productName}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{rev.productOption}</p>
                  </div>
                  <span className="font-black text-xs text-zinc-900 shrink-0">
                    {rev.productPrice.toLocaleString()}원
                  </span>
                </div>

                {/* 핏 태그 */}
                <div className="inline-block px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px]">
                  ✨ {rev.fitTag}
                </div>

                {/* 실착 사진 */}
                {rev.reviewImage && (
                  <div
                    onClick={() => setSelectedReviewImage(rev.reviewImage!)}
                    className="w-full h-56 rounded-2xl overflow-hidden bg-zinc-100 border border-zinc-200 cursor-pointer group relative"
                  >
                    <img
                      src={rev.reviewImage}
                      alt="실착 후기 사진"
                      className="w-full h-full object-cover group-hover:scale-102 transition"
                    />
                    <div className="absolute bottom-3 right-3 bg-black/60 text-white text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 backdrop-blur-xs">
                      <Camera className="w-3 h-3" /> 실착 이미지
                    </div>
                  </div>
                )}

                {/* 리뷰 본문 */}
                <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
                  {rev.content}
                </p>
              </div>

              {/* 하단 도움돼요 & 추천 버튼 */}
              <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                <button
                  onClick={() => handleLike(rev.id)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition ${
                    rev.isLiked
                      ? 'border-blue-600 bg-blue-50 text-blue-600'
                      : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                  }`}
                >
                  <ThumbsUp className={`w-3.5 h-3.5 ${rev.isLiked ? 'fill-blue-600' : ''}`} />
                  <span>도움이 돼요</span>
                  <span className="font-mono ml-1">{rev.likes}</span>
                </button>

                <Link
                  href="/"
                  className="text-xs text-zinc-400 hover:text-zinc-900 font-medium flex items-center gap-0.5"
                >
                  상품 보러가기 <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 이미지 확대 모달 */}
      {selectedReviewImage && (
        <div
          onClick={() => setSelectedReviewImage(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
        >
          <div className="relative max-w-2xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl p-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedReviewImage(null)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={selectedReviewImage}
              alt="확대 이미지"
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* 포토리뷰 작성 모달 */}
      {isWriteModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsWriteModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> 즉시 500P 적립
              </span>
              <h3 className="text-xl font-black text-zinc-950 mt-2">포토리뷰 작성하기</h3>
              <p className="text-xs text-zinc-400 mt-1">
                모자 착용 핏과 느낌을 다른 고객님들께 솔직하게 공유해 주세요!
              </p>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">구매 상품 선택</label>
                <select
                  value={writeProductName}
                  onChange={(e) => setWriteProductName(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none font-bold"
                >
                  <option value="시그니처 딥핏 코튼 무지 볼캡">시그니처 딥핏 코튼 무지 볼캡</option>
                  <option value="빅사이즈 대두 깊은 사계절 벙거지 버킷햇">빅사이즈 대두 깊은 사계절 벙거지 버킷햇</option>
                  <option value="빈티지 피그먼트 워싱 딥 볼캡">빈티지 피그먼트 워싱 딥 볼캡</option>
                  <option value="초경량 발수 나일론 캠프캡 5패널">초경량 발수 나일론 캠프캡 5패널</option>
                  <option value="골지 롱 와치캡 니트 숏비니">골지 롱 와치캡 니트 숏비니</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">별점 평가</label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setWriteRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-6 h-6 ${
                          star <= writeRating ? 'text-amber-400 fill-amber-400' : 'text-zinc-200'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-sm text-zinc-900 ml-2">{writeRating}점 만점</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">착용감 특징 태그</label>
                <input
                  type="text"
                  value={writeFitTag}
                  onChange={(e) => setWriteFitTag(e.target.value)}
                  placeholder="예: 깊이감 깊음 · 둘레 여유로움 · 대두추천"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">실착 사진 첨부</label>
                <div className="p-4 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl text-center space-y-2">
                  <UploadCloud className="w-8 h-8 text-zinc-400 mx-auto" />
                  <p className="text-[11px] text-zinc-500">실착 이미지를 업로드해 주세요 (PNG, JPG)</p>
                  <input
                    type="text"
                    value={writeImageUrl}
                    onChange={(e) => setWriteImageUrl(e.target.value)}
                    placeholder="이미지 URL 직접 입력 (기본 샘플 이미지 적용됨)"
                    className="w-full p-2 bg-white border border-zinc-200 rounded-xl text-[11px] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">상세 착용 후기 (최소 10자)</label>
                <textarea
                  rows={4}
                  value={writeContent}
                  onChange={(e) => setWriteContent(e.target.value)}
                  placeholder="깊이감, 둘레감, 원단 퀄리티, 실제 코디 느낌 등을 자세히 적어주시면 다른 분들께 큰 도움이 됩니다."
                  className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none leading-relaxed"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl transition shadow-md"
                >
                  포토리뷰 등록하고 500P 적립받기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
