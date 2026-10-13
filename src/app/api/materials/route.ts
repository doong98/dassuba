import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

// 첨부 이미지 기준 초기 원부자재 목록 (Fallback용)
export const INITIAL_MATERIALS = [
  { id: 'm-1', name: '14수 고밀도 프리미엄 코튼 원단 (블랙)', code: 'MAT-COT-01', unit: 'yd', currentStock: 42, safetyStock: 50, unitPrice: 4800 },
  { id: 'm-2', name: '피그먼트 바이오워싱 원단 (차콜)', code: 'MAT-WSH-02', unit: 'yd', currentStock: 180, safetyStock: 40, unitPrice: 6200 },
  { id: 'm-3', name: '7홀 프리미엄 플라스틱 스냅백 부자재', code: 'MAT-SNP-03', unit: 'pcs', currentStock: 1200, safetyStock: 200, unitPrice: 350 },
  { id: 'm-4', name: '쿨맥스 흡한속건 땀받이 헤드밴드 3.5cm', code: 'MAT-BND-04', unit: 'yd', currentStock: 400, safetyStock: 80, unitPrice: 1200 },
  { id: 'm-5', name: '일본 타지마 자수기용 고광택 자수사 (금사/은사)', code: 'MAT-EMB-05', unit: 'roll', currentStock: 15, safetyStock: 20, unitPrice: 8500 },
];

// 1. GET: 원부자재 재고 목록 조회
export async function GET() {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        materials: INITIAL_MATERIALS,
        fromDb: false,
        message: 'Supabase API Key가 없어 로컬 데이터를 반환합니다.',
      });
    }

    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('code', { ascending: true });

    if (error) {
      console.warn('Supabase materials fetch warning:', error.message);
      return NextResponse.json({
        success: true,
        materials: INITIAL_MATERIALS,
        fromDb: false,
        needTable: true,
        error: error.message,
      });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        success: true,
        materials: INITIAL_MATERIALS,
        fromDb: false,
        message: 'DB에 등록된 자재 데이터가 없습니다.',
      });
    }

    const mapped = data.map((item: any) => ({
      id: item.id,
      name: item.name,
      code: item.code,
      unit: item.unit || 'yd',
      currentStock: Number(item.current_stock ?? 0),
      safetyStock: Number(item.safety_stock ?? 0),
      unitPrice: Number(item.unit_price ?? 0),
    }));

    return NextResponse.json({
      success: true,
      materials: mapped,
      fromDb: true,
    });
  } catch (err: any) {
    console.error('API /api/materials GET error:', err);
    return NextResponse.json({
      success: true,
      materials: INITIAL_MATERIALS,
      fromDb: false,
      error: err.message,
    });
  }
}

// 2. POST: 신규 자재 등록 (필요시 확장)
export async function POST(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase 클라이언트가 초기화되지 않았습니다.' }, { status: 500 });
    }

    const body = await request.json();
    const { name, code, unit, currentStock, safetyStock, unitPrice } = body;

    const newMaterial = {
      id: body.id || `mat-${Date.now()}`,
      name,
      code,
      unit: unit || 'yd',
      current_stock: Number(currentStock || 0),
      safety_stock: Number(safetyStock || 0),
      unit_price: Number(unitPrice || 0),
    };

    const { data, error } = await supabase.from('materials').insert([newMaterial]).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      material: {
        id: data.id,
        name: data.name,
        code: data.code,
        unit: data.unit,
        currentStock: data.current_stock,
        safetyStock: data.safety_stock,
        unitPrice: data.unit_price,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// 3. PATCH: 원부자재 재고 수량 업데이트 (직접 수정 또는 입고에 의한 증가)
export async function PATCH(request: Request) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase 클라이언트 없음' }, { status: 500 });
    }

    const body = await request.json();
    const { id, currentStock, addStock } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: '자재 ID가 필요합니다.' }, { status: 400 });
    }

    let updateData: any = {};
    if (typeof currentStock === 'number') {
      updateData.current_stock = currentStock;
    } else if (typeof addStock === 'number') {
      // 현재 수량 조회 후 가산
      const { data: currentMat } = await supabase.from('materials').select('current_stock').eq('id', id).single();
      const current = currentMat ? Number(currentMat.current_stock) : 0;
      updateData.current_stock = current + addStock;
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await supabase.from('materials').update(updateData).eq('id', id).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, material: data });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
