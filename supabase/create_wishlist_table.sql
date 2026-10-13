-- ==============================================================================
-- 다써바(DASSEOBA) 모자 전문 온라인 커머스
-- 찜한 상품(wishlist) 테이블 생성 DDL
-- Supabase 인스턴스: https://ibcfzsbgeqsocpbqhzsv.supabase.co
-- Supabase 대시보드 -> SQL Editor 에서 전체 복사 후 [Run]을 눌러 실행해주세요.
-- ==============================================================================

-- 1. wishlist (찜한 상품 테이블) 생성
CREATE TABLE IF NOT EXISTS public.wishlist (
    id TEXT PRIMARY KEY DEFAULT ('wish-' || substr(md5(random()::text), 1, 8)),
    user_id TEXT NOT NULL DEFAULT 'usr-demo-01',
    product_id TEXT NOT NULL,
    product_title VARCHAR(255) NOT NULL,
    product_price INTEGER NOT NULL DEFAULT 0,
    product_image TEXT,
    category VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_user_product UNIQUE (user_id, product_id)
);

-- 2. Row Level Security (RLS) 활성화 및 전체 CRUD 허용
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Allow public insert wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Allow public update wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Allow public delete wishlist" ON public.wishlist;

CREATE POLICY "Allow public select wishlist" ON public.wishlist FOR SELECT USING (true);
CREATE POLICY "Allow public insert wishlist" ON public.wishlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update wishlist" ON public.wishlist FOR UPDATE USING (true);
CREATE POLICY "Allow public delete wishlist" ON public.wishlist FOR DELETE USING (true);

-- 3. 초기 시드 데이터 등록 (홍길동 기본 찜 상품 2건)
INSERT INTO public.wishlist (
    id,
    user_id,
    product_id,
    product_title,
    product_price,
    product_image,
    category,
    created_at
) VALUES 
(
    'wish-seed-01',
    'usr-demo-01',
    'prod-best-01',
    '시그니처 딥핏 코튼 무지 볼캡',
    18900,
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600',
    'ballcap',
    NOW()
),
(
    'wish-seed-02',
    'usr-demo-01',
    'prod-bundle-01',
    '[1+1] 시그니처 딥핏 코튼 볼캡 2개 세트',
    29800,
    'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&q=80&w=600',
    'bundle1plus1',
    NOW()
)
ON CONFLICT (user_id, product_id) DO UPDATE SET
    product_title = EXCLUDED.product_title,
    product_price = EXCLUDED.product_price,
    product_image = EXCLUDED.product_image,
    category = EXCLUDED.category;
