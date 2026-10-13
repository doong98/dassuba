'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { CheckCircle2, ArrowRight, Package, Home, ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react';

function OrderCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();

  const paymentKey = searchParams.get('paymentKey');
  const orderId = searchParams.get('orderId') || searchParams.get('orderNumber');
  const amount = searchParams.get('amount');

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    // 만약 토스 승인 파라미터가 있는 경우 서버 승인 API 호출
    if (paymentKey && orderId && amount) {
      let isMounted = true;

      const confirmPayment = async () => {
        try {
          const res = await fetch('/api/payments/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount: Number(amount),
            }),
          });

          const data = await res.json();

          if (!res.ok || !data.success) {
            if (isMounted) {
              setErrorMsg(data.error || '결제 승인 처리 중 오류가 발생했습니다.');
              setIsLoading(false);
            }
            return;
          }

          if (isMounted) {
            setReceiptUrl(data.receiptUrl);
            setOrderDetails(data.order);
            setIsLoading(false);
            // 승인 완료 시 장바구니 비우기
            clearCart();

            // 로컬스토리지 주문 내역 동기화
            try {
              const pendingOrderStr = sessionStorage.getItem('current_checkout_order');
              if (pendingOrderStr) {
                const pendingOrder = JSON.parse(pendingOrderStr);
                const completeOrder = {
                  ...pendingOrder,
                  id: data.order?.id || `ord-${Date.now()}`,
                  status: 'paid',
                  paymentKey,
                  receiptUrl: data.receiptUrl,
                  approvedAt: data.approvedAt,
                  trackingNumber: data.order?.tracking_number || `CJ${Math.floor(100000000 + Math.random() * 900000000)}`,
                };
                const existingOrders = JSON.parse(localStorage.getItem('dasseoba_orders') || '[]');
                localStorage.setItem('dasseoba_orders', JSON.stringify([completeOrder, ...existingOrders]));
                sessionStorage.removeItem('current_checkout_order');
              }
            } catch (storageErr) {
              console.warn('Local storage sync notice:', storageErr);
            }
          }
        } catch (err: any) {
          if (isMounted) {
            setErrorMsg(err.message || '네트워크 오류로 결제 승인을 확인하지 못했습니다.');
            setIsLoading(false);
          }
        }
      };

      confirmPayment();

      return () => {
        isMounted = false;
      };
    } else {
      // 파라미터 없이 직접 접근했거나 기존 mock 주문
      setIsLoading(false);
    }
  }, [paymentKey, orderId, amount, clearCart]);

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-12 border border-zinc-200 shadow-xl text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <h2 className="text-xl font-black text-zinc-900">토스페이먼츠 결제 승인 확인 중</h2>
        <p className="text-xs text-zinc-500">
          토스페이먼츠 보안 서버와 통신하여 결제 승인과 금액을 검증하고 있습니다. 잠시만 기다려 주세요...
        </p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-red-200 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50/50">
          <AlertTriangle className="w-10 h-10" />
        </div>
        <div>
          <span className="text-xs bg-red-100 text-red-700 font-bold px-3 py-1 rounded-full uppercase">
            결제 승인 오류
          </span>
          <h1 className="text-2xl font-black text-zinc-950 mt-3">결제 처리에 실패하였습니다</h1>
          <p className="text-xs text-zinc-500 mt-2">{errorMsg}</p>
        </div>

        <div className="flex gap-3 pt-4">
          <Link
            href="/cart"
            className="flex-1 py-3.5 px-4 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-bold text-xs"
          >
            장바구니로 돌아가기
          </Link>
          <Link
            href="/checkout"
            className="flex-1 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            다시 결제 시도
          </Link>
        </div>
      </div>
    );
  }

  const finalOrderNumber = orderId || 'ORD-20261012-001';
  const finalAmount = amount ? parseInt(amount).toLocaleString() : '29,800';

  return (
    <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-12 border border-zinc-200 shadow-xl text-center space-y-6">
      <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
        <CheckCircle2 className="w-10 h-10" />
      </div>

      <div>
        <div className="inline-flex items-center gap-1.5 text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5" /> 토스페이먼츠 결제 승인 완료
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 mt-3 tracking-tight">
          주문이 정상적으로 완료되었습니다!
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 mt-2">
          고객님의 결제가 안전하게 승인되었으며, 물류센터에서 오늘 즉시 출고 준비됩니다.
        </p>
      </div>

      <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-200 text-left space-y-2.5 text-xs">
        <div className="flex justify-between py-1 border-b border-zinc-200/60">
          <span className="text-zinc-500 font-medium">주문 번호</span>
          <span className="font-mono font-bold text-zinc-900">{finalOrderNumber}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-zinc-200/60">
          <span className="text-zinc-500 font-medium">최종 결제 금액</span>
          <span className="font-bold text-zinc-950 text-sm">{finalAmount}원</span>
        </div>
        <div className="flex justify-between py-1 border-b border-zinc-200/60">
          <span className="text-zinc-500 font-medium">주문 상태</span>
          <span className="font-bold text-blue-600">결제완료 (배송 준비 중)</span>
        </div>
        {receiptUrl && (
          <div className="flex justify-between py-1 items-center">
            <span className="text-zinc-500 font-medium">카드 매출전표</span>
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-bold hover:underline flex items-center gap-1 text-[11px]"
            >
              영수증 보기 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2">
        <Link
          href="/mypage/orders"
          className="py-3.5 px-4 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-bold text-xs flex items-center justify-center gap-1.5 transition"
        >
          <Package className="w-4 h-4" /> 주문내역 확인
        </Link>
        <Link
          href="/"
          className="py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md"
        >
          <Home className="w-4 h-4" /> 쇼핑 계속하기
        </Link>
      </div>
    </div>
  );
}

export default function OrderCompletePage() {
  return (
    <div className="min-h-screen bg-zinc-50 py-16 px-4 flex items-center justify-center">
      <Suspense fallback={<div className="text-center py-20 text-xs text-zinc-400">주문 완료 정보 로딩 중...</div>}>
        <OrderCompleteContent />
      </Suspense>
    </div>
  );
}
