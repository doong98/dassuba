import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// 첨부 이미지 기준 초기 발주 대장 목록 (Fallback용)
export const INITIAL_POS = [
  { id: 'po-1', supplierName: '(주)동대문패브릭', materialName: '14수 고밀도 프리미엄 코튼 원단', materialId: 'm-1', quantity: 200, totalCost: 960000, status: 'ordered', date: '2026-10-06' },
  { id: 'po-2', supplierName: '성수스냅산업', materialName: '7홀 프리미엄 플라스틱 스냅백 부자재', materialId: 'm-3', quantity: 1000, totalCost: 350000, status: 'received', date: '2026-10-02' },
];

// 1. GET: 거래처 발주서 목록 조회
export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        purchaseOrders: INITIAL_POS,
        fromDb: false,
        message: 'Supabase API Key가 없어 로컬 데이터를 반환합니다.',
      });
    }

    const { data, error } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Supabase purchase_orders fetch warning:', error.message);
      return NextResponse.json({
        success: true,
        purchaseOrders: INITIAL_POS,
        fromDb: false,
        needTable: true,
        error: error.message,
      });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        purchaseOrders: INITIAL_POS,
        fromDb: false,
        message: 'DB에 등록된 발주서가 없습니다.',
      });
    }

    const mapped = data.map((item: any) => ({
      id: item.id,
      supplierName: item.supplier_name,
      materialName: item.material_name,
      materialId: item.material_id,
      quantity: Number(item.quantity ?? 0),
      totalCost: Number(item.total_cost ?? 0),
      status: item.status as 'ordered' | 'received' | 'cancelled',
      date: item.order_date || (item.created_at ? item.created_at.split('T')[0] : '2026-10-06'),
    }));

    return NextResponse.json({
      success: true,
      purchaseOrders: mapped,
      fromDb: true,
    });
  } catch (err: any) {
    console.error('API /api/purchase-orders GET error:', err);
    return NextResponse.json({
      success: true,
      purchaseOrders: INITIAL_POS,
      fromDb: false,
      error: err.message,
    });
  }
}

// 2. POST: 신규 거래처 발주서 생성 (Supabase purchase_orders 테이블 INSERT)
export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase 클라이언트가 초기화되지 않았습니다.' }, { status: 500 });
    }

    const body = await request.json();
    const { supplierName, materialName, materialId, quantity, totalCost, status, date } = body;

    const newPO = {
      id: body.id || `po-${Date.now()}`,
      supplier_name: supplierName,
      material_id: materialId || null,
      material_name: materialName,
      quantity: Number(quantity || 0),
      total_cost: Number(totalCost || 0),
      status: status || 'ordered',
      order_date: date || new Date().toISOString().split('T')[0],
    };

    const { data, error } = await supabase.from('purchase_orders').insert([newPO]).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      purchaseOrder: {
        id: data.id,
        supplierName: data.supplier_name,
        materialName: data.material_name,
        materialId: data.material_id,
        quantity: data.quantity,
        totalCost: data.total_cost,
        status: data.status,
        date: data.order_date,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 3. PATCH: 발주서 상태 변경 (입고 확인 처리 및 자재 재고 자동 증가)
export async function PATCH(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase 클라이언트 없음' }, { status: 500 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '발주서 ID가 필요합니다.' }, { status: 400 });
    }

    // 기존 발주서 조회
    const { data: currentPO, error: fetchError } = await supabase
      .from('purchase_orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !currentPO) {
      return NextResponse.json({ success: false, error: '발주서를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 발주서 상태 업데이트
    const { data: updatedPO, error: updateError } = await supabase
      .from('purchase_orders')
      .update({
        status: status || 'received',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 400 });
    }

    // 입고 처리('received')인 경우 연결된 자재 재고 증가
    if (status === 'received' && currentPO.status !== 'received') {
      try {
        if (currentPO.material_id) {
          const { data: mat } = await supabase.from('materials').select('current_stock').eq('id', currentPO.material_id).single();
          if (mat) {
            await supabase.from('materials').update({
              current_stock: Number(mat.current_stock || 0) + Number(currentPO.quantity || 0),
              updated_at: new Date().toISOString()
            }).eq('id', currentPO.material_id);
          }
        } else {
          // 이름으로 매칭 시도
          const { data: mats } = await supabase.from('materials').select('*');
          const matched = mats?.find((m: any) => m.name.includes(currentPO.material_name.slice(0, 5)));
          if (matched) {
            await supabase.from('materials').update({
              current_stock: Number(matched.current_stock || 0) + Number(currentPO.quantity || 0),
              updated_at: new Date().toISOString()
            }).eq('id', matched.id);
          }
        }
      } catch (matErr) {
        console.warn('재고 자동 증가 처리 중 알림:', matErr);
      }
    }

    return NextResponse.json({
      success: true,
      purchaseOrder: {
        id: updatedPO.id,
        supplierName: updatedPO.supplier_name,
        materialName: updatedPO.material_name,
        materialId: updatedPO.material_id,
        quantity: updatedPO.quantity,
        totalCost: updatedPO.total_cost,
        status: updatedPO.status,
        date: updatedPO.order_date,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
