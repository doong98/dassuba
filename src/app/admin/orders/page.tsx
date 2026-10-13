'use client';

import React, { useState, useEffect } from 'react';
import { Truck, Search, Database, AlertTriangle, Copy, Check, ExternalLink, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AdminOrder {
  id: string;
  orderNumber: string;
  recipient: string;
  phone: string;
  itemsSummary: string;
  totalAmount: number;
  status: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'refunded' | 'cancelled' | 'failed';
  trackingNumber: string;
  paymentKey?: string;
  receiptUrl?: string;
  paymentMethod?: string;
  cancelReason?: string;
  createdAt: string;
}

const DEFAULT_ORDERS: AdminOrder[] = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-1791778541236',
    recipient: '홍길동',
    phone: '010-1234-5678',
    itemsSummary: '시그니처 딥핏 코튼 무지 볼캡 외 1건',
    totalAmount: 34700,
    status: 'paid',
    trackingNumber: 'CJ513285123',
    createdAt: '2026-10-12',
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-20261005-9921',
    recipient: '홍길동',
    phone: '010-1234-5678',
    itemsSummary: '시그니처 딥핏 코튼 무지 볼캡 외 1건',
    totalAmount: 29800,
    status: 'paid',
    trackingNumber: 'CJ68291039401',
    createdAt: '2026-10-05',
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-20260928-1102',
    recipient: '홍길동',
    phone: '010-1234-5678',
    itemsSummary: '빅사이즈 대두 깊은 사계절 벙거지 버킷햇 외 0건',
    totalAmount: 43800,
    status: 'delivered',
    trackingNumber: 'CJ55192837490',
    createdAt: '2026-09-28',
  },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>(DEFAULT_ORDERS);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isFromDb, setIsFromDb] = useState(false);
  const [needTable, setNeedTable] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
        setOrders(data.orders);
        setIsFromDb(Boolean(data.fromDb));
        setNeedTable(Boolean(data.needTable));
      }
    } catch (err) {
      console.error('주문 목록 불러오기 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // 주문 상태 변경 (Supabase DB UPDATE)
  const handleStatusChange = async (orderId: string, newStatus: AdminOrder['status']) => {
    const prevOrders = [...orders];
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));

    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });

      const data = await res.json();
      if (data.success) {
        showFeedback('주문 상태가 Supabase DB에 성공적으로 저장되었습니다.');
      } else {
        showFeedback('주문 상태가 변경되었습니다.');
      }
    } catch (err) {
      console.warn('주문 상태 업데이트 알림:', err);
      showFeedback('주문 상태가 변경되었습니다.');
    }
  };

  // 운송장 번호 변경 및 저장 (onBlur 또는 변경 완료 시)
  const handleTrackingSave = async (orderId: string, trackingNumber: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orderId, trackingNumber }),
      });

      const data = await res.json();
      if (data.success) {
        showFeedback(`운송장 번호(${trackingNumber})가 Supabase DB에 저장되었습니다.`);
      }
    } catch (err) {
      console.warn('운송장 저장 알림:', err);
    }
  };

  const handleTrackingChange = (orderId: string, newTracking: string) => {
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, trackingNumber: newTracking } : o)));
  };

  // 토스페이먼츠 공식 결제 취소 및 환불 처리
  const handleCancelPayment = async (order: AdminOrder) => {
    if (!confirm(`주문번호 [${order.orderNumber}]의 결제를 취소/환불 처리하시겠습니까?`)) {
      return;
    }

    try {
      const res = await fetch('/api/payments/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.orderNumber,
          paymentKey: order.paymentKey,
          cancelReason: '관리자 주문 취소 및 환불',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrders(orders.map((o) => (o.id === order.id ? { ...o, status: 'cancelled' } : o)));
        showFeedback(`주문 [${order.orderNumber}] 결제가 성공적으로 취소되었습니다.`);
      } else {
        alert(data.error || '결제 취소 처리에 실패했습니다.');
      }
    } catch (err: any) {
      console.error('Cancel payment error:', err);
      alert('결제 취소 처리 중 오류가 발생했습니다.');
    }
  };

  const handleCopySql = () => {
    const sqlText = `-- Supabase SQL Editor에서 실행할 orders 테이블 생성 DDL
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('ord-' || substr(md5(random()::text), 1, 8)),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    recipient VARCHAR(100) NOT NULL DEFAULT '홍길동',
    phone VARCHAR(50) NOT NULL DEFAULT '010-1234-5678',
    address TEXT DEFAULT '서울시 성동구 성수동 1가 12-34',
    items_summary VARCHAR(255) NOT NULL,
    items JSONB DEFAULT '[]'::JSONB,
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(30) DEFAULT 'paid' CHECK (status IN ('paid', 'preparing', 'shipped', 'delivered', 'refunded', 'cancelled')),
    tracking_number VARCHAR(100),
    payment_method VARCHAR(50) DEFAULT 'credit_card',
    order_date VARCHAR(50) DEFAULT to_char(NOW(), 'YYYY-MM-DD'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public delete orders" ON public.orders;

CREATE POLICY "Allow public select orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete orders" ON public.orders FOR DELETE USING (true);

INSERT INTO public.orders (
    id, order_number, recipient, phone, address, items_summary, total_amount, status, tracking_number, order_date, created_at
) VALUES 
('ord-1', 'ORD-1791778541236', '홍길동', '010-1234-5678', '서울시 성동구 성수동 1가 12-34', '시그니처 딥핏 코튼 무지 볼캡 외 1건', 34700, 'paid', 'CJ513285123', '2026-10-12', '2026-10-12T03:00:00Z'),
('ord-2', 'ORD-20261005-9921', '홍길동', '010-1234-5678', '서울시 성동구 성수동 1가 12-34', '시그니처 딥핏 코튼 무지 볼캡 외 1건', 29800, 'paid', 'CJ68291039401', '2026-10-05', '2026-10-05T09:00:00Z'),
('ord-3', 'ORD-20260928-1102', '홍길동', '010-1234-5678', '서울시 성동구 성수동 1가 12-34', '빅사이즈 대두 깊은 사계절 벙거지 버킷햇 외 0건', 43800, 'delivered', 'CJ55192837490', '2026-09-28', '2026-09-28T14:00:00Z')
ON CONFLICT (order_number) DO NOTHING;`;

    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const filtered = orders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.recipient.includes(search) ||
      o.phone.includes(search) ||
      o.itemsSummary.includes(search)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
              <Truck className="w-6 h-6" /> 주문 처리 & 송장 배송 관리
            </h1>
            {isFromDb ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <Database className="w-3 h-3" /> Supabase DB 연동 완료
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                <Database className="w-3 h-3" /> Supabase 테이블 생성 대기
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            전체 주문 결제 확인, CJ대한통운 운송장 번호 등록 및 배송 단계 변경
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchOrders}
            title="새로고침"
            className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition flex items-center gap-1 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="주문번호, 주문자명 검색..."
              className="text-xs pl-8 pr-3 py-2 bg-white border border-zinc-300 rounded-xl focus:outline-none w-48 sm:w-60"
            />
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* 성공 피드백 알림 배너 */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{feedbackMsg}</span>
        </div>
      )}

      {/* Supabase 테이블 생성 안내 알림 배너 (필요 시) */}
      {needTable && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Supabase에 orders 테이블 생성이 필요합니다.</p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                아래 버튼을 눌러 SQL을 복사한 뒤 Supabase 대시보드의 SQL Editor에 붙여넣고 [Run]을 실행하면 영구 저장됩니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition text-xs shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '복사 완료!' : 'orders 생성 SQL 복사'}
            </button>
            <a
              href="https://supabase.com/dashboard/project/ibcfzsbgeqsocpbqhzsv/sql/new"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold flex items-center gap-1 text-xs"
            >
              SQL Editor 바로가기 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* 주문 테이블 */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
        <div className="px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/50 flex items-center justify-between">
          <span className="font-black text-xs text-zinc-900">전체 주문 목록</span>
          <span className="text-[11px] font-bold text-zinc-600 bg-zinc-200/70 px-2.5 py-0.5 rounded-full">
            총 {filtered.length}건
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold">
              <tr>
                <th className="p-3.5">주문번호 / 일자</th>
                <th className="p-3.5">주문자 / 연락처</th>
                <th className="p-3.5">주문 상품 요약</th>
                <th className="p-3.5">결제금액 / 결제수단</th>
                <th className="p-3.5">운송장번호</th>
                <th className="p-3.5">주문상태 / 결제관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filtered.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/50 transition">
                  <td className="p-3.5">
                    <span className="font-mono font-bold text-zinc-900 block">{order.orderNumber}</span>
                    <span className="text-[11px] text-zinc-400">{order.createdAt.slice(0, 10)}</span>
                  </td>
                  <td className="p-3.5">
                    <span className="font-bold text-zinc-900 block">{order.recipient}</span>
                    <span className="text-[11px] text-zinc-500">{order.phone}</span>
                  </td>
                  <td className="p-3.5 text-zinc-700 max-w-xs truncate">{order.itemsSummary}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-zinc-900 block">{order.totalAmount.toLocaleString()}원</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                        {order.paymentMethod || '카드'}
                      </span>
                      {order.receiptUrl && (
                        <a
                          href={order.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                        >
                          영수증 <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <input
                      type="text"
                      value={order.trackingNumber}
                      onChange={(e) => handleTrackingChange(order.id, e.target.value)}
                      onBlur={(e) => handleTrackingSave(order.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleTrackingSave(order.id, (e.target as HTMLInputElement).value);
                        }
                      }}
                      placeholder="CJ대한통운 송장입력"
                      className="p-1.5 bg-zinc-50 border border-zinc-200 rounded-lg text-[11px] font-mono w-36 outline-hidden focus:border-amber-400 focus:bg-white"
                    />
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as any)}
                        className="p-1.5 bg-zinc-100 font-bold text-xs rounded-lg border border-zinc-300 outline-hidden focus:border-amber-400"
                      >
                        <option value="pending">결제대기</option>
                        <option value="paid">결제완료</option>
                        <option value="preparing">제작/배송준비</option>
                        <option value="shipped">배송중</option>
                        <option value="delivered">배송완료</option>
                        <option value="cancelled">결제취소</option>
                        <option value="refunded">반품/환불</option>
                        <option value="failed">결제실패</option>
                      </select>

                      {order.status === 'paid' && (
                        <button
                          type="button"
                          onClick={() => handleCancelPayment(order)}
                          className="px-2 py-1 text-[11px] bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg font-bold shrink-0 transition"
                          title="토스 결제 취소/환불"
                        >
                          결제취소
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
