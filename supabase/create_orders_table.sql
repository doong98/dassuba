-- ==============================================================================
-- 다써바(DASSEOBA) 모자 전문 온라인 커머스
-- 주문/배송 관리(orders) 테이블 생성 DDL
-- Supabase 인스턴스: https://ibcfzsbgeqsocpbqhzsv.supabase.co
-- Supabase 대시보드 -> SQL Editor 에서 전체 복사 후 [Run]을 눌러 실행해주세요.
-- ==============================================================================

-- 1. orders (주문 및 배송 관리 테이블) 생성
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY DEFAULT ('ord-' || substr(md5(random()::text), 1, 8)),
    order_number VARCHAR(100) UNIQUE NOT NULL,
    recipient VARCHAR(100) NOT NULL DEFAULT '홍길동',
    phone VARCHAR(50) NOT NULL DEFAULT '010-1234-5678',
    address TEXT DEFAULT '서울시 성동구 성수동 1가 12-34',
    items_summary VARCHAR(255) NOT NULL,
    items JSONB DEFAULT '[]'::JSONB,
    total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
    status VARCHAR(30) DEFAULT 'paid' CHECK (status IN ('paid', 'preparing', 'shipped', 'delivered', 'refunded', 'cancelled')),
    tracking_number VARCHAR(100),
    payment_method VARCHAR(50) DEFAULT 'credit_card',
    order_date VARCHAR(50) DEFAULT to_char(NOW(), 'YYYY-MM-DD'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security (RLS) 활성화 및 전체 CRUD 허용 (쇼핑몰 결제 및 관리자 콘솔 연동)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public insert orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public update orders" ON public.orders;
DROP POLICY IF EXISTS "Allow public delete orders" ON public.orders;

CREATE POLICY "Allow public select orders" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update orders" ON public.orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete orders" ON public.orders FOR DELETE USING (true);

-- 3. 첨부 이미지 기준 3건 주문 초기 데이터 시드 등록
INSERT INTO public.orders (
    id,
    order_number,
    recipient,
    phone,
    address,
    items_summary,
    total_amount,
    status,
    tracking_number,
    order_date,
    created_at
) VALUES 
(
    'ord-1',
    'ORD-1791778541236',
    '홍길동',
    '010-1234-5678',
    '서울시 성동구 성수동 1가 12-34',
    '시그니처 딥핏 코튼 무지 볼캡 외 1건',
    34700,
    'paid',
    'CJ513285123',
    '2026-10-12',
    '2026-10-12T03:00:00Z'
),
(
    'ord-2',
    'ORD-20261005-9921',
    '홍길동',
    '010-1234-5678',
    '서울시 성동구 성수동 1가 12-34',
    '시그니처 딥핏 코튼 무지 볼캡 외 1건',
    29800,
    'paid',
    'CJ68291039401',
    '2026-10-05',
    '2026-10-05T09:00:00Z'
),
(
    'ord-3',
    'ORD-20260928-1102',
    '홍길동',
    '010-1234-5678',
    '서울시 성동구 성수동 1가 12-34',
    '빅사이즈 대두 깊은 사계절 벙거지 버킷햇 외 0건',
    43800,
    'delivered',
    'CJ55192837490',
    '2026-09-28',
    '2026-09-28T14:00:00Z'
)
ON CONFLICT (order_number) DO UPDATE SET
    recipient = EXCLUDED.recipient,
    phone = EXCLUDED.phone,
    items_summary = EXCLUDED.items_summary,
    total_amount = EXCLUDED.total_amount,
    status = EXCLUDED.status,
    tracking_number = EXCLUDED.tracking_number,
    order_date = EXCLUDED.order_date,
    updated_at = NOW();
