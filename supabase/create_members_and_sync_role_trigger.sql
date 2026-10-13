-- ==============================================================================
-- 다써바(DASSEOBA) 모자 전문 온라인 커머스
-- 회원(members) 테이블 및 권한 변경 시 Supabase Authentication(auth.users) 자동 동기화 트리거 DDL
-- Supabase 대시보드 -> SQL Editor 에서 전체 복사 후 [Run]을 눌러 실행해주세요.
-- ==============================================================================

-- 1. public.members 테이블 생성 (이미 존재하면 무시)
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) DEFAULT '123456',
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(30) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    points INTEGER NOT NULL DEFAULT 2000,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select members" ON public.members;
DROP POLICY IF EXISTS "Allow public insert members" ON public.members;
DROP POLICY IF EXISTS "Allow public update members" ON public.members;
DROP POLICY IF EXISTS "Allow public delete members" ON public.members;

CREATE POLICY "Allow public select members" ON public.members FOR SELECT USING (true);
CREATE POLICY "Allow public insert members" ON public.members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update members" ON public.members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete members" ON public.members FOR DELETE USING (true);

-- 빠른 조회를 위한 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_members_role ON public.members(role);
CREATE INDEX IF NOT EXISTS idx_members_created_at ON public.members(created_at DESC);

-- 2. members 테이블의 권한(role)이 UPDATE될 때 Supabase Authentication(auth.users)에 실시간 자동 동기화하는 트리거 함수
CREATE OR REPLACE FUNCTION public.handle_sync_member_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- auth.users 테이블에 해당 회원의 UUID가 존재하는 경우, user_metadata 및 app_metadata의 role을 동기화
    UPDATE auth.users
    SET 
        raw_user_meta_data = jsonb_set(COALESCE(raw_user_meta_data, '{}'::jsonb), '{role}', to_jsonb(NEW.role)),
        raw_app_meta_data  = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb),  '{role}', to_jsonb(NEW.role)),
        updated_at = NOW()
    WHERE id = NEW.id;
    
    NEW.updated_at = NOW();
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- 혹시 auth.users 접근 권한 오류가 나더라도 members 테이블의 업데이트는 정상 완료되도록 예외 처리
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 트리거 등록
DROP TRIGGER IF EXISTS trigger_sync_member_role ON public.members;
CREATE TRIGGER trigger_sync_member_role
BEFORE UPDATE OF role ON public.members
FOR EACH ROW
EXECUTE FUNCTION public.handle_sync_member_role_to_auth();

-- 4. 기본 관리자 계정 시드 등록 (admin@dasseoba.com)
INSERT INTO public.members (
    email, password, name, phone, role, points, created_at, updated_at
) VALUES (
    'admin@dasseoba.com',
    'admin123',
    '김관리자',
    '010-9999-8888',
    'admin',
    50000,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE 
SET role = 'admin', updated_at = NOW();
