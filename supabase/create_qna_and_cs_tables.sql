-- ==============================================================================
-- 다써바(DASSEOBA) 모자 전문 온라인 커머스
-- 1. Q&A 게시판 (public.qna_posts)
-- 2. 고객센터 1:1 문의 게시판 (public.customer_inquiries)
-- 독립된 2개의 게시판 테이블 생성 및 RLS 정책 DDL
-- Supabase 대시보드 -> SQL Editor 에서 전체 복사 후 [Run]을 눌러 실행해주세요.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Q&A 게시판 테이블 (qna_posts)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.qna_posts (
    id TEXT PRIMARY KEY DEFAULT ('qna-' || substr(md5(random()::text), 1, 8)),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL DEFAULT '고*객',
    category VARCHAR(50) DEFAULT '상품문의',
    content TEXT NOT NULL,
    is_secret BOOLEAN DEFAULT false,
    password VARCHAR(100),
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'answered')),
    reply TEXT,
    reply_author VARCHAR(100) DEFAULT '다써바 CS 상담팀',
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 및 공개 CRUD 허용
ALTER TABLE public.qna_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select qna_posts" ON public.qna_posts;
DROP POLICY IF EXISTS "Allow public insert qna_posts" ON public.qna_posts;
DROP POLICY IF EXISTS "Allow public update qna_posts" ON public.qna_posts;
DROP POLICY IF EXISTS "Allow public delete qna_posts" ON public.qna_posts;

CREATE POLICY "Allow public select qna_posts" ON public.qna_posts FOR SELECT USING (true);
CREATE POLICY "Allow public insert qna_posts" ON public.qna_posts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update qna_posts" ON public.qna_posts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete qna_posts" ON public.qna_posts FOR DELETE USING (true);

-- Q&A 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_qna_posts_created_at ON public.qna_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qna_posts_status ON public.qna_posts(status);

