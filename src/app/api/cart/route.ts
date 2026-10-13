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

export interface DbCartItem {
  id: string;
  user_id: string;
  product_id: string;
  title: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
  is_bundle_1plus1?: boolean;
  created_at?: string;
  updated_at?: string;
}

// 인메모리 Fallback 캐시 (Supabase 테이블 미생성 또는 연결 실패 시)
let memoryCart: DbCartItem[] = [
  {
    id: 'cart-demo-01',
    user_id: 'usr-demo-01',
    product_id: 'prod-1',
    title: '시그니처 딥핏 코튼 무지 볼캡',
    price: 19800,
    image: 'https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-1-signature-ballcap.png',
    color: '블랙',
    size: 'FREE (56-60cm)',
    quantity: 1,
    is_bundle_1plus1: true,
  },
  {
    id: 'cart-demo-02',
    user_id: 'usr-demo-01',
    product_id: 'prod-2',
    title: '빈티지 피그먼트 워싱 로우 볼캡',
    price: 24900,
    image: 'https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-2-vintage-washing-ballcap.png',
    color: '피그먼트그레이',
    size: 'FREE (56-60cm)',
    quantity: 1,
    is_bundle_1plus1: true,
  },
];

function mapDbToClient(item: DbCartItem) {
  return {
    id: item.id,
    productId: item.product_id,
    title: item.title,
    price: Number(item.price) || 0,
    image: item.image || '/images/products/bundle-1.png',
    color: item.color || '기본',
    size: item.size || 'FREE',
    quantity: Number(item.quantity) || 1,
    isBundle1Plus1: Boolean(item.is_bundle_1plus1),
  };
}

// 1. GET: 장바구니 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || 'usr-demo-01';

    const supabase = getSupabase();
    if (!supabase) {
      const filtered = memoryCart.filter((c) => c.user_id === userId);
      return NextResponse.json({
        success: true,
        data: filtered.map(mapDbToClient),
        fromDb: false,
      });
    }

    let { data, error } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!error && (!data || data.length === 0)) {
      const { data: allCart } = await supabase
        .from('cart')
        .select('*')
        .order('created_at', { ascending: true });
      if (allCart && allCart.length > 0) {
        data = allCart;
      }
    }

    if (error) {
      console.warn('Supabase cart fetch notice:', error.message);
      const filtered = memoryCart.filter((c) => c.user_id === userId);
      return NextResponse.json({
        success: true,
        data: filtered.map(mapDbToClient),
        fromDb: false,
        warning: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapDbToClient),
      fromDb: true,
    });
  } catch (err: any) {
    console.error('Cart GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || '서버 오류' },
      { status: 500 }
    );
  }
}

