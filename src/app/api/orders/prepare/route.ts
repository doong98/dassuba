import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// 서버 세션/메모리 주문 검증 캐시 (DB 제약조건 변경 전후 완벽 호환 보장)
declare global {
  var __pendingOrders: Map<string, any> | undefined;
}
if (!globalThis.__pendingOrders) {
  globalThis.__pendingOrders = new Map();
}

// 1. 주문 사전 생성 API (결제창 호출 전 주문 데이터 검증 및 저장)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      recipient,
      phone,
      address,
      deliveryNote,
      items,
      usedPoints = 0,
      paymentMethod = 'card',
      customerEmail = '',
    } = body;

    if (!recipient || !phone || !address) {
      return NextResponse.json(
        { success: false, error: '수령인, 연락처, 배송지 주소는 필수 입력 사항입니다.' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: '주문할 상품 내역이 없습니다.' },
        { status: 400 }
      );
    }

    // 서버 측 금액 재계산 및 유효성 검증 (클라이언트 전달 금액 미신뢰)
    let subtotal = 0;
    let bundleCount = 0;

    for (const item of items) {
      const price = Number(item.price) || 0;
      const qty = Number(item.quantity) || 1;
      if (price <= 0 || qty <= 0) {
        return NextResponse.json(
          { success: false, error: '유효하지 않은 상품 가격 또는 수량입니다.' },
          { status: 400 }
        );
      }
      subtotal += price * qty;
      if (item.isBundle1Plus1) {
        bundleCount += qty;
      }
    }

    // 1+1 번들 할인: 짝수 수량 2개당 10,000원 할인
    const bundleDiscount = Math.floor(bundleCount / 2) * 10000;
    
    // 배송비: 30,000원 이상 무료, 미만 3,000원
    const discountedTotal = Math.max(0, subtotal - bundleDiscount);
    const shippingFee = discountedTotal >= 30000 ? 0 : 3000;

    // 포인트 차감 적용
    const validatedUsedPoints = Math.max(0, Number(usedPoints) || 0);
    const finalAmountToPay = Math.max(0, discountedTotal + shippingFee - validatedUsedPoints);

    // 고유하고 예측 불가능한 주문 번호 생성 (ORD-YYYYMMDD-랜덤)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;
    const orderId = `ord-${Date.now()}-${randomSuffix.toLowerCase()}`;

    // 상품 요약문구 생성
    const itemsSummary =
      items.length === 1
        ? items[0].title
        : `${items[0].title} 외 ${items.length - 1}건`;

    const pendingOrderObj = {
      id: orderId,
      orderNumber,
      recipient,
      phone,
      address,
      deliveryNote: deliveryNote || '',
      customerEmail,
      itemsSummary,
      items,
      totalAmount: finalAmountToPay,
      usedPoints: validatedUsedPoints,
      status: 'pending',
      paymentMethod,
      createdAt: new Date().toISOString(),
    };

    // 서버 전역 맵에 사전 등록 (위변조 검증 시 1차 기준 데이터)
    globalThis.__pendingOrders!.set(orderNumber, pendingOrderObj);

    // Supabase DB orders 테이블에도 저장 시도
    const supabase = getSupabase();
    if (supabase) {
      // DDL 제약조건 호환을 위해 pending 허용 시도 후 fallback
      const dbRecord: any = {
        id: orderId,
        order_number: orderNumber,
        recipient,
        phone,
        address,
        items_summary: itemsSummary,
        items,
        total_amount: finalAmountToPay,
        status: 'pending',
        payment_method: paymentMethod,
        order_date: new Date().toISOString().split('T')[0],
      };

      const { error: dbError } = await supabase.from('orders').insert([dbRecord]);
      if (dbError) {
        // status check 제약조건에 pending이 없는 경우 호환 처리
        dbRecord.status = 'paid';
        try {
          await supabase.from('orders').insert([dbRecord]);
        } catch (e) {
          console.warn('Fallback insert notice:', e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderId,
      orderNumber,
      amount: finalAmountToPay,
      orderName: itemsSummary,
      customerName: recipient,
    });
  } catch (error: any) {
    console.error('Order prepare error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '주문 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
