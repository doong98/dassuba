'use client';

import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Package,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  Truck,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';

export default function AdminDashboardPage() {
  const { products } = useProducts();
  const lowStockMaterials = [
    { name: '일본 타지마 고광택 자수사 (금사)', code: 'MAT-EMB-05', current: 15, safety: 20 },
    { name: '14수 고밀도 코튼 원단 (블랙)', code: 'MAT-COT-01', current: 42, safety: 50 },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
            운영 대시보드
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            실시간 판매 매출, 주문 처리 현황 및 원부자재 안전재고 모니터링
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            + 새 모자 상품 등록
          </Link>
          <Link
            href="/admin/materials"
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-xl shadow-xs transition"
          >
            자재 긴급 발주
          </Link>
        </div>
      </div>

      {/* 4대 주요 지표 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>오늘의 총 매출</span>
            <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-zinc-950">
            3,842,000원
          </div>
          <p className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5">
            <ArrowUpRight className="w-3.5 h-3.5" /> 전일 대비 +18.4%
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>주문 처리율</span>
            <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-zinc-950">
            96.8%
          </div>
          <p className="text-[11px] text-zinc-500">
            당일 출고 대상 48건 중 46건 완료
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>배송 대기 주문</span>
            <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-600">
            12건
          </div>
          <p className="text-[11px] text-zinc-500">
            자수 제작 중: 5건 | 완제품 검수: 7건
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>원부자재 위험 알림</span>
            <span className="p-1.5 bg-red-50 text-red-600 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-red-600">
            2건
          </div>
          <p className="text-[11px] text-red-500 font-bold">
            안전재고 미달 품목 발생
          </p>
        </div>
      </div>

      {/* 2열 레이아웃: 원자재 부족 경고 & 실시간 판매 상품 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 원부자재 안전재고 부족 알림 (6칸) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
            <h2 className="font-black text-sm text-zinc-950 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" /> 생산 원부자재 재고 주의 품목
            </h2>
            <Link href="/admin/materials" className="text-xs text-zinc-500 hover:text-zinc-900 font-bold">
              발주관리 →
            </Link>
          </div>

          <div className="space-y-3">
            {lowStockMaterials.map((mat) => (
              <div key={mat.code} className="p-3 bg-red-50/60 rounded-xl border border-red-200/80 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-red-950">{mat.name}</p>
                  <p className="text-[11px] text-red-600 font-mono mt-0.5">{mat.code}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-red-600 block">
                    현재 {mat.current} / 안전 {mat.safety}
                  </span>
                  <Link
                    href="/admin/materials"
                    className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded font-bold hover:bg-red-700 mt-1 inline-block"
                  >
                    즉시 발주서 생성
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 품절 임박 모자 상품 현황 (6칸) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
            <h2 className="font-black text-sm text-zinc-950 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" /> 완제품 품절 임박 리스트
            </h2>
            <Link href="/admin/products" className="text-xs text-zinc-500 hover:text-zinc-900 font-bold">
              상품수정 →
            </Link>
          </div>

          <div className="space-y-3">
            {products.slice(0, 3).map((prod) => (
              <div key={prod.id} className="flex items-center justify-between p-2.5 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                <div className="flex items-center gap-3">
                  <img src={prod.images[0]} alt="" className="w-10 h-10 rounded-lg object-cover bg-white" />
                  <div>
                    <p className="font-bold text-zinc-900 line-clamp-1">{prod.title}</p>
                    <p className="text-[11px] text-zinc-400">{prod.price.toLocaleString()}원</p>
                  </div>
                </div>
                <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                  잔여 재고: 14개
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
