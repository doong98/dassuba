'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight, Pause, Play } from 'lucide-react';
import { HERO_SLIDES } from '@/lib/data/mockData';

export default function MainHeroBanner() {
  const totalSlides = HERO_SLIDES.length;

  // 무한 루프(Infinite Loop)를 위해 앞뒤로 클론(복제) 슬라이드를 추가: [3(복제), 1, 2, 3, 1(복제)]
  const extendedSlides = [
    { ...HERO_SLIDES[totalSlides - 1], cloneId: 'clone-last' },
    ...HERO_SLIDES,
    { ...HERO_SLIDES[0], cloneId: 'clone-first' },
  ];

  // 인덱스 1이 실제 1번 슬라이드
  const [currentIndex, setCurrentIndex] = useState(1);
  const [withTransition, setWithTransition] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const isTransitioningRef = useRef(false);

  // 현재 사용자에게 보이는 실제 슬라이드 번호 (0, 1, 2 -> 1번, 2번, 3번)
  const activeIndicatorIndex = (currentIndex - 1 + totalSlides) % totalSlides;

  // 오른쪽에서 왼쪽으로 자동 롤링 (5초 주기 무한 루프)
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(timer);
  }, [isPaused, currentIndex]);

  const handleNext = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setCurrentIndex((prev) => prev + 1);
  };

  const handlePrev = () => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setCurrentIndex((prev) => prev - 1);
  };

  // 트랜지션 애니메이션 완료 후 무한 루프 처리 (순간 점프)
  const handleTransitionEnd = () => {
    isTransitioningRef.current = false;

    // 마지막 복제본(1번 복제본, 인덱스 4)에 도달한 경우 -> 실제 1번(인덱스 1)으로 트랜지션 없이 순간 이동
    if (currentIndex >= extendedSlides.length - 1) {
      setWithTransition(false);
      setCurrentIndex(1);
    }
    // 첫 번째 복제본(3번 복제본, 인덱스 0)에 도달한 경우 -> 실제 3번(인덱스 3)으로 트랜지션 없이 순간 이동
    else if (currentIndex <= 0) {
      setWithTransition(false);
      setCurrentIndex(totalSlides);
    }
  };

  // 트랜지션이 꺼진 직후 다시 트랜지션을 활성화하기 위한 동기화
  useEffect(() => {
    if (!withTransition) {
      const timer = setTimeout(() => {
        setWithTransition(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [withTransition]);

  const handleIndicatorClick = (targetIndex: number) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setWithTransition(true);
    setCurrentIndex(targetIndex + 1);
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-zinc-950 text-white select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      aria-label="메인 비주얼 배너"
    >
      {/* 가로 무한 루프 슬라이딩 트랙: 항상 오른쪽에서 왼쪽으로 1 -> 2 -> 3 -> 1 -> 2 -> 3 부드럽게 이동 */}
      <div
        className={`flex w-full ${withTransition ? 'transition-transform duration-700 ease-in-out' : ''}`}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedSlides.map((slide, index) => (
          <div
            key={`slide-${index}`}
            className="w-full min-w-full shrink-0 relative h-[380px] sm:h-[460px] md:h-[520px] lg:h-[580px] flex items-center overflow-hidden"
          >
            {/* 배경 이미지 레이어 */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              {/* 텍스트 가독성을 위한 프리미엄 그라데이션 오버레이 */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
            </div>

            {/* 텍스트 콘텐츠 (문구는 그대로 유지) */}
            <div className="relative max-w-7xl mx-auto w-full h-full px-6 sm:px-12 flex flex-col justify-center z-10">
              <div className="max-w-xl space-y-3 sm:space-y-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-zinc-950 text-xs font-black uppercase tracking-wider shadow-md">
                  <Sparkles className="w-3.5 h-3.5" />
                  {slide.badge}
                </span>

                <h2 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight text-white drop-shadow-md">
                  {slide.title}
                </h2>

                <p className="text-base sm:text-xl font-bold text-amber-300">
                  {slide.subtitle}
                </p>

                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed hidden sm:block">
                  {slide.description}
                </p>

                <div className="pt-2 sm:pt-4">
                  <Link
                    href={slide.link}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-amber-400 text-zinc-950 font-extrabold text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:gap-3"
                  >
                    <span>컬렉션 보러가기</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 좌측 이전 버튼 */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition shadow-lg hover:scale-105 active:scale-95"
        aria-label="이전 슬라이드"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* 우측 다음 버튼 */}
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition shadow-lg hover:scale-105 active:scale-95"
        aria-label="다음 슬라이드"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* 하단 컨트롤 바 (인디케이터 & 일시정지) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/50 px-4 py-2 rounded-full backdrop-blur-xs border border-white/10 shadow-lg">
        {/* 인디케이터 점: 1, 2, 3 정확하게 반영 */}
        <div className="flex items-center gap-1.5">
          {HERO_SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleIndicatorClick(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeIndicatorIndex ? 'w-6 bg-amber-400' : 'w-2 bg-white/50 hover:bg-white'
              }`}
              aria-label={`슬라이드 ${idx + 1}번으로 이동`}
            />
          ))}
        </div>

        {/* 페이지 번호: 1 / 3, 2 / 3, 3 / 3 */}
        <span className="text-[11px] text-zinc-300 font-mono tracking-wider">
          {activeIndicatorIndex + 1} / {totalSlides}
        </span>

        {/* 자동 재생/일시정지 토글 */}
        <button
          onClick={() => setIsPaused(!isPaused)}
          className="text-zinc-400 hover:text-white p-0.5 transition"
          aria-label={isPaused ? '자동 롤링 재생' : '자동 롤링 일시정지'}
        >
          {isPaused ? <Play className="w-3 h-3 fill-current" /> : <Pause className="w-3 h-3 fill-current" />}
        </button>
      </div>
    </section>
  );
}
