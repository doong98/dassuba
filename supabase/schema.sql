-- ==============================================================================
-- 다써바(DASSEOBA) 모자 전문 온라인 커머스 - Supabase PostgreSQL Schema
-- B2C 모자 쇼핑몰 & 단체 주문/자재 발주 통합 시스템 DDL 명세
-- ==============================================================================

-- 1. PROFILES (사용자 프로필 & 권한 & 적립금)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100),
  phone VARCHAR(50),
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  points INTEGER DEFAULT 2000 CHECK (points >= 0), -- 신규 가입 2,000P 지급
  business_number VARCHAR(50), -- 사업자등록번호 (세금계산서 신청용)
  company_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PRODUCTS (모자 상품 마스터)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  price INTEGER NOT NULL CHECK (price >= 0),
  original_price INTEGER CHECK (original_price >= 0),
  category VARCHAR(50) NOT NULL, -- ballcap, buckethat, beanie, sunvisor, custom
  sub_category VARCHAR(50),
  is_bundle_1plus1 BOOLEAN DEFAULT FALSE,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  badge VARCHAR(20), -- BEST, NEW, 1+1, SALE, CUSTOM
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'soldout', 'hidden')),
  rating NUMERIC(3, 2) DEFAULT 5.0,
  review_count INTEGER DEFAULT 0,
  description TEXT,
  is_custom_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCT_OPTIONS (색상 및 사이즈별 재고 카운트)
CREATE TABLE IF NOT EXISTS public.product_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  color VARCHAR(50) NOT NULL,
  size VARCHAR(50) NOT NULL,
  stock_quantity INTEGER DEFAULT 50 CHECK (stock_quantity >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS (주문 및 결제)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::JSONB, -- 상품 정보, 옵션, 수량 스냅샷
  total_amount INTEGER NOT NULL CHECK (total_amount >= 0),
  discount_amount INTEGER DEFAULT 0,
  used_points INTEGER DEFAULT 0,
  payment_method VARCHAR(50) DEFAULT 'credit_card',
  status VARCHAR(30) DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'preparing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  tracking_number VARCHAR(100),
  shipping_address JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MATERIALS (모자 제작 원부자재 재고)
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL, -- 14수 코튼 원단, 피그먼트 워싱 원단, 플라스틱 스냅, 땀받이 밴드
  code VARCHAR(50) UNIQUE NOT NULL,
  unit VARCHAR(20) DEFAULT 'yd', -- yd, pcs, roll
  current_stock INTEGER DEFAULT 100 CHECK (current_stock >= 0),
  safety_stock INTEGER DEFAULT 30 CHECK (safety_stock >= 0),
  unit_price INTEGER DEFAULT 5000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PURCHASE_ORDERS (원부자재 거래처 발주 관리)
CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_name VARCHAR(100) NOT NULL, -- (주)동대문패브릭, 성수스냅산업
  material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_cost INTEGER NOT NULL CHECK (total_cost >= 0),
  status VARCHAR(30) DEFAULT 'ordered' CHECK (status IN ('ordered', 'received', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. POSTS (Q&A / 자유게시판 / 단체예약 통합)
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_type VARCHAR(30) NOT NULL CHECK (board_type IN ('qna', 'free', 'reservation')),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name VARCHAR(100) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_secret BOOLEAN DEFAULT FALSE,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'confirmed')),
  reply TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- Row Level Security (RLS) 보안 정책
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Profiles: 사용자는 본인 프로필만 수정 가능, 관리자는 전체 접근
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Products & Options: 누구나 조회 가능, 관리자만 등록/수정/삭제
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Anyone can view product options" ON public.product_options FOR SELECT USING (true);

-- Orders: 본인 주문만 조회/생성 가능
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Posts: 비공개 글은 작성자 및 관리자만 조회 가능
CREATE POLICY "Anyone can view public posts" ON public.posts FOR SELECT USING (NOT is_secret OR auth.uid() = user_id);
CREATE POLICY "Users can insert posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 초기 원부자재 시드 데이터
-- ==============================================================================
INSERT INTO public.materials (name, code, unit, current_stock, safety_stock, unit_price)
VALUES 
  ('14수 고밀도 프리미엄 코튼 원단 (블랙)', 'MAT-COT-01', 'yd', 350, 50, 4800),
  ('피그먼트 바이오워싱 원단 (차콜)', 'MAT-WSH-02', 'yd', 180, 40, 6200),
  ('7홀 프리미엄 플라스틱 스냅백 부자재', 'MAT-SNP-03', 'pcs', 1200, 200, 350),
  ('쿨맥스 흡한속건 땀받이 헤드밴드 3.5cm', 'MAT-BND-04', 'yd', 400, 80, 1200),
  ('일본 타지마 자수기용 고광택 자수사 (금사/은사)', 'MAT-EMB-05', 'roll', 65, 20, 8500)
ON CONFLICT (code) DO NOTHING;
