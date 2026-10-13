-- ==============================================================================
-- 다써바(DASSEOBA) 모자 전문 온라인 커머스
-- orders 테이블에 토스페이먼츠(Toss Payments) 결제 및 환불 필드 추가 DDL
-- Supabase 인스턴스: https://ibcfzsbgeqsocpbqhzsv.supabase.co
-- ==============================================================================

-- 1. status 체크 제약조건 갱신 (pending, failed 포함)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'refunded', 'cancelled', 'failed'));

-- 2. 토스 결제 및 정산, 환불 관련 컬럼 추가 (없으면 추가)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_key VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cancel_reason TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS used_points INTEGER DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_note TEXT;

-- 3. 빠른 조회를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_payment_key ON public.orders(payment_key);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
