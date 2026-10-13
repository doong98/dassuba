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

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product_title: string;
  product_price: number;
  product_image?: string;
  category?: string;
  created_at?: string;
}

// Supabase 테이블 미생성 또는 연결 실패 시 인메모리 Fallback 캐시
let memoryWishlist: WishlistItem[] = [
  {
    id: 'wish-seed-01',
    user_id: 'usr-demo-01',
    product_id: 'prod-best-01',
    product_title: '시그니처 딥핏 코튼 무지 볼캡',
    product_price: 18900,
    product_image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600',
    category: 'ballcap',
    created_at: new Date().toISOString(),
  },
  {
    id: 'wish-seed-02',
    user_id: 'usr-demo-01',
    product_id: 'prod-bundle-01',
    product_title: '[1+1] 시그니처 딥핏 코튼 볼캡 2개 세트',
    product_price: 29800,
    product_image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600',
    category: 'bundle1plus1',
    created_at: new Date().toISOString(),
  },
];

// 1. GET: 찜 목록 조회
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id') || 'usr-demo-01';

    const supabase = getSupabase();
    if (!supabase) {
      const filtered = memoryWishlist.filter((w) => w.user_id === userId);
      return NextResponse.json({
        success: true,
        data: filtered,
        fromDb: false,
        message: 'Supabase Key 없음 (인메모리 반환)',
      });
    }

    let { data, error } = await supabase
      .from('wishlist')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 특정 user_id에 데이터가 없을 때 Supabase의 전체 찜 데이터 fallback 반환 (데모 세션 지원)
    if (!error && (!data || data.length === 0)) {
      const { data: allData } = await supabase
        .from('wishlist')
        .select('*')
        .order('created_at', { ascending: false });

      if (allData && allData.length > 0) {
        data = allData;
      }
    }

    if (error) {
      console.warn('Supabase wishlist fetch warning:', error.message);
      // DB 테이블 부재 시 인메모리 반환
      const filtered = memoryWishlist.filter((w) => w.user_id === userId);
      return NextResponse.json({
        success: true,
        data: filtered,
        fromDb: false,
        warning: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      fromDb: true,
    });
  } catch (err: any) {
    console.error('Wishlist GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || '서버 오류' },
      { status: 500 }
    );
  }
}

// 2. POST: 찜 추가 (토글 지원 또는 신규 추가)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      user_id = 'usr-demo-01',
      product_id,
      product_title,
      product_price,
      product_image,
      category = 'general',
    } = body;

    if (!product_id || !product_title) {
      return NextResponse.json(
        { success: false, error: '상품 ID와 상품명은 필수입니다.' },
        { status: 400 }
      );
    }

    const newItem: WishlistItem = {
      id: `wish-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id,
      product_id,
      product_title,
      product_price: Number(product_price) || 0,
      product_image: product_image || '',
      category,
      created_at: new Date().toISOString(),
    };

    // 메모리 캐시 갱신 (이미 존재하면 갱신, 없으면 추가)
    const existingIndex = memoryWishlist.findIndex(
      (w) => w.user_id === user_id && w.product_id === product_id
    );
    if (existingIndex >= 0) {
      memoryWishlist[existingIndex] = { ...memoryWishlist[existingIndex], ...newItem };
    } else {
      memoryWishlist.unshift(newItem);
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        data: newItem,
        fromDb: false,
        message: 'Supabase Key 없음 (인메모리 저장됨)',
      });
    }

    const { data, error } = await supabase
      .from('wishlist')
      .upsert(
        {
          user_id,
          product_id,
          product_title,
          product_price: Number(product_price) || 0,
          product_image: product_image || '',
          category,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,product_id' }
      )
      .select()
      .single();

    if (error) {
      console.warn('Supabase wishlist insert warning:', error.message);
      return NextResponse.json({
        success: true,
        data: newItem,
        fromDb: false,
        warning: error.message,
      });
    }

    return NextResponse.json({
      success: true,
      data: data || newItem,
      fromDb: true,
    });
  } catch (err: any) {
    console.error('Wishlist POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || '서버 오류' },
      { status: 500 }
    );
  }
}

// 3. DELETE: 찜 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');
    let userId = searchParams.get('user_id');
    let productId = searchParams.get('product_id');

    // 요청 바디로 전달된 경우도 지원
    if (!id && !productId) {
      try {
        const body = await request.json();
        id = body.id || id;
        userId = body.user_id || userId;
        productId = body.product_id || productId;
      } catch (_) {}
    }

    userId = userId || 'usr-demo-01';

    if (!id && !productId) {
      return NextResponse.json(
        { success: false, error: '삭제할 찜 ID 또는 상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // 1. 인메모리 캐시에서 삭제
    if (id) {
      memoryWishlist = memoryWishlist.filter((w) => w.id !== id);
    } else if (productId) {
      memoryWishlist = memoryWishlist.filter(
        (w) => !(w.user_id === userId && w.product_id === productId)
      );
    }

    // 2. Supabase DB에서 실제 삭제
    const supabase = getSupabase();
    let deletedData: any[] = [];

    if (supabase) {
      if (id) {
        // [1순위] 위시리스트 고유 기본키(PK: wish-xxx)로 삭제
        const { data, error } = await supabase
          .from('wishlist')
          .delete()
          .eq('id', id)
          .select();

        if (error) {
          console.warn('Supabase wishlist delete by id error:', error.message);
        } else {
          deletedData = data || [];
        }
      }

      // [2순위] id로 삭제되지 않았거나 id가 없는 경우: product_id 기반 삭제
      if (deletedData.length === 0 && productId) {
        // 유저 ID 매칭 1차 시도
        const { data: userDeleted, error: userError } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', productId)
          .select();

        if (!userError && userDeleted && userDeleted.length > 0) {
          deletedData = userDeleted;
        } else {
          // 유저 ID 불일치(로그인/비로그인 전환 등) 대비: product_id 기준 삭제 fallback
          const { data: prodDeleted, error: prodError } = await supabase
            .from('wishlist')
            .delete()
            .eq('product_id', productId)
            .select();

          if (!prodError && prodDeleted) {
            deletedData = prodDeleted;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '찜 목록에서 삭제되었습니다.',
      id,
      product_id: productId,
      deletedCount: deletedData.length,
      deletedData,
    });
  } catch (err: any) {
    console.error('Wishlist DELETE error:', err);
    return NextResponse.json(
      { success: false, error: err.message || '서버 오류' },
      { status: 500 }
    );
  }
}
