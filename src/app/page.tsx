import React from 'react';
import MainHeroBanner from '@/components/home/MainHeroBanner';
import QuickCategories from '@/components/home/QuickCategories';
import BundleEventSection from '@/components/home/BundleEventSection';
import BestHatSection from '@/components/home/BestHatSection';
import CustomOrderBanner from '@/components/home/CustomOrderBanner';
import ReviewPreviewSection from '@/components/home/ReviewPreviewSection';

export default function HomePage() {
  return (
    <div className="flex flex-col w-full">
      {/* 1. 메인 비주얼 배너 슬라이더 */}
      <MainHeroBanner />

      {/* 2. 원형 퀵 카테고리 네비게이션 */}
      <QuickCategories />

      {/* 3. 1+1 기획전 번들 할인 섹션 */}
      <BundleEventSection />

      {/* 4. 베스트 모자 랭킹 (볼캡/버킷햇/비니/선바이저 탭 필터) */}
      <BestHatSection />

      {/* 5. 기업/단체 커스텀 자수 주문 배너 */}
      <CustomOrderBanner />

      {/* 6. 구매 확정 포토 리뷰 하이라이트 */}
      <ReviewPreviewSection />
    </div>
  );
}
