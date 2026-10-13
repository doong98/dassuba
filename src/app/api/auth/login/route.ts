import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, asAdmin, isDemo } = await request.json();

    // 1. 데모 모드 빠른 체험
    if (isDemo || asAdmin) {
      return NextResponse.json({
        success: true,
        member: asAdmin
          ? {
              id: 'usr-admin-01',
              email: 'admin@dasseoba.com',
              name: '김관리자',
              role: 'admin',
              points: 50000,
            }
          : {
              id: 'usr-demo-01',
              email: email || 'customer@dasseoba.com',
              name: '홍길동',
              role: 'user',
              points: 2000,
            },
      });
    }

    if (!email) {
      return NextResponse.json({ error: '이메일을 입력해주세요.' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // API 키 검사
    if (!supabaseKey || supabaseKey.includes('placeholder_key') || supabaseKey.includes('dummy')) {
      return NextResponse.json(
        {
          error:
            'Supabase API Key(anon key)가 등록되지 않았습니다. Supabase 대시보드 [Project Settings -> API]의 anon public 키를 .env.local에 입력해주세요.',
          code: 'MISSING_ANON_KEY',
        },
        { status: 401 }
      );
    }

    // Supabase REST API로 members 테이블에서 회원 조회
    const searchUrl = `${supabaseUrl}/rest/v1/members?email=eq.${encodeURIComponent(email)}&select=*`;
    const res = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });

    const responseText = await res.text();
    let members;
    try {
      members = JSON.parse(responseText);
    } catch {
      members = responseText;
    }

    if (!res.ok) {
      if (res.status === 401) {
        return NextResponse.json(
          {
            error: 'Supabase API 키가 유효하지 않습니다 (401 Unauthorized).',
            code: 'INVALID_API_KEY',
          },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: `Supabase 조회 오류: ${responseText}`, code: 'SUPABASE_ERROR' },
        { status: res.status }
      );
    }

    let member = Array.isArray(members) && members.length > 0 ? members[0] : null;

    // Supabase Auth로도 로그인 시도
    let authUser = null;
    try {
      const authRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: supabaseKey,
        },
        body: JSON.stringify({ email, password }),
      });
      if (authRes.ok) {
        const authData = await authRes.json();
        authUser = authData.user;
      }
    } catch {}

    if (!member && !authUser) {
      return NextResponse.json(
        { error: '가입되지 않은 이메일 주소입니다. 회원가입을 먼저 진행해주세요.' },
        { status: 404 }
      );
    }

    if (member && password && member.password && member.password !== password && !authUser) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    const finalMember = {
      id: member?.id || authUser?.id,
      email: member?.email || authUser?.email || email,
      name: member?.name || authUser?.user_metadata?.name || email.split('@')[0],
      phone: member?.phone || authUser?.user_metadata?.phone || null,
      role: member?.role || 'user',
      points: member?.points ?? 2000,
    };

    return NextResponse.json({
      success: true,
      member: finalMember,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
