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

export interface QnaItem {
  id: string;
  title: string;
  author: string;
  category: string;
  content: string;
  isSecret: boolean;
  status: 'pending' | 'answered';
  reply?: string;
  replyAuthor?: string;
  repliedAt?: string;
  createdAt: string;
}

// Supabase 테이블 미생성 시 안전한 인메모리 Fallback 캐시 (서버 구동 중 유지)
let memoryQnaPosts: QnaItem[] = [
  {
    id: 'qna-1',
    title: '모자 20개 단체 자수 주문 시 로고 ai 파일은 어디로 보내나요?',
    author: '김*호',
    category: '단체자수',
    content: '러닝 크루 모자 20개 맞추려고 합니다. 자수 시안 일러스트 파일은 어디로 접수하면 되나요?',
    isSecret: false,
    status: 'answered',
    reply: '안녕하세요 고객님! [단체주문제작] 메뉴의 무료 견적 신청 폼에 첨부해주시거나 support@dasseoba-cap.com 으로 주문자 성함과 함께 전달해 주시면 24시간 내 3D 렌더링 시안을 보내드립니다.',
    replyAuthor: '다써바 CS 상담팀',
    createdAt: '2026-10-05',
  },
  {
    id: 'qna-2',
    title: '비밀글입니다. 배송지 변경 요청의 건',
    author: '이*수',
    category: '배송문의',
    content: '주문번호 ORD-20261004 배송지를 회사 주소로 변경 요청드립니다.',
    isSecret: true,
    status: 'answered',
    reply: '배송지 주소 변경 처리 완료되었습니다. 금일 오후 CJ대한통운으로 출고될 예정입니다.',
    replyAuthor: '다써바 CS 상담팀',
    createdAt: '2026-10-04',
  },
  {
    id: 'qna-3',
    title: '1+1 기획전 상품 버킷햇과 볼캡을 섞어서 주문해도 되나요?',
    author: '박*은',
    category: '상품문의',
    content: '볼캡 하나 버킷햇 하나 이렇게 두 개 장바구니에 담아도 1+1 할인이 적용되는지 궁금합니다.',
    isSecret: false,
    status: 'answered',
    reply: '네 고객님! 1+1 뱃지가 부착된 기획전 상품은 종류와 색상에 관계없이 2개 선택 시 자동 묶음 할인이 적용됩니다.',
    replyAuthor: '다써바 CS 상담팀',
    createdAt: '2026-10-02',
  },
];

// 1. GET: Q&A 글 목록 조회
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        posts: filterPosts(memoryQnaPosts, category, search),
        fromDb: false,
      });
    }

    const { data, error } = await supabase
      .from('qna_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      // 테이블이 아직 없거나 에러 시 fallback 데이터 반환
      return NextResponse.json({
        success: true,
        posts: filterPosts(memoryQnaPosts, category, search),
        fromDb: false,
        needTable: true,
      });
    }

    const mapped: QnaItem[] = data.map((item: any) => ({
      id: item.id,
      title: item.title,
      author: item.author || '고*객',
      category: item.category || '기타',
      content: item.content,
      isSecret: !!item.is_secret,
      status: item.status || 'pending',
      reply: item.reply || undefined,
      replyAuthor: item.reply_author || '다써바 CS 상담팀',
      repliedAt: item.replied_at || undefined,
      createdAt: item.created_at ? item.created_at.split('T')[0] : '2026-10-12',
    }));

    return NextResponse.json({
      success: true,
      posts: filterPosts(mapped, category, search),
      fromDb: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, posts: memoryQnaPosts },
      { status: 500 }
    );
  }
}

// 2. POST: 새 Q&A 질문글 등록
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, author, category, content, isSecret, password } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '제목과 내용을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const newId = `qna-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const maskedAuthor = author ? maskName(author) : '고*객';

    const newPost: QnaItem = {
      id: newId,
      title: title.trim(),
      author: maskedAuthor,
      category: category || '상품문의',
      content: content.trim(),
      isSecret: !!isSecret,
      status: 'pending',
      createdAt: today,
    };

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('qna_posts')
        .insert({
          id: newId,
          title: newPost.title,
          author: newPost.author,
          category: newPost.category,
          content: newPost.content,
          is_secret: newPost.isSecret,
          password: password || null,
          status: 'pending',
        })
        .select()
        .single();

      if (!error && data) {
        return NextResponse.json({
          success: true,
          post: newPost,
          fromDb: true,
          message: 'Q&A 질문글이 성공적으로 등록되었습니다.',
        });
      }
    }

    // Supabase 테이블 미생성 시 메모리 캐시에 추가
    memoryQnaPosts = [newPost, ...memoryQnaPosts];
    return NextResponse.json({
      success: true,
      post: newPost,
      fromDb: false,
      message: 'Q&A 질문글이 등록되었습니다. (로컬 캐시 반영)',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}

function filterPosts(posts: QnaItem[], category?: string | null, search?: string | null) {
  return posts.filter((p) => {
    if (category && category !== '전체' && p.category !== category) return false;
    if (search && !p.title.includes(search) && !p.content.includes(search)) return false;
    return true;
  });
}

function maskName(name: string) {
  if (!name) return '고*객';
  if (name.length === 1) return name + '*';
  if (name.length === 2) return name[0] + '*';
  return name[0] + '*' + name.slice(2);
}
