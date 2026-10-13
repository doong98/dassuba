-- ==============================================================================
-- 다써바(DASSEOBA) 모자 전문 온라인 커머스 - products 테이블 생성 및 초기 데이터 DDL
-- Supabase 인스턴스: https://ibcfzsbgeqsocpbqhzsv.supabase.co
-- Supabase 대시보드 -> SQL Editor 에서 전체 복사 후 [Run]을 눌러 실행해주세요.
-- ==============================================================================

-- 1. products 테이블 생성
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod-' || substr(md5(random()::text), 1, 8)),
    title VARCHAR(200) NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    original_price INTEGER CHECK (original_price >= 0),
    category VARCHAR(50) NOT NULL, -- ballcap, buckethat, beanie, sunvisor, custom
    sub_category VARCHAR(50),
    is_bundle_1plus1 BOOLEAN DEFAULT FALSE,
    is_custom_available BOOLEAN DEFAULT TRUE,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    colors TEXT[] DEFAULT ARRAY[]::TEXT[],
    sizes TEXT[] DEFAULT ARRAY[]::TEXT[],
    badge VARCHAR(20), -- BEST, NEW, 1+1, SALE, CUSTOM
    rating NUMERIC(3, 2) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'soldout', 'hidden')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security (RLS) 활성화 및 전체 CRUD 허용 (관리자 콘솔 및 쇼핑몰 익명 접속 허용)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public update products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete products" ON public.products;

-- 상품 목록 조회: 누구나 가능
CREATE POLICY "Allow public select products" 
ON public.products FOR SELECT 
USING (true);

-- 신규 상품 등록: 누구나(익명/관리자) 가능
CREATE POLICY "Allow public insert products" 
ON public.products FOR INSERT 
WITH CHECK (true);

-- 상품 정보 수정: 누구나 가능
CREATE POLICY "Allow public update products" 
ON public.products FOR UPDATE 
USING (true);

-- 상품 삭제: 누구나 가능
CREATE POLICY "Allow public delete products" 
ON public.products FOR DELETE 
USING (true);

