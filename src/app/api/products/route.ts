import { NextResponse } from 'next/server';
import { MOCK_PRODUCTS } from '@/lib/data/mockData';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// 1. GET: 상품 목록 조회 (Supabase products 테이블 우선 조회 -> 없으면 MOCK_PRODUCTS fallback)
export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        products: MOCK_PRODUCTS,
        fromDb: false,
        message: 'Supabase API Key가 없어 로컬 데이터를 반환합니다.',
      });
    }

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase products fetch notice:', error.message);
      // 테이블이 아직 없거나 schema cache 에러인 경우 MOCK_PRODUCTS 반환
      return NextResponse.json({
        success: true,
        products: MOCK_PRODUCTS,
        fromDb: false,
        error: error.message,
      });
    }

    // DB에 데이터가 비어있으면 MOCK_PRODUCTS 반환
    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        products: MOCK_PRODUCTS,
        fromDb: false,
        message: 'DB에 등록된 상품이 없어 기본 상품을 반환합니다.',
      });
    }

    // Supabase 데이터 컬럼을 프론트엔드 ProductItem 형식으로 변환
    const mappedProducts = data.map((item: any) => ({
      id: item.id,
      title: item.title,
      price: item.price,
      originalPrice: item.original_price || item.price,
      category: item.category,
      subCategory: item.sub_category || 'basic',
      isBundle1Plus1: Boolean(item.is_bundle_1plus1),
      isCustomAvailable: item.is_custom_available !== false,
      images: Array.isArray(item.images) && item.images.length > 0 ? item.images : ['/images/products/bundle-1.png'],
      colors: Array.isArray(item.colors) && item.colors.length > 0 ? item.colors : ['블랙', '화이트'],
      sizes: Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : ['FREE'],
      badge: item.badge || (item.is_bundle_1plus1 ? '1+1' : 'NEW'),
      rating: Number(item.rating) || 5.0,
      reviewCount: Number(item.review_count) || 0,
      description: item.description || '',
    }));

    return NextResponse.json({
      success: true,
      products: mappedProducts,
      fromDb: true,
    });
  } catch (err: any) {
    console.error('API /api/products GET error:', err);
    return NextResponse.json({
      success: true,
      products: MOCK_PRODUCTS,
      fromDb: false,
      error: err.message,
    });
  }
}

// 2. POST: 신규 상품 등록 (Supabase products 테이블 INSERT)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      price,
      originalPrice,
      category,
      subCategory,
      isBundle1Plus1,
      isCustomAvailable,
      images,
      colors,
      sizes,
      badge,
      description,
    } = body;

    if (!title) {
      return NextResponse.json(
        { success: false, error: '상품명을 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Supabase 클라이언트가 초기화되지 않았습니다.' },
        { status: 500 }
      );
    }

    const newProductId = 'prod-' + Date.now();
    const payload = {
      id: newProductId,
      title,
      price: Number(price) || 0,
      original_price: Number(originalPrice) || Number(price) || 0,
      category: category || 'ballcap',
      sub_category: subCategory || 'basic',
      is_bundle_1plus1: Boolean(isBundle1Plus1),
      is_custom_available: isCustomAvailable !== false,
      images: Array.isArray(images) && images.length > 0 ? images : ['/images/products/bundle-1.png'],
      colors: Array.isArray(colors) && colors.length > 0 ? colors : ['블랙', '화이트'],
      sizes: Array.isArray(sizes) && sizes.length > 0 ? sizes : ['FREE'],
      badge: badge || (isBundle1Plus1 ? '1+1' : 'NEW'),
      rating: 5.0,
      review_count: 0,
      description: description || '',
      status: 'active',
    };

    const { data, error } = await supabase
      .from('products')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Supabase products INSERT error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        },
        { status: 400 }
      );
    }

    const createdProduct = {
      id: data.id,
      title: data.title,
      price: data.price,
      originalPrice: data.original_price,
      category: data.category,
      subCategory: data.sub_category,
      isBundle1Plus1: Boolean(data.is_bundle_1plus1),
      isCustomAvailable: data.is_custom_available !== false,
      images: data.images,
      colors: data.colors,
      sizes: data.sizes,
      badge: data.badge,
      rating: Number(data.rating),
      reviewCount: Number(data.review_count),
      description: data.description,
    };

    return NextResponse.json({
      success: true,
      product: createdProduct,
    });
  } catch (err: any) {
    console.error('API /api/products POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 3. DELETE: 상품 삭제
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: '삭제할 상품 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: true, id });
    }

    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, id });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
