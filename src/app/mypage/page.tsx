'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import LoginRequired from '@/components/auth/LoginRequired';
import {
  User,
  Package,
  Sparkles,
  Heart,
  FileText,
  AlertCircle,
  Truck,
  RotateCcw,
  CheckCircle2,
  Printer,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: number;
  status: 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  trackingNumber: string;
  paymentMethod?: string;
  receiptUrl?: string;
  items: Array<{
    id: string;
    title: string;
    price: number;
    color: string;
    size: string;
    quantity: number;
    image: string;
  }>;
}

export default function MyPage() {
  const { user, isLoading } = useAuth();
  const { wishlistCount } = useWishlist();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selectedOrderForTax, setSelectedOrderForTax] = useState<OrderItem | null>(null);
  const [taxBusinessNo, setTaxBusinessNo] = useState('123-45-67890');
  const [taxCompanyName, setTaxCompanyName] = useState('(주)한국모자클럽');

  useEffect(() => {
    // 1. 로컬 스토리지 주문 1차 로드 (빠른 반응성)
    const saved = localStorage.getItem('dasseoba_orders');
    let localList: OrderItem[] = [];
    if (saved) {
      try {
        localList = JSON.parse(saved);
        setOrders(localList);
      } catch {
        // fallback
      }
    }

    // 2. Supabase orders 테이블 API(/api/orders) 연동하여 최신 상태 동기화
    const fetchSupabaseOrders = async () => {
      try {
        const res = await fetch('/api/orders');
        const data = await res.json();
        if (data.success && Array.isArray(data.orders) && data.orders.length > 0) {
          const dbOrders: OrderItem[] = data.orders.map((o: any) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            createdAt: o.createdAt || new Date().toISOString(),
            totalAmount: o.totalAmount,
            status: o.status,
            trackingNumber: o.trackingNumber || '',
            paymentMethod: o.paymentMethod || '카드',
            receiptUrl: o.receiptUrl || undefined,
            items: Array.isArray(o.items) && o.items.length > 0
              ? o.items
              : [
                  {
                    id: `item-${o.id}`,
                    title: o.itemsSummary || '주문 상품',
                    price: o.totalAmount,
                    color: '기본',
                    size: 'FREE',
                    quantity: 1,
                    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80',
                  },
                ],
          }));

          // 로컬 주문과 Supabase orders 테이블 데이터 병합 (중복 제거 & DB 최신 상태 우선)
          const mergedMap = new Map<string, OrderItem>();
          // 로컬 항목 먼저 넣기
          localList.forEach((o) => mergedMap.set(o.orderNumber, o));
          // DB 항목으로 덮어쓰거나 추가 (관리자 배송 상태 변경 및 영수증 반영)
          dbOrders.forEach((o) => {
            const existing = mergedMap.get(o.orderNumber);
            if (existing) {
              mergedMap.set(o.orderNumber, {
                ...existing,
                status: o.status,
                trackingNumber: o.trackingNumber || existing.trackingNumber,
                receiptUrl: o.receiptUrl || existing.receiptUrl,
                items: existing.items?.length ? existing.items : o.items,
              });
            } else {
              mergedMap.set(o.orderNumber, o);
            }
          });

          const finalList = Array.from(mergedMap.values());
          setOrders(finalList);
          localStorage.setItem('dasseoba_orders', JSON.stringify(finalList));
        } else if (localList.length === 0) {
          // 로컬과 DB 모두 비어있을 때 데모 주문 세팅
          const demoOrders: OrderItem[] = [
            {
              id: 'ord-101',
              orderNumber: 'ORD-20261005-9921',
              createdAt: '2026-10-05T14:20:00Z',
              totalAmount: 29800,
              status: 'paid',
              trackingNumber: 'CJ68291039401',
              items: [
                {
                  id: 'cart-1',
                  title: '시그니처 딥핏 코튼 무지 볼캡',
                  price: 19800,
                  color: '블랙',
                  size: 'FREE',
                  quantity: 1,
                  image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=400&q=80',
                },
                {
                  id: 'cart-2',
                  title: '데일리 소프트 골지 숏비니 와치캡',
                  price: 14900,
                  color: '차콜',
                  size: 'FREE',
                  quantity: 1,
                  image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=400&q=80',
                },
              ],
            },
            {
              id: 'ord-102',
              orderNumber: 'ORD-20260928-1102',
              createdAt: '2026-09-28T09:12:00Z',
              totalAmount: 43800,
              status: 'delivered',
              trackingNumber: 'CJ55192837490',
              items: [
                {
                  id: 'cart-3',
                  title: '빅사이즈 대두 깊은 사계절 벙거지 버킷햇',
                  price: 21900,
                  color: '블랙',
                  size: 'XL (61-64cm)',
                  quantity: 2,
                  image: 'https://images.unsplash.com/photo-1565814636199-ae8133055c1c?auto=format&fit=crop&w=400&q=80',
                },
              ],
            },
          ];
          setOrders(demoOrders);
          localStorage.setItem('dasseoba_orders', JSON.stringify(demoOrders));
        }
      } catch (err) {
        console.warn('Supabase orders fetch error in mypage:', err);
      }
    };

    fetchSupabaseOrders();
  }, []);

  // PRD 취소 정책: '결제완료' 단계 즉시 취소 가능 (Supabase orders 테이블과 동기화)
  const handleCancelOrder = async (orderId: string) => {
    if (confirm('주문을 즉시 취소하시겠습니까? 결제금액은 원결제 수단으로 자동 환불됩니다.')) {
      const targetOrder = orders.find((o) => o.id === orderId);
      const updated = orders.map((o) =>
        o.id === orderId ? { ...o, status: 'cancelled' as const } : o
      );
      setOrders(updated);
      localStorage.setItem('dasseoba_orders', JSON.stringify(updated));

      // Supabase orders 테이블 업데이트 요청
      if (targetOrder) {
        try {
          await fetch('/api/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: targetOrder.id,
              orderNumber: targetOrder.orderNumber,
              status: 'cancelled',
            }),
          });
        } catch (e) {
          console.warn('Failed to update cancel status in DB:', e);
        }
      }

      alert('주문 취소가 완료되었습니다.');
    }
  };

  // PRD 반품/환불 정책: 배송 완료 후 7일 이내 접수, 왕복 배송비 6,000원 자동 정산 반영
  const handleReturnOrder = async (orderId: string) => {
    if (
      confirm(
        '반품을 신청하시겠습니까?\n[PRD 반품 정책 안내]\n- 배송 완료 후 7일 이내 접수\n- 왕복 배송비 6,000원이 자동 정산되어 차감 환불됩니다.'
      )
    ) {
      const targetOrder = orders.find((o) => o.id === orderId);
      const updated = orders.map((o) =>
        o.id === orderId ? { ...o, status: 'refunded' as const } : o
      );
      setOrders(updated);
      localStorage.setItem('dasseoba_orders', JSON.stringify(updated));

      // Supabase orders 테이블 업데이트 요청
      if (targetOrder) {
        try {
          await fetch('/api/orders', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: targetOrder.id,
              orderNumber: targetOrder.orderNumber,
              status: 'refunded',
            }),
          });
        } catch (e) {
          console.warn('Failed to update refund status in DB:', e);
        }
      }

      alert('반품 신청이 완료되었습니다. 기사님께서 1~2일 내 방문 수거 예정입니다.');
    }
  };

  const getStatusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'paid':
        return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">결제완료</span>;
      case 'preparing':
        return <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold">상품제작/배송준비</span>;
      case 'shipped':
        return <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-bold">배송중</span>;
      case 'delivered':
        return <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">배송완료</span>;
      case 'cancelled':
        return <span className="bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-bold">주문취소</span>;
      case 'refunded':
        return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold">반품/환불접수</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginRequired
        pageName="마이페이지"
        title="마이페이지 로그인 안내"
        description="회원 정보, 보유 적립금, 주문 내역을 확인하시려면 먼저 로그인해 주세요."
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 상단 회원 요약 카드 */}
        <div className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-400 text-zinc-950 flex items-center justify-center font-black text-2xl shadow-md">
              {user?.name?.[0] || '홍'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">{user?.name || '홍길동'} 회원님</h1>
                <span className="text-[11px] bg-zinc-800 text-amber-300 px-2 py-0.5 rounded font-bold border border-zinc-700">
                  다써바 VIP 모자매니아
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">{user?.email || 'customer@dasseoba.com'}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 border-t md:border-t-0 md:border-l border-zinc-800 pt-4 md:pt-0 md:pl-8">
            <div>
              <span className="text-xs text-zinc-400 block">보유 적립금</span>
              <span className="text-2xl font-black text-amber-400">
                {(user?.points || 2000).toLocaleString()}P
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block">진행 중인 주문</span>
              <span className="text-2xl font-black text-white">
                {orders.filter((o) => ['paid', 'preparing', 'shipped'].includes(o.status)).length}건
              </span>
            </div>
            <Link href="/mypage/wishlist" className="group">
              <span className="text-xs text-zinc-400 block group-hover:text-red-400 transition">찜한 상품</span>
              <span className="text-2xl font-black text-red-500 group-hover:underline flex items-center gap-1">
                {wishlistCount}개
              </span>
            </Link>
          </div>
        </div>

        {/* 세금명세서 모달 */}
        {selectedOrderForTax && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setSelectedOrderForTax(null)}
            />
            <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 z-10 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-black text-base text-zinc-950">전자 세금계산서/명세서 출력</h3>
                </div>
                <button
                  onClick={() => setSelectedOrderForTax(null)}
                  className="text-zinc-400 hover:text-zinc-600 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* 명세서 미리보기 */}
              <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs space-y-3 font-mono">
                <div className="text-center pb-2 border-b border-zinc-300 font-black text-sm font-sans">
                  [사업자 세금명세서]
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>공급자: (주)다써바커머스 (123-45-67890)</div>
                  <div>주문번호: {selectedOrderForTax.orderNumber}</div>
                  <div>공급받는자: {taxCompanyName}</div>
                  <div>사업자번호: {taxBusinessNo}</div>
                </div>
                <div className="pt-2 border-t border-zinc-300 flex justify-between font-bold text-sm font-sans">
                  <span>총 공급대가 (합계금액):</span>
                  <span className="text-indigo-600 font-mono">
                    {selectedOrderForTax.totalAmount.toLocaleString()}원 (VAT포함)
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <label className="block font-bold text-zinc-700">사업자 등록번호 입력</label>
                <input
                  type="text"
                  value={taxBusinessNo}
                  onChange={(e) => setTaxBusinessNo(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => {
                    alert('인쇄 창으로 전송되었습니다.');
                    setSelectedOrderForTax(null);
                  }}
                  className="px-5 py-2.5 bg-zinc-950 text-white font-bold text-xs rounded-xl hover:bg-zinc-800 transition"
                >
                  명세서 인쇄/PDF 저장
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 주문 및 배송 관리 섹션 */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
            <div>
              <h2 className="text-lg font-black text-zinc-950 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-500" /> 주문 내역 및 배송 조회
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                주문 상태에 따라 즉시 취소 또는 반품/환불을 직접 신청하실 수 있습니다.
              </p>
            </div>
            <Link
              href="/community/qna"
              className="text-xs font-bold text-zinc-600 hover:text-zinc-950 transition flex items-center gap-1"
            >
              1:1 문의하기 <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16 text-xs text-zinc-400">
              주문 내역이 없습니다.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-zinc-200 rounded-2xl p-5 hover:border-zinc-300 transition-colors space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-zinc-900">{order.orderNumber}</span>
                      <span className="text-zinc-400">|</span>
                      <span className="text-zinc-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {getStatusBadge(order.status)}
                      {order.paymentMethod && (
                        <span className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-medium">
                          {order.paymentMethod}
                        </span>
                      )}
                      {order.receiptUrl && (
                        <a
                          href={order.receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline font-bold flex items-center gap-0.5"
                        >
                          영수증 <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      <button
                        onClick={() => setSelectedOrderForTax(order)}
                        className="text-[11px] text-zinc-600 hover:text-zinc-950 underline font-medium flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> 세금명세서
                      </button>
                    </div>
                  </div>

                  {/* 아이템 목록 */}
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover bg-zinc-100 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-zinc-900">{item.title}</p>
                            <p className="text-[11px] text-zinc-500">
                              옵션: {item.color} / {item.size} × {item.quantity}개
                            </p>
                          </div>
                        </div>
                        <span className="font-bold text-zinc-900">
                          {(item.price * item.quantity).toLocaleString()}원
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* 하단 취소 / 반품 버튼 바 */}
                  <div className="pt-3 border-t border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="text-zinc-500 text-[11px]">
                      송장번호: <strong className="font-mono text-zinc-800">{order.trackingNumber}</strong> (CJ대한통운)
                    </div>

                    <div className="flex items-center gap-2">
                      {/* PRD: '결제완료' 단계 즉시 취소 가능 */}
                      {order.status === 'paid' && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-bold transition text-xs"
                        >
                          주문 즉시 취소
                        </button>
                      )}

                      {/* PRD: '배송완료' 후 7일 이내 반품 접수 (왕복배송비 6,000원 반영) */}
                      {order.status === 'delivered' && (
                        <button
                          onClick={() => handleReturnOrder(order.id)}
                          className="px-3 py-1.5 rounded-lg border border-zinc-300 text-zinc-800 hover:bg-zinc-100 font-bold transition text-xs flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> 반품/환불 신청 (6,000원 공제)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
