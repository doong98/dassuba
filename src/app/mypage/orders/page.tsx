'use client';

import React from 'react';
import MyPage from '../page';
import LoginRequired from '@/components/auth/LoginRequired';
import { useAuth } from '@/context/AuthContext';

export default function MyOrdersPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-zinc-950 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginRequired
        pageName="주문배송조회"
        title="주문배송조회 로그인 안내"
        description="주문하신 모자 상품의 실시간 배송 현황 및 배송지 조회를 이용하시려면 먼저 로그인해 주세요."
      />
    );
  }

  return <MyPage />;
}