-- Q&A 초기 시드 데이터 (첨부 이미지 기준)
INSERT INTO public.qna_posts (
    id, title, author, category, content, is_secret, status, reply, reply_author, created_at
) VALUES 
(
    'qna-seed-1',
    '모자 20개 단체 자수 주문 시 로고 ai 파일은 어디로 보내나요?',
    '김*호',
    '단체자수',
    '러닝 크루 모자 20개 맞추려고 합니다. 자수 시안 일러스트 파일은 어디로 접수하면 되나요?',
    false,
    'answered',
    '안녕하세요 고객님! [단체주문제작] 메뉴의 무료 견적 신청 폼에 첨부해주시거나 support@dasseoba-cap.com 으로 주문자 성함과 함께 전달해 주시면 24시간 내 3D 렌더링 시안을 보내드립니다.',
    '다써바 CS 상담팀',
    NOW() - INTERVAL '7 days'
),
(
    'qna-seed-2',
    '비밀글입니다. 배송지 변경 요청의 건',
    '이*수',
    '배송문의',
    '주문번호 ORD-20261004 배송지를 회사 주소로 변경 요청드립니다.',
    true,
    'answered',
    '배송지 주소 변경 처리 완료되었습니다. 금일 오후 CJ대한통운으로 출고될 예정입니다.',
    '다써바 CS 상담팀',
    NOW() - INTERVAL '8 days'
),
(
    'qna-seed-3',
    '1+1 기획전 상품 버킷햇과 볼캡을 섞어서 주문해도 되나요?',
    '박*은',
    '상품문의',
    '볼캡 하나 버킷햇 하나 이렇게 두 개 장바구니에 담아도 1+1 할인이 적용되는지 궁금합니다.',
    false,
    'answered',
    '네 고객님! 1+1 뱃지가 부착된 기획전 상품은 종류와 색상에 관계없이 2개 선택 시 자동 묶음 할인이 적용됩니다.',
    '다써바 CS 상담팀',
    NOW() - INTERVAL '10 days'
)
ON CONFLICT (id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 2. 고객센터 1:1 상담 및 문의 게시판 테이블 (customer_inquiries)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_inquiries (
    id TEXT PRIMARY KEY DEFAULT ('cs-' || substr(md5(random()::text), 1, 8)),
    title VARCHAR(255) NOT NULL,
    author VARCHAR(100) NOT NULL DEFAULT '고객',
    phone VARCHAR(50),
    email VARCHAR(255),
    inquiry_type VARCHAR(50) DEFAULT '주문/결제' CHECK (inquiry_type IN ('주문/결제', '배송/교환/반품', '단체자수견적', '회원/포인트', '불만/개선제안', '기타')),
    order_number VARCHAR(100),
    content TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'waiting' CHECK (status IN ('waiting', 'processing', 'completed')),
    answer TEXT,
    responder VARCHAR(100) DEFAULT '다써바 고객지원센터',
    answered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 활성화 및 공개 CRUD 허용
ALTER TABLE public.customer_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public select customer_inquiries" ON public.customer_inquiries;
DROP POLICY IF EXISTS "Allow public insert customer_inquiries" ON public.customer_inquiries;
DROP POLICY IF EXISTS "Allow public update customer_inquiries" ON public.customer_inquiries;
DROP POLICY IF EXISTS "Allow public delete customer_inquiries" ON public.customer_inquiries;

CREATE POLICY "Allow public select customer_inquiries" ON public.customer_inquiries FOR SELECT USING (true);
CREATE POLICY "Allow public insert customer_inquiries" ON public.customer_inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update customer_inquiries" ON public.customer_inquiries FOR UPDATE USING (true);
CREATE POLICY "Allow public delete customer_inquiries" ON public.customer_inquiries FOR DELETE USING (true);

-- 고객센터 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created_at ON public.customer_inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_status ON public.customer_inquiries(status);

-- 고객센터 초기 시드 데이터
INSERT INTO public.customer_inquiries (
    id, title, author, phone, email, inquiry_type, order_number, content, status, answer, responder, answered_at, created_at
) VALUES 
(
    'cs-seed-1',
    '결제 완료 후 세금계산서 발행 관련 문의드립니다.',
    '정*우',
    '010-3344-5566',
    'jung@company.co.kr',
    '주문/결제',
    'ORD-20261010-8812',
    '법인 카드로 결제했는데 지출증빙용 전자세금계산서 중복 발행이 가능한지 문의드립니다.',
    'completed',
    '안녕하세요 고객님, 다써바 고객지원센터입니다.\n신용카드 결제 시에는 카드매출전표가 부가가치세법상 세금계산서 효력을 갖는 정규 영수증으로 인정되어 중복 발행되지 않습니다. 마이페이지 [영수증 출력] 버튼을 통해 매출전표를 즉시 인쇄하실 수 있습니다.',
    '다써바 고객지원센터',
    NOW() - INTERVAL '1 days',
    NOW() - INTERVAL '2 days'
),
(
    'cs-seed-2',
    '모자 50개 단체 자수 퀵서비스 배송 가능 여부',
    '최*진',
    '010-8877-6655',
    'choi@marathon.club',
    '단체자수견적',
    NULL,
    '이번 주 금요일 대회 행사인데 서울 마포구 상암동까지 당일 오토바이 퀵서비스 수령이 가능할까요?',
    'completed',
    '안녕하세요 최*진 고객님!\n네, 단체 자수 제작 완료 후 당일 서울/경기권 오토바이 및 다마스 퀵서비스 직배송이 가능합니다. 주문 시 고객센터(02-1588-9999)로 연락 주시면 운임 착불 또는 사전 정산으로 신속히 발송해 드리겠습니다.',
    '다써바 고객지원센터',
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '4 days'
),
(
    'cs-seed-3',
    '사이즈 미스로 인한 교환 신청 절차 문의',
    '강*호',
    '010-5544-3322',
    'kang@naver.com',
    '배송/교환/반품',
    'ORD-20261008-1123',
    'L 사이즈를 구매했는데 머리둘레가 살짝 작아서 XL로 교환하고 싶습니다. 회수 접수는 어떻게 하나요?',
    'processing',
    '안녕하세요 강*호 고객님, 마이페이지에서 교환 접수해주시면 CJ대한통운 기사님께서 1~2일 내 자동 방문 수거하십니다. 왕복 배송비 6,000원은 안내드린 전용 계좌로 입금해 주시면 확인 즉시 새 상품으로 맞교환 출고됩니다.',
    '다써바 고객지원센터',
    NOW() - INTERVAL '4 hours',
    NOW() - INTERVAL '6 hours'
)
ON CONFLICT (id) DO NOTHING;
