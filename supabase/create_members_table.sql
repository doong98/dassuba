-- ==============================================================================
-- 다써바(DASSEOBA) 모자 전문 온라인 커머스 - 실제 회원가입 테이블 DDL
-- Supabase 인스턴스: https://ibcfzsbgeqsocpbqhzsv.supabase.co
-- Supabase 대시보드 -> SQL Editor 에서 전체 복사 후 [Run]을 눌러 실행해주세요.
-- ==============================================================================

-- 1. members 테이블 생성 (실제 이메일, 비밀번호, 닉네임, 적립금 2,000P 저장)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- 회원 비밀번호
    name VARCHAR(100) NOT NULL,     -- 회원 이름/닉네임
    phone VARCHAR(50),              -- 연락처
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    points INTEGER DEFAULT 2000 CHECK (points >= 0), -- 신규 가입 2,000P 축하금
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Row Level Security (RLS) 활성화 및 익명(anon) 권한 부여
-- 누구나 회원가입(INSERT)하고 본인 계정으로 로그인(SELECT)할 수 있도록 정책 수립
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (중복 방지)
DROP POLICY IF EXISTS "Allow public insert members" ON public.members;
DROP POLICY IF EXISTS "Allow public select members" ON public.members;
DROP POLICY IF EXISTS "Allow public update members" ON public.members;

-- 모든 사용자(익명 포함)가 회원가입할 수 있도록 허용
CREATE POLICY "Allow public insert members" 
ON public.members FOR INSERT 
WITH CHECK (true);

-- 로그인 검증 및 조회를 위해 SELECT 허용
CREATE POLICY "Allow public select members" 
ON public.members FOR SELECT 
USING (true);

-- 포인트 차감 및 프로필 수정을 위해 UPDATE 허용
CREATE POLICY "Allow public update members" 
ON public.members FOR UPDATE 
USING (true);

-- 3. 테스트용 초기 관리자/사용자 계정 등록 (기존에 없을 시)
INSERT INTO public.members (email, password, name, phone, role, points)
VALUES 
    ('admin@dasseoba.com', 'admin123', '김관리자', '010-9999-8888', 'admin', 50000),
    ('customer@dasseoba.com', 'user123', '홍길동', '010-1234-5678', 'user', 2000)
ON CONFLICT (email) DO NOTHING;

-- 4. 생성된 회원 목록 확인 쿼리
SELECT id, email, password, name, role, points, created_at FROM public.members;
