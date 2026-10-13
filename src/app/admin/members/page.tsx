'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldCheck,
  User,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Coins,
  Calendar,
  Mail,
  Phone,
  ArrowUpDown,
  Lock,
  Unlock,
} from 'lucide-react';

interface Member {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'user' | 'admin';
  points: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminMembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<'all' | 'user' | 'admin'>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (selectedRole !== 'all') params.append('role', selectedRole);

      const res = await fetch(`/api/admin/members?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.members)) {
        setMembers(data.members);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [selectedRole]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMembers();
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMsg({ type, text });
    setTimeout(() => {
      setToastMsg(null);
    }, 4000);
  };

  // 회원 권한 변경 핸들러
  const handleRoleChange = async (member: Member, targetRole: 'user' | 'admin') => {
    const roleName = targetRole === 'admin' ? '관리자(Admin)' : '일반회원(User)';
    if (
      !confirm(
        `[회원 권한 변경 확인]\n회원 '${member.name} (${member.email})' 님의 권한을 '${roleName}'(으)로 변경하시겠습니까?\n\n변경 시 Supabase members 테이블 및 Authentication에 즉시 반영됩니다.`
      )
    ) {
      return;
    }

    setUpdatingId(member.id);
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: member.id,
          role: targetRole,
          email: member.email,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', data.message || `권한이 '${roleName}'(으)로 변경되었습니다.`);
        // 로컬 상태 즉시 갱신
        setMembers((prev) =>
          prev.map((m) =>
            m.id === member.id
              ? { ...m, role: targetRole, updatedAt: new Date().toISOString().split('T')[0] }
              : m
          )
        );
      } else {
        showToast('error', data.error || '권한 변경에 실패했습니다.');
      }
    } catch (err: any) {
      showToast('error', '서버 통신 중 오류가 발생했습니다.');
    } finally {
      setUpdatingId(null);
    }
  };

  // 통계 계산
  const totalCount = members.length;
  const adminCount = members.filter((m) => m.role === 'admin').length;
  const userCount = members.filter((m) => m.role === 'user').length;
  const totalPoints = members.reduce((acc, m) => acc + (m.points || 0), 0);

  return (
    <div className="space-y-6">
      {/* 토스트 알림 메시지 */}
      {toastMsg && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-2xl shadow-2xl border text-xs font-bold flex items-center gap-2.5 animate-in slide-in-from-top-4 duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* 1. 페이지 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] bg-amber-400 text-zinc-950 font-black px-2 py-0.5 rounded">
              AUTH & MEMBERS
            </span>
            <span className="text-zinc-400 text-xs font-mono">SUPABASE DB 연동</span>
          </div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight flex items-center gap-2 mt-1">
            <Users className="w-6 h-6 text-zinc-900" /> 회원 및 권한 관리
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            가입된 회원의 정보를 조회하고, 관리자(어드민) 및 일반회원 권한을 실시간으로 부여하거나 수정합니다.
          </p>
        </div>

        <button
          onClick={fetchMembers}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-zinc-100 border border-zinc-300 rounded-xl text-xs font-bold text-zinc-700 transition shadow-2xs self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* 2. 회원 현황 통계 카드 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold">전체 가입 회원</span>
            <Users className="w-4 h-4 text-zinc-600" />
          </div>
          <p className="text-2xl font-black text-zinc-950">{totalCount}명</p>
          <p className="text-[10px] text-zinc-400 mt-1">Supabase DB 등록 계정</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-xs font-bold text-indigo-600">관리자 (ADMIN)</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-950">{adminCount}명</p>
          <p className="text-[10px] text-zinc-400 mt-1">관리자 콘솔 접근 가능</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-bold text-zinc-600">일반 회원 (USER)</span>
            <User className="w-4 h-4 text-zinc-600" />
          </div>
          <p className="text-2xl font-black text-zinc-950">{userCount}명</p>
          <p className="text-[10px] text-zinc-400 mt-1">쇼핑몰 쇼핑 및 구매 이용</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold text-amber-600">누적 지급 적립금</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-zinc-950">{totalPoints.toLocaleString()}P</p>
          <p className="text-[10px] text-zinc-400 mt-1">가입축하금 2,000P 포함</p>
        </div>
      </div>

      {/* 3. 검색 및 필터 툴바 */}
      <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* 권한 탭 필터 */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSelectedRole('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedRole === 'all'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            전체 보기 ({totalCount})
          </button>
          <button
            onClick={() => setSelectedRole('admin')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              selectedRole === 'admin'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            관리자만 ({adminCount})
          </button>
          <button
            onClick={() => setSelectedRole('user')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              selectedRole === 'user'
                ? 'bg-zinc-900 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            일반회원만 ({userCount})
          </button>
        </div>

        {/* 검색 폼 */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="회원 이름 또는 이메일 검색..."
            className="w-full text-xs pl-3.5 pr-10 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-zinc-900 focus:bg-white transition"
          />
          <button
            type="submit"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 4. 회원 목록 테이블 */}
      <div className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-700">
            <thead className="bg-zinc-50 text-zinc-500 uppercase tracking-wider font-bold border-b border-zinc-200">
              <tr>
                <th className="py-3.5 px-4">회원 정보</th>
                <th className="py-3.5 px-4">계정 / 연락처</th>
                <th className="py-3.5 px-4">가입일시</th>
                <th className="py-3.5 px-4 text-right">보유 포인트</th>
                <th className="py-3.5 px-4 text-center">현재 권한</th>
                <th className="py-3.5 px-4 text-center">권한 변경 설정</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-400 font-medium">
                    회원 목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-zinc-400">
                    등록된 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                members.map((member) => {
                  const isAdmin = member.role === 'admin';
                  const isUpdating = updatingId === member.id;

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-zinc-50/80 transition-colors"
                    >
                      {/* 1. 회원 정보 */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isAdmin
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-zinc-200 text-zinc-700'
                            }`}
                          >
                            {member.name ? member.name[0] : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-zinc-900 text-sm flex items-center gap-1.5">
                              {member.name || '무명'}
                              {isAdmin && (
                                <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.2 rounded font-black">
                                  ADMIN
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate max-w-[140px]">
                              ID: {member.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. 계정 / 연락처 */}
                      <td className="py-4 px-4 space-y-1">
                        <p className="font-semibold text-zinc-800 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-zinc-400" />
                          {member.email}
                        </p>
                        <p className="text-[11px] text-zinc-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          {member.phone || '-'}
                        </p>
                      </td>

                      {/* 3. 가입일시 */}
                      <td className="py-4 px-4 text-zinc-500 font-medium">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-zinc-400" />
                          {member.createdAt}
                        </div>
                      </td>

                      {/* 4. 보유 포인트 */}
                      <td className="py-4 px-4 text-right font-mono font-bold text-zinc-900">
                        {member.points.toLocaleString()}P
                      </td>

                      {/* 5. 현재 권한 뱃지 */}
                      <td className="py-4 px-4 text-center">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-800 border border-indigo-200 text-[11px] font-black px-2.5 py-1 rounded-lg">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                            관리자
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 border border-zinc-200 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                            <User className="w-3.5 h-3.5 text-zinc-500" />
                            일반회원
                          </span>
                        )}
                      </td>

                      {/* 6. 권한 변경 설정 액션 */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {isAdmin ? (
                            <button
                              onClick={() => handleRoleChange(member, 'user')}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-300 rounded-xl font-bold text-xs transition flex items-center gap-1 hover:text-zinc-900 disabled:opacity-50"
                              title="일반회원으로 권한 변경"
                            >
                              <User className="w-3.5 h-3.5 text-zinc-500" />
                              {isUpdating ? '변경 중...' : '일반회원으로 변경'}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRoleChange(member, 'admin')}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1 shadow-2xs hover:shadow-sm disabled:opacity-50"
                              title="관리자 권한 부여"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
                              {isUpdating ? '승격 중...' : '관리자로 승격'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
