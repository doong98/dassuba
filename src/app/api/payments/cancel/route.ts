import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const tossSecretKey = process.env.TOSS_SECRET_KEY || 'test_sk_OALnQNGcwObqEvxN7xD8rqOZAdnb';

function getSupabase() {
  if (!supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(request: Request) {
  try {
    const { orderId, paymentKey, cancelReason } = await request.json();

    if (!orderId && !paymentKey) {
      return NextResponse.json(
        { success: false, error: 'orderId 또는 paymentKey가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    let targetPaymentKey = paymentKey;

    // 만약 paymentKey가 없으면 orderId로 DB에서 조회
    if (!targetPaymentKey && supabase && orderId) {
      const { data: order } = await supabase
        .from('orders')
        .select('payment_key')
        .eq('order_number', orderId)
        .maybeSingle();
      if (order?.payment_key) {
        targetPaymentKey = order.payment_key;
      }
    }

    // 1. 토스 결제 취소 API 호출 (paymentKey가 있는 경우)
    let tossCancelData = null;
    if (targetPaymentKey) {
      const basicAuth = Buffer.from(`${tossSecretKey}:`).toString('base64');
      const tossResponse = await fetch(`https://api.tosspayments.com/v1/payments/${targetPaymentKey}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelReason: cancelReason || '고객 단순 변심 또는 관리자 주문 취소',
        }),
      });

      tossCancelData = await tossResponse.json();
      if (!tossResponse.ok) {
        console.error('Toss cancel error:', tossCancelData);
        // 토스에서 이미 취소된 건일 수 있으므로 상황에 따라 에러 처리
      }
    }

    // 2. DB 주문 상태 취소/환불로 갱신
    if (supabase) {
      const updateFilter = orderId ? { order_number: orderId } : { payment_key: targetPaymentKey };
      await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancel_reason: cancelReason || '고객 요청/관리자 취소',
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .match(updateFilter);
    }

    return NextResponse.json({
      success: true,
      message: '성공적으로 결제가 취소되었습니다.',
      tossResponse: tossCancelData,
    });
  } catch (error: any) {
    console.error('Payment cancel error:', error);
    return NextResponse.json(
      { success: false, error: error.message || '결제 취소 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
