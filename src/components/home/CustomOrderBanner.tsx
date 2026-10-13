'use client';

import React from 'react';
import Link from 'next/link';
import { Scissors, CheckCircle2, ArrowRight, ShieldCheck, Clock, Users } from 'lucide-react';

export default function CustomOrderBanner() {
  const steps = [
    { num: '01', title: '모자 종류 선택', desc: '볼캡, 버킷햇, 비니 등 베이스 모자 선택' },
    { num: '02', title: '로고/자수안 업로드', desc: 'AI/PDF/이미지 파일 등록 또는 텍스트 입력' },
    { num: '03', title: '무료 3D 시안 확인', desc: '전문 디자이너의 자수 위치·크기 렌더링 확인' },
    { num: '04', title: '초고속 정밀 자수 생산', desc: '최신 컴퓨터 자수기로 오차 없는 단체 납품' },
  ];

  return (
    <section className="py-12 sm:py-16 bg-zinc-950 text-white relative overflow-hidden">
      {/* 백그라운드 디자인 패턴 */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* 좌측 안내 텍스트 */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-bold uppercase">
              <Scissors className="w-3.5 h-3.5" /> B2B & CUSTOM EMBROIDERY
            </div>

            <h3 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              기업·동호회·팀 모자 <br />
              <span className="text-amber-400">나만의 커스텀 자수</span> 제작
            </h3>

            <p className="text-sm text-zinc-300 leading-relaxed">
              1개 샘플 제작부터 10,000개 대량 발주까지! 다써바 직영 자수 공장에서 합리적인 단가와 완벽한 품질로 제작해 드립니다.
            </p>

            {/* 주요 특장점 */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>평면 일반 자수 / 3D 입체 볼륨 자수 / 패치 오바로크 가능</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>신청 후 24시간 이내 무료 디지털 3D 시안 제공</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>수량별 최대 40% 추가 할인 및 사업자 세금계산서 100% 발행</span>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-3">
              <Link
                href="/custom"
                className="px-6 py-3 rounded-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-sm flex items-center gap-2 shadow-lg transition"
              >
                <span>견적 문의 및 시안 신청</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/custom/portfolio"
                className="px-5 py-3 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm transition"
              >
                제작 포트폴리오 보기
              </Link>
            </div>
          </div>

          {/* 우측 4단계 프로세스 카드 */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {steps.map((st) => (
                <div
                  key={st.num}
                  className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 hover:border-amber-400/50 transition-colors"
                >
                  <div className="text-amber-400 font-black text-xl mb-1">{st.num}</div>
                  <h4 className="font-bold text-white text-base mb-1">{st.title}</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{st.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
