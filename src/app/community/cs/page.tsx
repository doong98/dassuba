'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Headphones,
  Phone,
  Clock,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock3,
  AlertCircle,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  FileQuestion,
  HelpCircle,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import LoginRequired from '@/components/auth/LoginRequired';

export interface CustomerInquiry {
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

const INQUIRY_TYPES = [
  '전체',
  '주문/결제',
  '배송/교환/반품',
  '단체자수견적',
  '회원/포인트',
  '불만/개선제안',
  '기타',
];

const FAQ_LIST = [
  {
    q: '주문 후 배송은 며칠 정도 소요되나요?',
    a: '평일 오후 4시 이전 결제 완료 건은 당일 즉시 우체국/CJ대한통운을 통해 출고되며, 대부분 다음 날(1~2일 내) 수령하실 수 있습니다. 단체 자수 맞춤 제작 상품은 디자인 시안 확정 후 2~3일의 제작 기간이 소요됩니다.',
  },
  {
    q: '1+1 기획전 상품은 색상이나 스타일을 교차 선택할 수 있나요?',
    a: '네, 가능합니다! [1+1 기획전] 뱃지가 붙은 상품들은 볼캡, 버킷햇 등 종류나 색상이 달라도 2개 선택 시 자동 특가 묶음 할인이 적용됩니다.',
  },
  {
    q: '단체 자수 제작의 최소 주문 수량과 견적 기준이 어떻게 되나요?',
    a: '다써바는 자체 컴퓨터 직자수기를 보유하여 1장 샘플 제작부터 1,000장 이상 대량 생산까지 모두 가능합니다. 10개 이상부터 단체 할인율이 적용되며 [단체주문제작] 메뉴에서 1분 만에 실시간 무료 시안을 받아보실 수 있습니다.',
  },
  {
    q: '교환 및 반품 절차는 어떻게 진행되나요?',
    a: '상품 수령 후 7일 이내 마이페이지의 [주문배송조회]에서 즉시 교환/반품 신청이 가능합니다. 지정 택배 기사님이 영업일 기준 1~2일 내 방문 수거하며, 단순 변심 시 왕복 배송비 6,000원이 발생합니다.',
  },
  {
    q: '세금계산서나 현금영수증 발행은 어떻게 하나요?',
    a: '신용카드 결제 시에는 카드매출전표가 정규 세금계산서 효력을 가집니다. 무통장 입금 또는 가상계좌 결제 고객님은 주문서 작성 시 현금영수증(소득공제/지출증빙) 번호를 입력하시면 국세청으로 자동 발급됩니다.',
  },
];

export default function CustomerServicePage() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'inquiry' | 'faq'>('inquiry');
  const [inquiries, setInquiries] = useState<CustomerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('cs-1');
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  // 1:1 상담 작성 모달 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formType, setFormType] = useState('주문/결제');
  const [formOrderNumber, setFormOrderNumber] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedType !== '전체') params.append('type', selectedType);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/cs?${params.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.inquiries)) {
        setInquiries(data.inquiries);
        if (data.inquiries.length > 0 && !expandedId) {
          setExpandedId(data.inquiries[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch CS inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'inquiry') {
      fetchInquiries();
    }
  }, [activeTab, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInquiries();
  };

  const handleCreateInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTitle.trim() || !formContent.trim()) {
      alert('성함, 문의 제목, 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: formName,
          phone: formPhone,
          email: formEmail,
          inquiryType: formType,
          orderNumber: formOrderNumber,
          title: formTitle,
          content: formContent,
        }),
      });

      const data = await res.json();
      if (data.success && data.inquiry) {
        alert('고객센터 1:1 상담 문의가 성공적으로 접수되었습니다!\n담당 상담원이 확인 후 빠른 시일 내 연락 및 답변을 드리겠습니다.');
        setIsModalOpen(false);
        setFormTitle('');
        setFormContent('');
        setFormOrderNumber('');
        // 목록 갱신 및 최신글 펼치기
        setInquiries((prev) => [data.inquiry, ...prev]);
        setExpandedId(data.inquiry.id);
      } else {
        alert(data.error || '접수 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('CS Submit error:', err);
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: CustomerInquiry['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> 답변완료
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-blue-200">
            <Clock3 className="w-3 h-3 text-blue-600" /> 처리중
          </span>
        );
      case 'waiting':
      default:
        return (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-md border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" /> 접수대기
          </span>
        );
    }
  };

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
        pageName="1:1 문의"
        title="1:1 문의 로그인 안내"
        description="고객센터 1:1 전담 상담 내역 및 실시간 답변을 확인하시려면 먼저 로그인해 주세요."
      />
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* 상단 네비게이션: Q&A게시판 vs 고객센터 구분 링크 */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
          <div className="flex items-center gap-2">
            <span className="bg-zinc-950 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-xs">
              <Headphones className="w-3.5 h-3.5 text-amber-400" />
              다써바 고객센터 (CS Center)
            </span>
            <Link
              href="/community/qna"
              className="text-xs text-zinc-500 hover:text-zinc-950 hover:bg-zinc-200/60 font-semibold px-3 py-1.5 rounded-full transition"
            >
              상품 Q&A 게시판 바로가기 →
            </Link>
          </div>
          <span className="text-xs text-zinc-500 hidden sm:inline-block">
            고객 전담 상담창구
          </span>
        </div>

        {/* 1. 고객센터 공식 대표 배너 */}
        <div className="bg-zinc-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="bg-amber-400 text-zinc-950 text-xs font-black px-2.5 py-0.5 rounded-md">
                  CS CENTER
                </span>
                <span className="text-zinc-400 text-xs">고객 감동 1:1 맞춤 지원</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
                무엇을 도와드릴까요?
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-xl leading-relaxed">
                주문 결제, 배송 조회, 단체 자수 맞춤 견적, 교환 및 환불 등 궁금하신 점을 1:1로 신속하고 친절하게 해결해 드립니다.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-zinc-300">
                <span className="flex items-center gap-1.5 font-bold text-amber-400 text-sm">
                  <Phone className="w-4 h-4" /> 02-1588-9999
                </span>
                <span className="text-zinc-600">|</span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <Clock className="w-3.5 h-3.5" /> 평일 09:30 ~ 17:30 (점심 12:30 ~ 13:30)
                </span>
                <span className="text-zinc-600">|</span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <Mail className="w-3.5 h-3.5" /> support@dasseoba-cap.com
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                if (user?.name) setFormName(user.name);
                if (user?.email) setFormEmail(user.email);
                setIsModalOpen(true);
              }}
              className="bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black text-sm px-6 py-4 rounded-2xl transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2 shrink-0 self-start md:self-center"
            >
              <Plus className="w-4 h-4" />
              1:1 고객센터 상담 접수
            </button>
          </div>

          {/* 배경 그라데이션 장식 */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* 2. 탭 메뉴: 1:1 상담 게시판 vs FAQ */}
        <div className="flex border-b border-zinc-200 gap-6">
          <button
            onClick={() => setActiveTab('inquiry')}
            className={`pb-3 font-bold text-sm sm:text-base transition relative flex items-center gap-2 ${
              activeTab === 'inquiry'
                ? 'text-zinc-950 border-b-2 border-zinc-950'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            1:1 고객 상담 게시판 ({inquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`pb-3 font-bold text-sm sm:text-base transition relative flex items-center gap-2 ${
              activeTab === 'faq'
                ? 'text-zinc-950 border-b-2 border-zinc-950'
                : 'text-zinc-400 hover:text-zinc-700'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            자주 묻는 질문 (FAQ)
          </button>
        </div>

        {/* 3. 본문 컨텐츠 */}
        {activeTab === 'inquiry' ? (
          <div className="space-y-6">
            {/* 상담 유형 필터 & 검색 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                {INQUIRY_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full transition shrink-0 ${
                      selectedType === type
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-100'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="상담 제목, 내용 검색..."
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

            {/* 상담 목록 리스트 */}
            {loading ? (
              <div className="py-20 text-center text-zinc-400 text-sm">
                고객센터 상담 목록을 불러오는 중입니다...
              </div>
            ) : inquiries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200 p-12 text-center text-zinc-500 space-y-3">
                <p className="text-base font-bold text-zinc-800">등록된 고객 상담 내역이 없습니다.</p>
                <p className="text-xs text-zinc-400">
                  문의사항이 있으시면 상단의 [1:1 고객센터 상담 접수] 버튼을 눌러 남겨주세요.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {inquiries.map((inq) => {
                  const isExpanded = expandedId === inq.id;
                  return (
                    <div
                      key={inq.id}
                      className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                        isExpanded
                          ? 'border-zinc-300 shadow-md ring-1 ring-zinc-200'
                          : 'border-zinc-200 shadow-2xs hover:border-zinc-300'
                      }`}
                    >
                      {/* 상담 아코디언 헤더 */}
                      <div
                        onClick={() => setExpandedId(isExpanded ? null : inq.id)}
                        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none gap-4"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                          {getStatusBadge(inq.status)}
                          <span className="text-[11px] bg-zinc-100 text-zinc-600 font-semibold px-2 py-0.5 rounded shrink-0">
                            {inq.inquiryType}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                            {inq.title}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 sm:gap-4 text-xs text-zinc-400 shrink-0">
                          <span className="hidden sm:inline">{inq.author}</span>
                          <span>{inq.createdAt}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-zinc-500" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                      </div>

                      {/* 펼쳐진 상담 본문 및 답변 */}
                      {isExpanded && (
                        <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-zinc-100 space-y-4 text-xs sm:text-sm">
                          {/* 주문번호가 있는 경우 표시 */}
                          {inq.orderNumber && (
                            <div className="flex items-center gap-2 pt-2">
                              <span className="text-zinc-400 text-xs">관련 주문번호:</span>
                              <span className="bg-zinc-100 text-zinc-800 font-mono font-bold text-xs px-2 py-0.5 rounded">
                                {inq.orderNumber}
                              </span>
                            </div>
                          )}

                          {/* 고객 문의 내용 */}
                          <div className="space-y-1.5 pt-1">
                            <p className="font-bold text-zinc-900">상담 신청 내용:</p>
                            <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap pl-1">
                              {inq.content}
                            </p>
                          </div>

                          {/* 고객센터 공식 답변 */}
                          {inq.answer ? (
                            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 sm:p-5 space-y-2 text-zinc-800 animate-in fade-in duration-150">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                  <span>{inq.responder || '다써바 고객지원센터 답변'}</span>
                                </div>
                                {inq.answeredAt && (
                                  <span className="text-[11px] text-emerald-700">
                                    답변일: {inq.answeredAt}
                                  </span>
                                )}
                              </div>
                              <p className="text-zinc-700 leading-relaxed whitespace-pre-wrap pl-5 text-xs sm:text-sm">
                                {inq.answer}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-4 text-amber-900 text-xs flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-600" />
                              <span>
                                고객센터에 접수되었습니다. 전담 상담원이 상담 내용 확인 후 신속하게 처리해 드리겠습니다.
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
          </div>
        ) : (
          /* FAQ 탭 */
          <div className="space-y-3">
            {FAQ_LIST.map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-zinc-200 shadow-2xs overflow-hidden"
                >
                  <div
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="p-5 flex items-center justify-between cursor-pointer select-none hover:bg-zinc-50/80 transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 font-black text-xs flex items-center justify-center shrink-0">
                        Q
                      </span>
                      <span className="font-bold text-sm text-zinc-900">{faq.q}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-400" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="px-6 pb-6 pt-2 border-t border-zinc-100 text-xs sm:text-sm text-zinc-600 leading-relaxed bg-zinc-50/50">
                      <div className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-zinc-200 text-zinc-800 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                          A
                        </span>
                        <p className="pt-0.5">{faq.a}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 1:1 상담 접수 팝업 모달 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-2xs animate-in fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-zinc-200 relative animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-5 top-5 p-1 text-zinc-400 hover:text-zinc-800 rounded-lg"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <span className="text-[11px] bg-amber-400 text-zinc-950 font-bold px-2 py-0.5 rounded">
                  고객센터 1:1 문의 접수
                </span>
                <h3 className="text-xl font-black text-zinc-900 mt-2">상담 문의 등록하기</h3>
                <p className="text-xs text-zinc-500 mt-1">
                  접수해 주신 상담은 영업일 기준 24시간 이내 전문 상담사가 검토 후 신속히 답변해 드립니다.
                </p>
              </div>

              <form onSubmit={handleCreateInquiry} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">성함 / 주문자명</label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="성함을 입력하세요"
                      required
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">연락처</label>
                    <input
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">이메일 주소</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">상담 유형</label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-900"
                    >
                      <option value="주문/결제">주문/결제 문의</option>
                      <option value="배송/교환/반품">배송/교환/반품 문의</option>
                      <option value="단체자수견적">단체자수 견적 상담</option>
                      <option value="회원/포인트">회원/적립금 문의</option>
                      <option value="불만/개선제안">불만/서비스 개선제안</option>
                      <option value="기타">기타 일반 문의</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">관련 주문번호 (선택사항)</label>
                  <input
                    type="text"
                    value={formOrderNumber}
                    onChange={(e) => setFormOrderNumber(e.target.value)}
                    placeholder="예: ORD-20261012-XXXXX"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">문의 제목</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="문의하실 핵심 내용을 한 줄로 요약해 주세요"
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-zinc-900"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">상담 상세 내용</label>
                  <textarea
                    rows={4}
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    placeholder="문의 상황, 요청 사항 등을 상세히 남겨주시면 보다 빠르고 명확한 처리가 가능합니다."
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-3 focus:outline-none focus:border-zinc-900 resize-none"
                  />
                </div>

                <div className="pt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 rounded-xl border border-zinc-200 text-zinc-700 font-bold hover:bg-zinc-50 transition"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-3 rounded-xl bg-amber-400 hover:bg-amber-500 text-zinc-950 font-black transition flex items-center justify-center gap-2 shadow-md"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? '접수 처리 중...' : '1:1 상담 접수하기'}
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
