'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, RefreshCw, ShoppingCart, HelpCircle } from 'lucide-react';

function OrderFailContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || 'PAYMENT_FAILED';
  const message = searchParams.get('message') || '결제 진행 중 오류가 발생했습니다.';
  const orderId = searchParams.get('orderId');

  // 사용자 친화적인 메시지 해석
  let friendlyReason = message;
  if (code === 'PAY_PROCESS_CANCELED') {
    friendlyReason = '고객님께서 결제창에서 결제를 취소하셨습니다.';
  } else if (code === 'REJECT_CARD_COMPANY') {
    friendlyReason = '카드사 심사 거절 또는 한도 초과 등으로 승인이 거절되었습니다.';
  } else if (code === 'INVALID_CARD_NUMBER') {
    friendlyReason = '유효하지 않은 카드 번호입니다.';
  } else if (code === 'NOT_SUPPORTED_METHOD') {
    friendlyReason = '지원되지 않는 결제 수단입니다.';
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-zinc-200 shadow-xl text-center space-y-6">
      <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-50/50">
        <AlertCircle className="w-10 h-10" />
      </div>

      <div>
        <span className="text-xs bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-full uppercase">
          결제 취소 / 실패
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-3 tracking-tight">
          결제가 완료되지 않았습니다
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-2">
          선택하신 결제 수단 승인이 중단되었거나 오류가 발생하였습니다.
        </p>
      </div>

      <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 text-left space-y-2.5 text-xs">
        <div className="flex justify-between py-1 border-b border-zinc-200/60">
          <span className="text-zinc-500 font-medium">오류 원인</span>
          <span className="font-bold text-rose-600">{friendlyReason}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-zinc-200/60">
          <span className="text-zinc-500 font-medium">에러 코드</span>
          <span className="font-mono font-bold text-zinc-700">{code}</span>
        </div>
        {orderId && (
          <div className="flex justify-between py-1">
            <span className="text-zinc-500 font-medium">주문 번호</span>
            <span className="font-mono font-bold text-zinc-700">{orderId}</span>
          </div>
        )}
      </div>

      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-left text-xs text-amber-900 space-y-1">
        <p className="font-bold flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" /> 문제 해결 팁:
        </p>
        <p>• 카드 한도나 유효기간을 확인하시거나 다른 결제 수단(간편결제 등)을 이용해 보세요.</p>
        <p>• 장바구니에 담긴 상품은 그대로 보존되어 있습니다.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/cart"
          className="py-3.5 px-4 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
        >
          <ShoppingCart className="w-4 h-4" /> 장바구니 확인
        </Link>
        <Link
          href="/checkout"
          className="py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md"
        >
          <RefreshCw className="w-4 h-4" /> 다시 결제하기
        </Link>
      </div>
    </div>
  );
}

export default function OrderFailPage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-16 px-4 flex items-center justify-center">
      <Suspense fallback={<div className="text-center py-20 text-xs text-zinc-400">결제 실패 정보 로딩 중...</div>}>
        <OrderFailContent />
      </Suspense>
    </div>
  );
}
