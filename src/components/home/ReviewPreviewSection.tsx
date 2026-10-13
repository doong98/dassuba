'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Camera, ArrowRight } from 'lucide-react';

const REVIEWS = [
  {
    id: 1,
    title: '시그니처 딥핏 코튼 무지 볼캡',
    author: 'park***',
    date: '2026.03.28',
    rating: 5,
    comment: '얼굴이 진짜 작아보여요! 다른 볼캡들은 깊이가 얕아서 붕 뜨는데 이건 푹 감싸줘서 너무 만족스럽습니다. 1+1으로 차콜이랑 블랙 샀어요.',
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80',
    tag: '포토리뷰 +1,500P',
  },
  {
    id: 2,
    title: '빅사이즈 대두 깊은 사계절 벙거지 버킷햇',
    author: 'kim_cap***',
    date: '2026.03.26',
    rating: 5,
    comment: '군모 60호 이상 머리 큰 사람이라 맞는 버킷햇이 없었는데 XL 사이즈 대박입니다. 챙 각도도 자연스럽고 원단도 짱짱해요.',
    image: 'https://images.unsplash.com/photo-1576871337632-b9aef4c17ab9?auto=format&fit=crop&w=400&q=80',
    tag: '포토리뷰 +1,500P',
  },
  {
    id: 3,
    title: '빈티지 피그먼트 워싱 로우 볼캡',
    author: 'lee_ss***',
    date: '2026.03.24',
    rating: 5,
    comment: '워싱 색감이 실물이 훨씬 고급스럽네요. 스트릿 무드 코디에 완전 찰떡이고 뒤 스트랩 조절도 편합니다.',
    image: 'https://images.unsplash.com/photo-1521369909029-2afed882baee?auto=format&fit=crop&w=400&q=80',
    tag: '포토리뷰 +1,500P',
  },
  {
    id: 4,
    title: '데일리 소프트 골지 숏비니',
    author: 'choi***',
    date: '2026.03.20',
    rating: 5,
    comment: '원단이 부드러워서 이마 가려움 전혀 없어요! 숏한 기장감 덕분에 스타일 내기 좋습니다.',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=400&q=80',
    tag: '포토리뷰 +1,500P',
  },
];

export default function ReviewPreviewSection() {
  return (
    <section className="py-12 sm:py-16 bg-zinc-50 border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase mb-2">
              <Camera className="w-3.5 h-3.5" /> REAL PHOTO REVIEW
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
              고객님들이 증명하는 <span className="text-emerald-600">솔직 착용 후기</span>
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              포토 리뷰 작성 시 즉시 사용 가능한 1,500P 적립금을 지급해 드립니다.
            </p>
          </div>

          <Link
            href="/community/reviews"
            className="inline-flex items-center gap-1 text-sm font-bold text-zinc-900 hover:text-emerald-600 transition"
          >
            리뷰 전체보기 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {REVIEWS.map((rev) => (
            <div
              key={rev.id}
              className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-4/3 rounded-xl overflow-hidden mb-3 bg-zinc-100">
                  <img
                    src={rev.image}
                    alt={rev.title}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">
                    {rev.tag}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex text-amber-400">
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-zinc-400 text-[11px]">{rev.date}</span>
                </div>

                <h4 className="font-bold text-xs text-zinc-800 line-clamp-1 mb-1.5">
                  {rev.title}
                </h4>

                <p className="text-xs text-zinc-600 leading-relaxed line-clamp-3">
                  {rev.comment}
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-400">
                <span>작성자: {rev.author}</span>
                <span className="text-emerald-600 font-semibold">구매확정</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
