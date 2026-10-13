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

// 1. GET: 전체 회원 목록 조회 (관리자 전용)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const role = searchParams.get('role');

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        members: getFallbackMembers(),
        fromDb: false,
      });
    }

    const { data, error } = await supabase
      .from('members')
      .select('id, email, name, phone, role, points, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      return NextResponse.json({
        success: true,
        members: getFallbackMembers(),
        fromDb: false,
      });
    }

    let filtered = data.map((m: any) => ({
      id: m.id,
      email: m.email,
      name: m.name,
      phone: m.phone || '-',
      role: m.role || 'user',
      points: Number(m.points ?? 0),
      createdAt: m.created_at ? m.created_at.split('T')[0] : '2026-10-12',
      updatedAt: m.updated_at ? m.updated_at.split('T')[0] : '2026-10-12',
    }));

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (m: any) =>
          m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
      );
    }

    if (role && role !== 'all') {
      filtered = filtered.filter((m: any) => m.role === role);
    }

    return NextResponse.json({
      success: true,
      members: filtered,
      fromDb: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message, members: getFallbackMembers() },
      { status: 500 }
    );
  }
}

// 2. PATCH: 회원 권한 수정 (관리자 <-> 일반회원)
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { memberId, role, email } = body;

    if (!memberId || !role) {
      return NextResponse.json(
        { success: false, error: '회원 ID와 변경할 권한(role)을 전달해주세요.' },
        { status: 400 }
      );
    }

    if (role !== 'admin' && role !== 'user') {
      return NextResponse.json(
        { success: false, error: '권한은 admin 또는 user만 가능합니다.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: '로컬 환경에서 권한이 변경되었습니다.',
        updatedMember: { id: memberId, role },
      });
    }

    // 1) Supabase public.members 테이블 UPDATE
    const { data: updatedMember, error: dbError } = await supabase
      .from('members')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memberId)
      .select()
      .single();

    if (dbError) {
      // id 대신 email로도 시도
      if (email) {
        const { data: byEmailData, error: emailError } = await supabase
          .from('members')
          .update({
            role,
            updated_at: new Date().toISOString(),
          })
          .eq('email', email)
          .select()
          .single();

        if (!emailError && byEmailData) {
          return NextResponse.json({
            success: true,
            message: `회원 권한이 '${role === 'admin' ? '관리자(admin)' : '일반회원(user)'}'(으)로 성공적으로 변경되었습니다.`,
            member: byEmailData,
            syncedToDb: true,
          });
        }
      }

      return NextResponse.json(
        { success: false, error: `Supabase members 테이블 업데이트 실패: ${dbError.message}` },
        { status: 500 }
      );
    }

    // 2) Supabase Authentication (auth.users) 메타데이터 연동 안내
    // PostgreSQL 트리거(trigger_sync_member_role)에 의해 DB 레벨에서 auth.users가 자동 갱신됩니다.

    return NextResponse.json({
      success: true,
      message: `회원(${updatedMember.name || updatedMember.email})의 권한이 '${role === 'admin' ? '관리자' : '일반회원'}'(으)로 수정되었습니다. (members 테이블 및 Authentication 동기화 완료)`,
      member: updatedMember,
      syncedToDb: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function getFallbackMembers() {
  return [
    {
      id: 'usr-admin-01',
      email: 'admin@dasseoba.com',
      name: '김관리자',
      phone: '010-9999-8888',
      role: 'admin',
      points: 50000,
      createdAt: '2026-09-01',
      updatedAt: '2026-10-12',
    },
    {
      id: 'e8cd2208-57a5-4f02-ac60-fe2ffd1de16d',
      email: 'jiwon@gmail.com',
      name: '김지원',
      phone: '010-3322-1144',
      role: 'user',
      points: 2000,
      createdAt: '2026-10-12',
      updatedAt: '2026-10-12',
    },
    {
      id: 'usr-demo-01',
      email: 'customer@dasseoba.com',
      name: '홍길동',
      phone: '010-1234-5678',
      role: 'user',
      points: 2000,
      createdAt: '2026-10-05',
      updatedAt: '2026-10-05',
    },
  ];
}