-- 3. 이미지에 표시된 8개 마스터 상품 초기 데이터 시드 등록
INSERT INTO public.products (
    id,
    title,
    price,
    original_price,
    category,
    sub_category,
    is_bundle_1plus1,
    is_custom_available,
    images,
    colors,
    sizes,
    badge,
    rating,
    review_count,
    description
) VALUES 
(
    'prod-1',
    '시그니처 딥핏 코튼 무지 볼캡',
    19800,
    28000,
    'ballcap',
    'basic',
    TRUE,
    TRUE,
    ARRAY['https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-1-signature-ballcap.png'],
    ARRAY['화이트', '블랙', '네이비'],
    ARRAY['FREE (56-60cm)', '빅사이즈 (59-63cm)'],
    'BEST',
    4.9,
    1420,
    '머리가 쏙 들어가는 깊은 크라운과 미니멀 하트 자수 포인트의 클래식 핏'
),
(
    'prod-2',
    '빈티지 피그먼트 워싱 로우 볼캡',
    24900,
    32000,
    'ballcap',
    'washing',
    TRUE,
    TRUE,
    ARRAY['https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-2-vintage-washing-ballcap.png'],
    ARRAY['라이트블루', '인디고', '빈티지데님'],
    ARRAY['FREE (56-60cm)'],
    '1+1',
    4.8,
    890,
    '자연스러운 빈티지 데님 무드의 후가공 워싱 볼캡'
),
(
    'prod-3',
    '와이드 브림 사파리 아웃도어 스트랩 버킷햇',
    26500,
    35000,
    'buckethat',
    'safari',
    FALSE,
    FALSE,
    ARRAY['https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-3-safari-buckethat.jpg'],
    ARRAY['카키', '블랙', '베이지'],
    ARRAY['M (56-58cm)', 'L (58-61cm)'],
    'BEST',
    4.9,
    654,
    '생활 방수 원단과 턱끈 스트랩으로 등산, 캠핑, 야외활동 최적화'
),
(
    'prod-4',
    '빅사이즈 대두 깊은 사계절 벙거지 버킷햇',
    21900,
    29000,
    'buckethat',
    'casual',
    TRUE,
    TRUE,
    ARRAY['https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-4-bigsize-buckethat.png'],
    ARRAY['올리브카키', '블랙', '베이지'],
    ARRAY['L (58-60cm)', 'XL (61-64cm)'],
    '1+1',
    4.95,
    1120,
    '큰 머리도 넉넉하게 감싸주는 여유 있는 둘레와 높이의 사계절 버킷햇'
),
(
    'prod-5',
    '데일리 소프트 골지 숏비니 와치캡',
    14900,
    19000,
    'beanie',
    'short',
    TRUE,
    TRUE,
    ARRAY['https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-5-daily-ribbed-beanie.png'],
    ARRAY['차콜', '블랙', '오렌지', '그린', '오트밀'],
    ARRAY['FREE'],
    '1+1',
    4.7,
    432,
    '조임 없이 편안한 스판 골지 조직의 스트릿 숏비니'
),
(
    'prod-6',
    '프로 에어로 쿨링 골프/테니스 선바이저 썬캡',
    22000,
    30000,
    'sunvisor',
    'golf',
    FALSE,
    TRUE,
    ARRAY['https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-6-cooling-sunvisor.jpg'],
    ARRAY['화이트', '블랙', '네이비'],
    ARRAY['FREE (벨크로 조절)'],
    'NEW',
    4.85,
    290,
    '이마 땀받이 쿨맥스 밴드 장착 및 UV 99.9% 자외선 완벽 차단'
),
(
    'prod-7',
    '프리미엄 멜톤 플랫 스냅백 캡',
    27900,
    36000,
    'ballcap',
    'snapback',
    FALSE,
    TRUE,
    ARRAY['https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-7-melton-snapback.jpg'],
    ARRAY['블랙', '헤더그레이'],
    ARRAY['FREE (스냅 조절)'],
    'NEW',
    4.6,
    180,
    '각이 무너지지 않는 하드 프론트 크라운 스냅백'
),
(
    'prod-8',
    '초경량 캠프캡 나일론 5패널 제트캡',
    23500,
    31000,
    'ballcap',
    'campcap',
    TRUE,
    TRUE,
    ARRAY['https://ibcfzsbgeqsocpbqhzsv.supabase.co/storage/v1/object/public/products/prod-8-lightweight-campcap.jpg'],
    ARRAY['세이지그린', '스톤블랙', '샌드베이지'],
    ARRAY['FREE (버클 스트랩)'],
    '1+1',
    4.88,
    512,
    '가볍고 물에 젖어도 빠르게 마르는 기능성 아웃도어 제트캡'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    price = EXCLUDED.price,
    original_price = EXCLUDED.original_price,
    category = EXCLUDED.category,
    sub_category = EXCLUDED.sub_category,
    is_bundle_1plus1 = EXCLUDED.is_bundle_1plus1,
    is_custom_available = EXCLUDED.is_custom_available,
    images = EXCLUDED.images,
    colors = EXCLUDED.colors,
    sizes = EXCLUDED.sizes,
    badge = EXCLUDED.badge,
    rating = EXCLUDED.rating,
    review_count = EXCLUDED.review_count,
    description = EXCLUDED.description,
    updated_at = NOW();

-- 4. Supabase Storage [products] 버킷 생성 및 이미지 업로드 정책 설정
INSERT INTO storage.buckets (id, name, public) 
VALUES ('products', 'products', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 누구나 업로드된 상품 이미지 조회 가능
DROP POLICY IF EXISTS "Public Access products images" ON storage.objects;
CREATE POLICY "Public Access products images" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'products');

-- 누구나(익명/관리자) 상품 이미지 업로드 가능
DROP POLICY IF EXISTS "Public Upload products images" ON storage.objects;
CREATE POLICY "Public Upload products images" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'products');

-- 이미지 수정 및 삭제 허용
DROP POLICY IF EXISTS "Public Update products images" ON storage.objects;
CREATE POLICY "Public Update products images" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'products');

DROP POLICY IF EXISTS "Public Delete products images" ON storage.objects;
CREATE POLICY "Public Delete products images" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'products');

-- 5. 등록된 상품 확인
SELECT id, title, category, price, is_bundle_1plus1, is_custom_available, created_at FROM public.products ORDER BY created_at ASC;