// 2. POST: 장바구니 상품 추가 (수량 누적 또는 신규 등록)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id = 'usr-demo-01',
      product_id,
      productId,
      title,
      price,
      image,
      color = '기본',
      size = 'FREE',
      quantity = 1,
      isBundle1Plus1 = false,
      is_bundle_1plus1 = false,
    } = body;

    const actualProductId = product_id || productId;
    const actualPrice = Number(price) || 0;
    const actualQty = Number(quantity) || 1;
    const actualBundle = Boolean(isBundle1Plus1 || is_bundle_1plus1);
    const actualImage = image || '/images/products/bundle-1.png';

    if (!actualProductId || !title) {
      return NextResponse.json(
        { success: false, error: '상품 ID와 상품명은 필수입니다.' },
        { status: 400 }
      );
    }

    // 메모리 캐시 갱신
    const existingIndex = memoryCart.findIndex(
      (c) =>
        c.user_id === user_id &&
        c.product_id === actualProductId &&
        c.color === color &&
        c.size === size
    );

    let savedItem: DbCartItem;
    if (existingIndex > -1) {
      memoryCart[existingIndex].quantity += actualQty;
      savedItem = memoryCart[existingIndex];
    } else {
      savedItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        user_id,
        product_id: actualProductId,
        title,
        price: actualPrice,
        image: actualImage,
        color,
        size,
        quantity: actualQty,
        is_bundle_1plus1: actualBundle,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      memoryCart.push(savedItem);
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: mapDbToClient(savedItem),
        fromDb: false,
      });
    }

    // Supabase DB에 저장 (기존 레코드 존재 여부 확인)
    const { data: existingRows } = await supabase
      .from('cart')
      .select('*')
      .eq('user_id', user_id)
      .eq('product_id', actualProductId)
      .eq('color', color)
      .eq('size', size)
      .limit(1);

    let finalDbItem: any = null;
    if (existingRows && existingRows.length > 0) {
      // 기존 상품: 수량 추가
      const newQty = (existingRows[0].quantity || 0) + actualQty;
      const { data: updated, error: updateErr } = await supabase
        .from('cart')
        .update({
          quantity: newQty,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRows[0].id)
        .select()
        .single();

      if (!updateErr && updated) {
        finalDbItem = updated;
      }
    } else {
      // 신규 상품 삽입
      const { data: inserted, error: insertErr } = await supabase
        .from('cart')
        .insert({
          user_id,
          product_id: actualProductId,
          title,
          price: actualPrice,
          image: actualImage,
          color,
          size,
          quantity: actualQty,
          is_bundle_1plus1: actualBundle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!insertErr && inserted) {
        finalDbItem = inserted;
      } else if (insertErr) {
        console.warn('Supabase cart insert error:', insertErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      data: mapDbToClient(finalDbItem || savedItem),
      fromDb: !!finalDbItem,
    });
  } catch (err: any) {
    console.error('Cart POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || '서버 오류' },
      { status: 500 }
    );
  }
}

// 3. PATCH/PUT: 수량 수정
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, quantity, delta, user_id = 'usr-demo-01' } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'id가 필요합니다.' }, { status: 400 });
    }

    // 메모리 캐시 수정
    const idx = memoryCart.findIndex((c) => c.id === id);
    let newQuantity = quantity;
    if (idx > -1) {
      if (typeof delta === 'number') {
        newQuantity = memoryCart[idx].quantity + delta;
      }
      if (newQuantity <= 0) {
        memoryCart = memoryCart.filter((c) => c.id !== id);
      } else {
        memoryCart[idx].quantity = newQuantity;
      }
    }

    const supabase = getSupabase();
    if (supabase) {
      if (newQuantity <= 0) {
        await supabase.from('cart').delete().eq('id', id);
      } else {
        await supabase
          .from('cart')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', id);
      }
    }

    return NextResponse.json({
      success: true,
      id,
      quantity: Math.max(0, newQuantity),
    });
  } catch (err: any) {
    console.error('Cart PATCH error:', err);
    return NextResponse.json(
      { success: false, error: err.message || '서버 오류' },
      { status: 500 }
    );
  }
}

// 4. DELETE: 장바구니 항목 삭제 또는 전체 비우기
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let userId = searchParams.get('user_id');
    let clearAll = searchParams.get('clear') === 'true';

    // body로 들어온 경우도 지원
    if (!id && !clearAll) {
      try {
        const body = await request.json();
        id = body.id || id;
        userId = body.user_id || userId;
        clearAll = body.clear === true || clearAll;
      } catch (_) {}
    }

    userId = userId || 'usr-demo-01';

    if (clearAll) {
      memoryCart = memoryCart.filter((c) => c.user_id !== userId);
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('cart').delete().eq('user_id', userId);
      }
      return NextResponse.json({ success: true, message: '장바구니가 비워졌습니다.' });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: '삭제할 cart id가 필요합니다.' }, { status: 400 });
    }

    // 개별 삭제
    memoryCart = memoryCart.filter((c) => c.id !== id);
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from('cart').delete().eq('id', id);
    }

    return NextResponse.json({
      success: true,
      message: '장바구니 항목이 삭제되었습니다.',
      id,
    });
  } catch (err: any) {
    console.error('Cart DELETE error:', err);
    return NextResponse.json(
      { success: false, error: err.message || '서버 오류' },
      { status: 500 }
    );
  }
}
