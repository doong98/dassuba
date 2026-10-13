'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  MessageSquare,
  Plus,
  Lock,
  Unlock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Search,
  HelpCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  X,
  Send,
} from 'lucide-react';

export interface QnaPost {
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

const CATEGORIES = ['전체', '상품문의', '배송문의', '단체자수', '교환/환불', '기타'];

export default function QnaBoardPage() {
  const { user, openAuthModal } = useAuth();
  const [posts, setPosts] = useState<QnaPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('qna-1');

  // 모달 상태
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formCategory, setFormCategory] = useState('상품문의');
  const [formContent, setFormContent] = useState('');
  const [formIsSecret, setFormIsSecret] = useState(false);
  const [formPassword, setFormPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 글 목록 불러오기
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== '전체') params.append('category', selectedCategory);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/qna?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.posts)) {
        setPosts(data.posts);
        if (data.posts.length > 0 && !expandedId) {
          setExpandedId(data.posts[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch QnA posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleToggleExpand = (id: string, isSecret: boolean) => {
    if (isSecret && user?.role !== 'admin') {
      const pw = prompt('비밀글입니다. 작성 시 설정한 비밀번호를 입력해주세요:');
      if (pw !== null && pw !== '1234') {
        // 비밀번호 데모 검증
        alert('비밀번호가 일치하지 않거나 비공개 글입니다.');
        return;
      }
    }
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // 1:1 문의글 작성 모달 열기 (비로그인 시 로그인 안내)
  const handleOpenWriteModal = () => {
    if (!user) {
      alert('1:1 문의글 작성은 로그인 후 이용하실 수 있습니다.');
      openAuthModal('login');
      return;
    }
    if (user.name) setFormAuthor(user.name);
    setIsWriteModalOpen(true);
  };

  // 질문 등록 처리
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      alert('제목과 문의 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/qna', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          author: formAuthor || (user?.name ? user.name : '고객'),
          category: formCategory,
          content: formContent,
          isSecret: formIsSecret,
          password: formPassword,
        }),
      });

      const data = await res.json();
      if (data.success && data.post) {
        alert('Q&A 질문글이 성공적으로 등록되었습니다!\n담당자가 확인 후 신속하게 답변드리겠습니다.');
        setIsWriteModalOpen(false);
        setFormTitle('');
        setFormContent('');
        setFormPassword('');
        setFormIsSecret(false);
        // 목록 다시 로드 및 최신글 펼치기
        setPosts((prev) => [data.post, ...prev]);
        setExpandedId(data.post.id);
      } else {
        alert(data.error || '질문 등록 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('Submit error:', err);
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* 상단 탭 바로가기: 고객센터 vs Q&A게시판 구분 안내 */}
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
              Q&A 게시판
            </span>
            <Link
              href="/community/cs"
              className="text-xs text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/60 font-semibold px-3 py-1.5 rounded-full transition"
            >
              고객센터 1:1 상담 바로가기 →
            </Link>
          </div>
          <span className="text-xs text-zinc-500 hidden sm:inline-block">
            친절 상담 운영시간: 평일 09:30 ~ 17:30
          </span>
        </div>

        {/* 메인 헤더 (첨부 이미지 디자인 적용) */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-5 border-b border-zinc-200 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-sm shadow-xs">
                💬
              </div>
              Q&A 게시판
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1.5">
              상품, 배송, 단체 자수 제작에 대해 궁금한 점을 질문하시면 전문 상담원이 답변해 드립니다.
            </p>
          </div>

          <button
            onClick={handleOpenWriteModal}
            className="inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition shadow-md hover:shadow-lg shrink-0"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            + 1:1 문의글 작성
          </button>
        </div>

        {/* 카테고리 필터 및 검색창 */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-3.5 py-1.5 rounded-full transition shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-zinc-900 text-white shadow-xs'
                    : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="질문 제목, 내용 검색..."
              className="w-full bg-white text-xs pl-3.5 pr-9 py-2 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 transition shadow-2xs"
            />
            <button
              type="submit"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-800"
              aria-label="검색"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Q&A 게시글 목록 영역 */}
        {loading ? (
          <div className="py-20 text-center text-zinc-400 text-sm">
            Q&A 게시글을 불러오는 중입니다...
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-500 space-y-3">
            <p className="text-base font-bold text-zinc-800">등록된 질문이 없습니다.</p>
            <p className="text-xs text-zinc-400">
              궁금한 점이 있으시다면 상단의 [+ 1:1 문의글 작성] 버튼을 눌러 질문을 남겨보세요.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => {
              const isExpanded = expandedId === post.id;
              const isAnswered = post.status === 'answered';

              return (
                <div
                  key={post.id}
                  className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                    isExpanded
                      ? 'border-zinc-300 shadow-md ring-1 ring-zinc-200'
                      : 'border-zinc-200 shadow-2xs hover:border-zinc-300'
                  }`}
                >
                  {/* 질문 아코디언 헤더 바 (첨부 이미지 형태) */}
                  <div
                    onClick={() => handleToggleExpand(post.id, post.isSecret)}
                    className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none gap-4"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                      {/* 상태 뱃지 */}
                      {isAnswered ? (
                        <span className="inline-flex items-center justify-center bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0">
                          답변완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center bg-zinc-100 text-zinc-600 border border-zinc-200 text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0">
                          답변대기
                        </span>
                      )}

                      {/* 제목 & 비밀글 표시 */}
                      <div className="flex items-center gap-2 truncate">
                        {post.isSecret && (
                          <Lock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                        )}
                        <span
                          className={`text-xs sm:text-sm font-bold truncate ${
                            post.isSecret ? 'text-zinc-600' : 'text-zinc-900'
                          }`}
                        >
                          {post.title}
                        </span>
                      </div>
                    </div>

                    {/* 우측 작성자 & 작성일 & 화살표 */}
                    <div className="flex items-center gap-3 sm:gap-4 text-xs text-zinc-400 shrink-0">
                      <span className="hidden sm:inline">{post.author}</span>
                      <span>{post.createdAt}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-zinc-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* 펼쳐진 본문 내용 */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-zinc-100 space-y-4 text-xs sm:text-sm">
                      {/* 질문 내용 */}
                      <div className="space-y-1.5 pt-2">
                        <p className="font-bold text-zinc-900">문의 내용:</p>
                        <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap pl-1">
                          {post.content}
                        </p>
                      </div>

                      {/* CS 답변 영역 (첨부 이미지의 옐로우 라운드 박스 스타일) */}
                      {post.reply ? (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-2 text-zinc-800 animate-in fade-in duration-150">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900">
                            <CheckCircle2 className="w-4 h-4 text-amber-600" />
                            <span>{post.replyAuthor || '다써바 CS 상담팀 답변'}</span>
                          </div>
                          <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap pl-5 text-xs sm:text-sm">
                            {post.reply}
                          </p>
                        </div>
                      ) : (
                        <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-zinc-500 text-xs flex items-center gap-2">
                          <Clock className="w-4 h-4 text-zinc-400" />
                          <span>
                            현재 담당자가 문의 내용을 확인 중입니다. 빠른 시일 내 성심껏 답변드리겠습니다.
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 글 작성 모달 다이얼로그 */}
        {isWriteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 relative animate-in zoom-in-95">
              <button
                onClick={() => setIsWriteModalOpen(false)}
                className="absolute right-5 top-5 p-1 text-zinc-400 hover:text-zinc-800 rounded-lg"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                  Q&A 1:1 질문하기
                </span>
                <h3 className="text-xl font-black text-zinc-900 mt-2">문의글 작성하기</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  작성하신 질문은 관리자 및 상담원이 확인 후 상세히 답변을 등록해 드립니다.
                </p>
              </div>

              <form onSubmit={handleSubmitPost} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">문의 분류</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-900"
                  >
                    <option value="상품문의">상품문의 (사이즈, 색상, 원단 등)</option>
                    <option value="배송문의">배송문의 (출고일정, 택배사)</option>
                    <option value="단체자수">단체자수 (시안, 대량할인, 로고 ai)</option>
                    <option value="교환/환불">교환/환불 문의</option>
                    <option value="기타">기타 문의</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">작성자</label>
                    <input
                      type="text"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      placeholder="성함을 입력해주세요"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">비밀글 비밀번호 (선택)</label>
                    <input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      placeholder="숫자 4자리"
                      maxLength={8}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">문의 제목</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="예: 모자 20개 단체 자수 주문 시 로고 ai 파일 접수처"
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">문의 내용</label>
                  <textarea
                    rows={4}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="궁금하신 내용을 구체적으로 작성해 주시면 더욱 정확하고 빠른 답변이 가능합니다."
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 focus:outline-none focus:border-zinc-900 resize-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="secretCheck"
                    checked={formIsSecret}
                    onChange={(e) => setFormIsSecret(e.target.checked)}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900 w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="secretCheck" className="text-zinc-600 font-medium cursor-pointer select-none">
                    비밀글로 작성하기 (작성자와 관리자만 확인 가능)
                  </label>
                </div>

                <div className="pt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWriteModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 transition"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5 text-amber-400" />
                    {isSubmitting ? '등록 중...' : '문의글 등록하기'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
