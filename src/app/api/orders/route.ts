import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// 첨부 이미지 기준 3건 초기 주문 데이터 (Fallback용)
export const DEFAULT_ORDERS = [
  {
    id: 'ord-1',
    orderNumber: 'ORD-1791778541236',
    recipient: '홍길동',
    phone: '010-1234-5678',
    address: '서울시 성동구 성수동 1가 12-34',
    itemsSummary: '시그니처 딥핏 코튼 무지 볼캡 외 1건',
    totalAmount: 34700,
    status: 'paid' as const,
    trackingNumber: 'CJ513285123',
    createdAt: '2026-10-12',
  },
  {
    id: 'ord-2',
    orderNumber: 'ORD-20261005-9921',
    recipient: '홍길동',
    phone: '010-1234-5678',
    address: '서울시 성동구 성수동 1가 12-34',
    itemsSummary: '시그니처 딥핏 코튼 무지 볼캡 외 1건',
    totalAmount: 29800,
    status: 'paid' as const,
    trackingNumber: 'CJ68291039401',
    createdAt: '2026-10-05',
  },
  {
    id: 'ord-3',
    orderNumber: 'ORD-20260928-1102',
    recipient: '홍길동',
    phone: '010-1234-5678',
    address: '서울시 성동구 성수동 1가 12-34',
    itemsSummary: '빅사이즈 대두 깊은 사계절 벙거지 버킷햇 외 0건',
    totalAmount: 43800,
    status: 'delivered' as const,
    trackingNumber: 'CJ55192837490',
    createdAt: '2026-09-28',
  },
];

// 1. GET: 전체 주문/배송 목록 조회
export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        orders: DEFAULT_ORDERS,
        fromDb: false,
        message: 'Supabase API Key가 없어 로컬 데이터를 반환합니다.',
      });
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase orders fetch warning:', error.message);
      return NextResponse.json({
        success: true,
        orders: DEFAULT_ORDERS,
        fromDb: false,
        needTable: true,
        error: error.message,
      });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        orders: DEFAULT_ORDERS,
        fromDb: false,
        message: 'DB에 등록된 주문이 없어 초기 데이터를 반환합니다.',
      });
    }

    const mapped = data.map((item: any) => ({
      id: item.id,
      orderNumber: item.order_number,
      recipient: item.recipient || '홍길동',
      phone: item.phone || '010-1234-5678',
      address: item.address || '',
      itemsSummary: item.items_summary || '모자 상품',
      totalAmount: Number(item.total_amount ?? 0),
      status: item.status || 'paid',
      trackingNumber: item.tracking_number || '',
      paymentKey: item.payment_key || null,
      receiptUrl: item.receipt_url || null,
      paymentMethod: item.payment_method || '카드',
      cancelReason: item.cancel_reason || null,
      items: Array.isArray(item.items) && item.items.length > 0 ? item.items : [],
      createdAt: item.order_date || (item.created_at ? item.created_at.split('T')[0] : '2026-10-12'),
    }));

    return NextResponse.json({
      success: true,
      orders: mapped,
      fromDb: true,
    });
  } catch (err: any) {
    console.error('API /api/orders GET error:', err);
    return NextResponse.json({
      success: true,
      orders: DEFAULT_ORDERS,
      fromDb: false,
      error: err.message,
    });
  }
}

// 2. POST: 신규 주문 생성 (결제 완료 시 Supabase DB INSERT)
export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    const body = await request.json();

    const {
      orderNumber,
      recipient,
      phone,
      address,
      items,
      itemsSummary,
      totalAmount,
      status,
      paymentMethod,
      trackingNumber,
      orderDate,
    } = body;

    const summaryText =
      itemsSummary ||
      (Array.isArray(items) && items.length > 0
        ? `${items[0].title || '모자'} 외 ${Math.max(0, items.length - 1)}건`
        : '모자 세트');

    const newRecord = {
      id: body.id || `ord-${Date.now()}`,
      order_number: orderNumber || `ORD-${Date.now()}`,
      recipient: recipient || '홍길동',
      phone: phone || '010-1234-5678',
      address: address || '서울시 성동구 성수동 1가 12-34',
      items_summary: summaryText,
      items: items || [],
      total_amount: Number(totalAmount || 0),
      status: status || 'paid',
      tracking_number: trackingNumber || `CJ${Math.floor(100000000 + Math.random() * 900000000)}`,
      payment_method: paymentMethod || 'credit_card',
      order_date: orderDate || new Date().toISOString().split('T')[0],
    };

    if (!supabase) {
      return NextResponse.json({
        success: true,
        order: {
          id: newRecord.id,
          orderNumber: newRecord.order_number,
          recipient: newRecord.recipient,
          phone: newRecord.phone,
          address: newRecord.address,
          itemsSummary: newRecord.items_summary,
          totalAmount: newRecord.total_amount,
          status: newRecord.status,
          trackingNumber: newRecord.tracking_number,
          createdAt: newRecord.order_date,
        },
        fromDb: false,
      });
    }

    const { data, error } = await supabase.from('orders').insert([newRecord]).select().single();

    if (error) {
      console.warn('Supabase orders insert notice:', error.message);
      return NextResponse.json({
        success: true,
        order: {
          id: newRecord.id,
          orderNumber: newRecord.order_number,
          recipient: newRecord.recipient,
          phone: newRecord.phone,
          address: newRecord.address,
          itemsSummary: newRecord.items_summary,
          totalAmount: newRecord.total_amount,
          status: newRecord.status,
          trackingNumber: newRecord.tracking_number,
          createdAt: newRecord.order_date,
        },
        fromDb: false,
        error: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: data.id,
        orderNumber: data.order_number,
        recipient: data.recipient,
        phone: data.phone,
        address: data.address,
        itemsSummary: data.items_summary,
        totalAmount: data.total_amount,
        status: data.status,
        trackingNumber: data.tracking_number,
        createdAt: data.order_date || data.created_at?.split('T')[0],
      },
      fromDb: true,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 3. PATCH: 주문 상태 및 운송장 번호 수정 (Supabase DB UPDATE)
export async function PATCH(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase 클라이언트 없음' }, { status: 500 });
    }

    const body = await request.json();
    const { id, orderNumber, status, trackingNumber } = body;

    if (!id && !orderNumber) {
      return NextResponse.json({ success: false, error: '주문 ID 또는 주문번호가 필요합니다.' }, { status: 400 });
    }

    const updateFields: any = { updated_at: new Date().toISOString() };
    if (status) updateFields.status = status;
    if (typeof trackingNumber === 'string') updateFields.tracking_number = trackingNumber.trim();

    let query = supabase.from('orders').update(updateFields);
    if (id) {
      query = query.eq('id', id);
    } else {
      query = query.eq('order_number', orderNumber);
    }

    const { data, error } = await query.select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: {
        id: data.id,
        orderNumber: data.order_number,
        recipient: data.recipient,
        phone: data.phone,
        itemsSummary: data.items_summary,
        totalAmount: data.total_amount,
        status: data.status,
        trackingNumber: data.tracking_number,
        createdAt: data.order_date || data.created_at?.split('T')[0],
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
