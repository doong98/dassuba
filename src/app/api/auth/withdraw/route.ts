import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ibcfzsbgeqsocpbqhzsv.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function getSupabase() {
  if (!supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function DELETE(request: Request) {
  try {
    const { userId, email } = await request.json();

    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: '탈퇴할 사용자 식별자(ID 또는 이메일)가 필요합니다.' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    if (supabase) {
      // 1. members 테이블에서 회원 삭제
      if (userId) {
        await supabase.from('members').delete().eq('id', userId);
      }
      if (email) {
        await supabase.from('members').delete().eq('email', email);
      }

      // 2. 장바구니 및 위시리스트 연관 데이터 정리
      if (userId) {
        try {
          await supabase.from('cart').delete().eq('user_id', userId);
        } catch {}
        try {
          await supabase.from('wishlist').delete().eq('user_id', userId);
        } catch {}
      }
    }

    return NextResponse.json({
      success: true,
      message: '회원 탈퇴 및 계정 정보 삭제가 완료되었습니다.',
    });
  } catch (error: any) {
    console.error('회원 탈퇴 처리 중 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '회원 탈퇴 처리 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
