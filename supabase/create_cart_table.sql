-- ==============================================================================
-- 다써바(DASSEOBA) 모자 전문 온라인 커머스
-- 장바구니(cart) 테이블 생성 DDL
-- Supabase 인스턴스: https://ibcfzsbgeqsocpbqhzsv.supabase.co
-- Supabase 대시보드 -> SQL Editor 에서 전체 복사 후 [Run]을 눌러 실행해주세요.
-- ==============================================================================

-- 1. cart (장바구니 테이블) 생성
CREATE TABLE IF NOT EXISTS public.cart (
    id TEXT PRIMARY KEY DEFAULT ('cart-' || substr(md5(random()::text), 1, 8)),
    user_id TEXT NOT NULL DEFAULT 'usr-demo-01',
    product_id TEXT NOT NULL,
    title VARCHAR(255) NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    image TEXT,
    color VARCHAR(100) DEFAULT '기본',
    size VARCHAR(100) DEFAULT 'FREE',
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    is_bundle_1plus1 BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_cart_item UNIQUE (user_id, product_id, color, size)
);

-- 2. Row Level Security (RLS) 활성화 및 전체 CRUD 허용
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select cart" ON public.cart;
DROP POLICY IF EXISTS "Allow public insert cart" ON public.cart;
DROP POLICY IF EXISTS "Allow public update cart" ON public.cart;
DROP POLICY IF EXISTS "Allow public delete cart" ON public.cart;

CREATE POLICY "Allow public select cart" ON public.cart FOR SELECT USING (true);
CREATE POLICY "Allow public insert cart" ON public.cart FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update cart" ON public.cart FOR UPDATE USING (true);
CREATE POLICY "Allow public delete cart" ON public.cart FOR DELETE USING (true);

-- 3. 초기 시드 데이터 (데모용 기본 장바구니 2종)
INSERT INTO public.cart (
    id,
    user_id,
    product_id,
    title,
    price,
    image,
    color,
    size,
    quantity,
    is_bundle_1plus1,
    created_at,
    updated_at
) VALUES 
(
    'cart-demo-01',
    'usr-demo-01',
    'prod-1',
    '시그니처 딥핏 코튼 무지 볼캡',
    19800,
    'https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-1-signature-ballcap.png',
    '블랙',
    'FREE (56-60cm)',
    1,
    true,
    NOW(),
    NOW()
),
(
    'cart-demo-02',
    'usr-demo-01',
    'prod-2',
    '빈티지 피그먼트 워싱 로우 볼캡',
    24900,
    'https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-2-vintage-washing-ballcap.png',
    '피그먼트그레이',
    'FREE (56-60cm)',
    1,
    true,
    NOW(),
    NOW()
)
ON CONFLICT (user_id, product_id, color, size) DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    image = EXCLUDED.image,
    quantity = EXCLUDED.quantity,
    is_bundle_1plus1 = EXCLUDED.is_bundle_1plus1,
    updated_at = NOW();
