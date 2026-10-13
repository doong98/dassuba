'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, Mail, Clock, ShieldCheck, Truck, Sparkles, Headphones } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Footer() {
  const { user } = useAuth();
  return (
    <footer className="bg-zinc-950 text-zinc-400 text-xs border-t border-zinc-800 mt-20">
      {/* 1. 상단 고객 혜택 안내 바 */}
      <div className="border-b border-zinc-800/80 bg-zinc-900/60 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-zinc-200 text-sm">16시 이전 당일 발송</p>
              <p className="text-[11px] text-zinc-500">우체국/CJ대한통운 빠른 배송</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-zinc-200 text-sm">1+1 기획전 할인</p>
              <p className="text-[11px] text-zinc-500">원하는 조합으로 묶음 특가</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-blue-400 shrink-0">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-zinc-200 text-sm">단체 자수 1:1 전담</p>
              <p className="text-[11px] text-zinc-500">실시간 무료 3D 시안 제공</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-zinc-200 text-sm">안심 결제 보장</p>
              <p className="text-[11px] text-zinc-500">토스/포트원 에스크로 인증</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 푸터 메인 본문 (고객센터 + 정보) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-zinc-800">
          {/* 고객센터 안내 (MD 5칸) */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-black text-xl text-white tracking-tight">다써바 CS CENTER</span>
              <span className="text-[10px] bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                친절상담
              </span>
            </div>
            <div className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Phone className="w-5 h-5 text-amber-400" /> 02-1588-9999
            </div>
            <div className="space-y-1 text-zinc-400 text-xs">
              <p className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-zinc-500" /> 평일 09:30 - 17:30 (점심시간 12:30 - 13:30)
              </p>
              <p>주말 및 공휴일 휴무 (카카오톡 및 게시판 상담 상시 접수)</p>
              <p className="flex items-center gap-1.5 pt-1">
                <Mail className="w-3.5 h-3.5 text-zinc-500" /> 단체·제휴 문의: support@dasseoba-cap.com
              </p>
            </div>

            <div className="pt-2 flex flex-wrap gap-2">
              <Link
                href="/community/cs"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-500 text-zinc-950 font-bold text-xs rounded transition"
              >
                고객센터 1:1상담 →
              </Link>
              <Link
                href="/community/qna"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded transition"
              >
                Q&A 질문게시판 →
              </Link>
              <Link
                href="/custom"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs rounded transition"
              >
                단체자수 견적 →
              </Link>
            </div>
          </div>

          {/* 은행 계좌 정보 (MD 3칸) */}
          <div className="md:col-span-3 space-y-2">
            <h4 className="font-bold text-zinc-200 text-sm">BANKING INFO</h4>
            <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800/80 space-y-1 text-xs">
              <p className="font-semibold text-zinc-300">기업은행 010-1588-9999</p>
              <p className="text-zinc-400">예금주: 주식회사 다써바커머스</p>
              <p className="text-[11px] text-zinc-500 pt-1">입금자명 불일치 시 자동 입금확인이 지연될 수 있습니다.</p>
            </div>
          </div>

          {/* 빠른 링크 (MD 4칸) */}
          <div className="md:col-span-4 space-y-2">
            <h4 className="font-bold text-zinc-200 text-sm">QUICK MENU</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link href="/about" className="hover:text-white transition">회사소개</Link>
              <Link href="/terms" className="hover:text-white transition">이용약관</Link>
              <Link href="/privacy" className="hover:text-white font-medium text-zinc-300 transition">개인정보처리방침</Link>
              <Link href="/mypage/orders" className="hover:text-white transition">배송조회</Link>
              <Link href="/community/qna" className="hover:text-white transition text-zinc-300">Q&A게시판</Link>
              <Link href="/community/cs" className="hover:text-amber-400 font-medium transition text-amber-300">고객센터(1:1)</Link>
              {user?.role === 'admin' && (
                <Link href="/admin" className="text-amber-400 hover:text-amber-300 font-semibold transition col-span-2">
                  관리자 페이지
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* 3. 하단 법적 사업자 정보 */}
        <div className="pt-6 space-y-2 text-[11px] text-zinc-500">
          <p>
            상호명: 주식회사 다써바커머스 | 대표자: 홍길동 | 사업자등록번호: 123-45-67890 | 통신판매업신고: 제2026-서울동대문-0123호
          </p>
          <p>
            사업장 소재지: 서울특별시 동대문구 모자패션로 42 다써바빌딩 5층 (자수 제작소 & 물류센터)
          </p>
          <p>
            개인정보관리책임자: 김모자 (privacy@dasseoba-cap.com) | 호스팅제공자: Vercel Inc. | DB: Supabase Cloud
          </p>
          <div className="flex flex-wrap items-center justify-between pt-4 text-zinc-500">
            <p>© 2026 DASSEOBA CAP COMMERCE. ALL RIGHTS RESERVED.</p>
            <p className="text-[10px]">토스페이먼츠 구매안전 에스크로 서비스 가입 사업장</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
