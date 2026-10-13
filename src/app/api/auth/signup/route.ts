import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, name, phone } = await request.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: '이메일과 성함을 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // 1. API 키 설정 여부 검사
    if (!supabaseKey || supabaseKey.includes('placeholder_key') || supabaseKey.includes('dummy')) {
      return NextResponse.json(
        {
          error:
            'Supabase API Key(anon key)가 등록되지 않았습니다. .env.local 파일을 확인해주세요.',
          code: 'MISSING_ANON_KEY',
        },
        { status: 401 }
      );
    }

    let authUserId: string | null = null;

    // 2. [Supabase Authentication (auth.users)] 에 회원 등록 (필수)
    const authRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        email,
        password: password || '123456',
        data: {
          name,
          phone: phone || null,
        },
      }),
    });

    const authData = await authRes.json();

    if (!authRes.ok) {
      // 이미 등록된 사용자
      if (
        authData.msg?.includes('User already registered') ||
        authData.error_description?.includes('already registered')
      ) {
        return NextResponse.json(
          { error: '이미 Supabase Authentication에 등록된 이메일 주소입니다.', code: 'USER_EXISTS' },
          { status: 409 }
        );
      }

      // 이메일 발송 제한(Rate Limit) 초과
      if (
        authData.error_code === 'over_email_send_rate_limit' ||
        authData.msg?.includes('rate limit')
      ) {
        return NextResponse.json(
          {
            error:
              'Supabase Authentication의 무료 이메일 발송 제한에 도달했습니다.\nSupabase 대시보드 [Authentication > Providers > Email]에서 "Confirm email" 옵션을 꺼주시면(OFF) 제한 없이 즉시 가입됩니다.',
            code: 'RATE_LIMIT_EXCEEDED',
          },
          { status: 429 }
        );
      }

      // 유효하지 않은 이메일 형식 (도메인 등)
      if (authData.error_code === 'email_address_invalid' || authData.msg?.includes('invalid')) {
        return NextResponse.json(
          {
            error: '유효한 이메일 형식(예: user@gmail.com, user@naver.com 등)을 입력해주세요.',
            code: 'INVALID_EMAIL',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error: `Supabase Authentication 등록 오류: ${authData.msg || authData.message || JSON.stringify(authData)}`,
          code: 'AUTH_REGISTRATION_FAILED',
        },
        { status: 400 }
      );
    }

    // authData에서 UUID 추출 (autoconfirm 여부에 따라 user.id 또는 id)
    authUserId = authData?.user?.id || authData?.id || null;

    // 3. [public.members] 테이블에도 동일한 계정 정보 저장
    const memberPayload: Record<string, any> = {
      email,
      password: password || '123456',
      name,
      phone: phone || null,
      role: 'user',
      points: 2000,
    };

    // Auth에서 발급된 UUID가 있으면 동일한 ID로 매핑
    if (authUserId) {
      memberPayload.id = authUserId;
    }

    const insertRes = await fetch(`${supabaseUrl}/rest/v1/members`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: 'return=representation',
      },
      body: JSON.stringify(memberPayload),
    });

    const responseText = await insertRes.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!insertRes.ok) {
      // 409 Conflict 또는 중복 에러
      if (
        insertRes.status === 409 ||
        responseText.includes('duplicate key') ||
        responseText.includes('23505')
      ) {
        return NextResponse.json(
          {
            error: '이미 등록된 이메일 주소입니다. 다른 이메일로 가입해주세요.',
            code: 'DUPLICATE_EMAIL',
          },
          { status: 409 }
        );
      }

      // 만약 members 테이블 에러여도 Auth 등록은 성공했을 수 있으므로 확인
      if (authUserId) {
        return NextResponse.json({
          success: true,
          member: {
            id: authUserId,
            email,
            name,
            phone: phone || null,
            role: 'user',
            points: 2000,
          },
        });
      }

      return NextResponse.json(
        {
          error: `Supabase 저장 실패: ${typeof responseData === 'object' ? responseData.message || JSON.stringify(responseData) : responseData}`,
          code: 'SUPABASE_ERROR',
        },
        { status: insertRes.status }
      );
    }

    // 성공적으로 반환된 행 확인
    const member = Array.isArray(responseData) ? responseData[0] : responseData;
    return NextResponse.json({
      success: true,
      member: {
        id: member.id || authUserId,
        email: member.email,
        name: member.name,
        phone: member.phone,
        role: member.role || 'user',
        points: member.points ?? 2000,
      },
      authRegistered: Boolean(authUserId),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
