'use client';

import React, { useState } from 'react';
import { X, Sparkles, Lock, Mail, User, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, signup } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // authModalMode 또는 모달 열림 상태 변경 시 입력값 초기화
  React.useEffect(() => {
    setMode(authModalMode);
    setErrorMsg('');
    setEmail('');
    setName('');
    setPassword('');
  }, [authModalMode, isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (mode === 'login') {
      if (!email) {
        setErrorMsg('이메일을 입력해주세요.');
        return;
      }
      const res = await login(email, password);
      if (!res.success) {
        setErrorMsg(res.error || '로그인에 실패했습니다.');
      }
    } else {
      if (!email || !name) {
        setErrorMsg('이메일과 성함을 모두 입력해주세요.');
        return;
      }
      const res = await signup(email, name, password);
      if (res.success) {
        setSuccessNotice('회원가입이 완료되었습니다! 2,000P가 적립되었습니다.');
        setTimeout(() => {
          setSuccessNotice('');
          closeAuthModal();
        }, 1200);
      } else {
        setErrorMsg(res.error || '회원가입에 실패했습니다.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 백드롭 */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closeAuthModal}
      />

      {/* 모달 창 */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="bg-zinc-950 text-white p-6 relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-5 right-5 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="font-black text-xl tracking-tight text-white">DASSEOBA</span>
          </div>

          <h3 className="text-xl font-black text-white">
            {mode === 'login' ? '로그인' : '간편 회원가입'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {mode === 'login'
              ? '다써바 회원 전용 적립금과 1+1 특별 혜택을 누려보세요.'
              : '지금 가입하면 즉시 사용 가능한 2,000P 적립금을 지급합니다!'}
          </p>
        </div>

        {/* 탭 전환 */}
        <div className="grid grid-cols-2 border-b border-zinc-200 text-sm font-bold text-center">
          <button
            onClick={() => setMode('login')}
            className={`py-3 transition ${
              mode === 'login'
                ? 'border-b-2 border-zinc-950 text-zinc-950 bg-zinc-50/50'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            로그인
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`py-3 flex items-center justify-center gap-1.5 transition ${
              mode === 'signup'
                ? 'border-b-2 border-zinc-950 text-zinc-950 bg-zinc-50/50'
                : 'text-zinc-400 hover:text-zinc-600'
            }`}
          >
            <span>회원가입</span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1 rounded font-bold">
              +2,000P
            </span>
          </button>
        </div>

        {/* 본문 폼 */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl space-y-1.5 leading-relaxed">
              <div className="flex items-start gap-2 font-bold text-rose-800">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>회원가입 요청 처리 불가</span>
              </div>
              <p className="pl-6 text-[11px] text-rose-700 font-medium whitespace-pre-line">
                {errorMsg}
              </p>
            </div>
          )}

          {successNotice && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-zinc-700 mb-1">성함 / 닉네임</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full text-xs pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">이메일 주소</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full text-xs pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">비밀번호</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:border-zinc-900 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="auth-submit-btn"
              className="w-full py-3 bg-zinc-950 hover:bg-zinc-800 text-white font-black text-sm rounded-xl transition shadow-md mt-2 flex items-center justify-center gap-1.5"
            >
              {mode === 'login' ? '로그인' : '2,000P 받고 회원가입'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
