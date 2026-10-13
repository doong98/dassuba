-- ==============================================================================
-- 다써바(DASSEOBA) 모자 전문 온라인 커머스
-- 원부자재 재고(materials) 및 거래처 발주(purchase_orders) 테이블 생성 DDL
-- Supabase 인스턴스: https://ibcfzsbgeqsocpbqhzsv.supabase.co
-- Supabase 대시보드 -> SQL Editor 에서 전체 복사 후 [Run]을 눌러 실행해주세요.
-- ==============================================================================

-- 1. materials (원부자재 재고 마스터 테이블) 생성
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY DEFAULT ('mat-' || substr(md5(random()::text), 1, 8)),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    unit VARCHAR(20) DEFAULT 'yd', -- yd, pcs, roll
    current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
    safety_stock INTEGER DEFAULT 0 CHECK (safety_stock >= 0),
    unit_price INTEGER DEFAULT 0 CHECK (unit_price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. purchase_orders (거래처 발주서 발행 대장 테이블) 생성
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id TEXT PRIMARY KEY DEFAULT ('po-' || substr(md5(random()::text), 1, 8)),
    supplier_name VARCHAR(200) NOT NULL,
    material_id TEXT REFERENCES public.materials(id) ON DELETE SET NULL,
    material_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_cost INTEGER NOT NULL CHECK (total_cost >= 0),
    status VARCHAR(30) DEFAULT 'ordered' CHECK (status IN ('ordered', 'received', 'cancelled')),
    order_date VARCHAR(50) DEFAULT to_char(NOW(), 'YYYY-MM-DD'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security (RLS) 활성화 및 전체 CRUD 허용 (관리자 페이지 익명/인증 접근 허용)
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

-- materials 정책
DROP POLICY IF EXISTS "Allow public select materials" ON public.materials;
DROP POLICY IF EXISTS "Allow public insert materials" ON public.materials;
DROP POLICY IF EXISTS "Allow public update materials" ON public.materials;
DROP POLICY IF EXISTS "Allow public delete materials" ON public.materials;

CREATE POLICY "Allow public select materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Allow public insert materials" ON public.materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update materials" ON public.materials FOR UPDATE USING (true);
CREATE POLICY "Allow public delete materials" ON public.materials FOR DELETE USING (true);

-- purchase_orders 정책
DROP POLICY IF EXISTS "Allow public select purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow public insert purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow public update purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow public delete purchase_orders" ON public.purchase_orders;

CREATE POLICY "Allow public select purchase_orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert purchase_orders" ON public.purchase_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update purchase_orders" ON public.purchase_orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete purchase_orders" ON public.purchase_orders FOR DELETE USING (true);

-- 4. 첨부 이미지 기준 원부자재 5종 초기 데이터 등록 (ON CONFLICT DO UPDATE)
INSERT INTO public.materials (id, name, code, unit, current_stock, safety_stock, unit_price)
VALUES 
    ('m-1', '14수 고밀도 프리미엄 코튼 원단 (블랙)', 'MAT-COT-01', 'yd', 42, 50, 4800),
    ('m-2', '피그먼트 바이오워싱 원단 (차콜)', 'MAT-WSH-02', 'yd', 180, 40, 6200),
    ('m-3', '7홀 프리미엄 플라스틱 스냅백 부자재', 'MAT-SNP-03', 'pcs', 1200, 200, 350),
    ('m-4', '쿨맥스 흡한속건 땀받이 헤드밴드 3.5cm', 'MAT-BND-04', 'yd', 400, 80, 1200),
    ('m-5', '일본 타지마 자수기용 고광택 자수사 (금사/은사)', 'MAT-EMB-05', 'roll', 15, 20, 8500)
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    unit = EXCLUDED.unit,
    current_stock = EXCLUDED.current_stock,
    safety_stock = EXCLUDED.safety_stock,
    unit_price = EXCLUDED.unit_price,
    updated_at = NOW();

-- 5. 첨부 이미지 기준 거래처 발주 대장 2종 초기 데이터 등록 (ON CONFLICT DO UPDATE)
INSERT INTO public.purchase_orders (id, supplier_name, material_id, material_name, quantity, total_cost, status, order_date)
VALUES 
    ('po-1', '(주)동대문패브릭', 'm-1', '14수 고밀도 프리미엄 코튼 원단', 200, 960000, 'ordered', '2026-10-06'),
    ('po-2', '성수스냅산업', 'm-3', '7홀 프리미엄 플라스틱 스냅백 부자재', 1000, 350000, 'received', '2026-10-02')
ON CONFLICT (id) DO UPDATE SET
    supplier_name = EXCLUDED.supplier_name,
    material_id = EXCLUDED.material_id,
    material_name = EXCLUDED.material_name,
    quantity = EXCLUDED.quantity,
    total_cost = EXCLUDED.total_cost,
    status = EXCLUDED.status,
    order_date = EXCLUDED.order_date,
    updated_at = NOW();
