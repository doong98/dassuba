import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export interface CustomerInquiryItem {
  id: string;
  title: string;
  author: string;
  phone?: string;
  email?: string;
  inquiryType: string;
  orderNumber?: string;
  content: string;
  status: 'waiting' | 'processing' | 'completed';
  answer?: string;
  responder?: string;
  answeredAt?: string;
  createdAt: string;
}

// Supabase 테이블 미생성 시 안전한 인메모리 Fallback 캐시
let memoryCsInquiries: CustomerInquiryItem[] = [
  {
    id: 'cs-1',
    title: '결제 완료 후 세금계산서 발행 관련 문의드립니다.',
    author: '정*우',
    phone: '010-3344-5566',
    email: 'jung@company.co.kr',
    inquiryType: '주문/결제',
    orderNumber: 'ORD-20261010-8812',
    content: '법인 카드로 결제했는데 지출증빙용 전자세금계산서 중복 발행이 가능한지 문의드립니다.',
    status: 'completed',
    answer: '안녕하세요 고객님, 다써바 고객지원센터입니다.\n신용카드 결제 시에는 카드매출전표가 부가가치세법상 세금계산서 효력을 갖는 정규 영수증으로 인정되어 중복 발행되지 않습니다. 마이페이지 [영수증 출력] 버튼을 통해 매출전표를 즉시 인쇄하실 수 있습니다.',
    responder: '다써바 고객지원센터',
    answeredAt: '2026-10-11',
    createdAt: '2026-10-10',
  },
  {
    id: 'cs-2',
    title: '모자 50개 단체 자수 퀵서비스 배송 가능 여부',
    author: '최*진',
    phone: '010-8877-6655',
    email: 'choi@marathon.club',
    inquiryType: '단체자수견적',
    content: '이번 주 금요일 대회 행사인데 서울 마포구 상암동까지 당일 오토바이 퀵서비스 수령이 가능할까요?',
    status: 'completed',
    answer: '안녕하세요 최*진 고객님!\n네, 단체 자수 제작 완료 후 당일 서울/경기권 오토바이 및 다마스 퀵서비스 직배송이 가능합니다. 주문 시 고객센터(02-1588-9999)로 연락 주시면 운임 착불 또는 사전 정산으로 신속히 발송해 드리겠습니다.',
    responder: '다써바 고객지원센터',
    answeredAt: '2026-10-09',
    createdAt: '2026-10-08',
  },
  {
    id: 'cs-3',
    title: '사이즈 미스로 인한 교환 신청 절차 문의',
    author: '강*호',
    phone: '010-5544-3322',
    email: 'kang@naver.com',
    inquiryType: '배송/교환/반품',
    orderNumber: 'ORD-20261008-1123',
    content: 'L 사이즈를 구매했는데 머리둘레가 살짝 작아서 XL로 교환하고 싶습니다. 회수 접수는 어떻게 하나요?',
    status: 'processing',
    answer: '안녕하세요 강*호 고객님, 마이페이지에서 교환 접수해주시면 CJ대한통운 기사님께서 1~2일 내 자동 방문 수거하십니다. 왕복 배송비 6,000원은 안내드린 전용 계좌로 입금해 주시면 확인 즉시 새 상품으로 맞교환 출고됩니다.',
    responder: '다써바 고객지원센터',
    answeredAt: '2026-10-12',
    createdAt: '2026-10-12',
  },
];

// 1. GET: 고객센터 1:1 상담글 목록 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        inquiries: filterInquiries(memoryCsInquiries, type, search),
        fromDb: false,
      });
    }

    const { data, error } = await supabase
      .from('customer_inquiries')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      return NextResponse.json({
        success: true,
        inquiries: filterInquiries(memoryCsInquiries, type, search),
        fromDb: false,
        needTable: true,
      });
    }

    const mapped: CustomerInquiryItem[] = data.map((item: any) => ({
      id: item.id,
      title: item.title,
      author: item.author || '고객',
      phone: item.phone || undefined,
      email: item.email || undefined,
      inquiryType: item.inquiry_type || '기타',
      orderNumber: item.order_number || undefined,
      content: item.content,
      status: item.status || 'waiting',
      answer: item.answer || undefined,
      responder: item.responder || '다써바 고객지원센터',
      answeredAt: item.answered_at ? item.answered_at.split('T')[0] : undefined,
      createdAt: item.created_at ? item.created_at.split('T')[0] : '2026-10-12',
    }));

    return NextResponse.json({
      success: true,
      inquiries: filterInquiries(mapped, type, search),
      fromDb: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, inquiries: memoryCsInquiries },
      { status: 500 }
    );
  }
}

// 2. POST: 새 1:1 고객센터 상담글 작성
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, author, phone, email, inquiryType, orderNumber, content } = body;

    if (!title || !content || !author) {
      return NextResponse.json(
        { success: false, error: '성함, 문의 제목, 내용을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const newId = `cs-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const maskedAuthor = maskName(author);

    const newInquiry: CustomerInquiryItem = {
      id: newId,
      title: title.trim(),
      author: maskedAuthor,
      phone: phone?.trim(),
      email: email?.trim(),
      inquiryType: inquiryType || '주문/결제',
      orderNumber: orderNumber?.trim(),
      content: content.trim(),
      status: 'waiting',
      createdAt: today,
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('customer_inquiries')
        .insert({
          id: newId,
          title: newInquiry.title,
          author: newInquiry.author,
          phone: newInquiry.phone || null,
          email: newInquiry.email || null,
          inquiry_type: newInquiry.inquiryType,
          order_number: newInquiry.orderNumber || null,
          content: newInquiry.content,
          status: 'waiting',
        })
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          inquiry: newInquiry,
          fromDb: true,
          message: '고객센터 1:1 상담 문의가 성공적으로 접수되었습니다.',
        });
      }
    }

    // Supabase 테이블 미생성 시 메모리 캐시에 추가
    memoryCsInquiries = [newInquiry, ...memoryCsInquiries];
    return NextResponse.json({
      success: true,
      inquiry: newInquiry,
      fromDb: false,
      message: '고객센터 상담 문의가 접수되었습니다. (로컬 캐시 반영)',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

function filterInquiries(items: CustomerInquiryItem[], type?: string | null, search?: string | null) {
  return items.filter((item) => {
    if (type && type !== '전체' && item.inquiryType !== type) return false;
    if (search && !item.title.includes(search) && !item.content.includes(search)) return false;
    return true;
  });
}

function maskName(name: string) {
  if (!name) return '고객';
  if (name.length === 1) return name + '*';
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*' + name.slice(2);
}
