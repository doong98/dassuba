'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, ArrowUp, X, Send, Bot, HelpCircle } from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
}

const FAQS: FAQ[] = [
  {
    q: '모자 자수/단체 제작 최소 수량은 얼마인가요?',
    a: '다써바에서는 1개부터 샘플 제작이 가능하며, 10개 이상부터 수량별 대량 할인(최대 40%)이 적용됩니다!',
  },
  {
    q: '배송은 언제 출발하나요?',
    a: '기성 완제품은 평일 16시 이전 결제 완료 시 당일 출고됩니다. 자수 주문제작 상품은 시안 확정 후 2~3일 소요됩니다.',
  },
  {
    q: '1+1 기획전은 다른 색상이나 종류 교차가 되나요?',
    a: '네! 1+1 기획전 태그가 부착된 모든 상품은 원하는 색상 및 옵션을 자유롭게 2개 선택하시면 자동으로 할인가가 적용됩니다.',
  },
  {
    q: '신규 회원 적립금은 바로 쓸 수 있나요?',
    a: '가입 즉시 2,000P가 지급되며, 주문 금액 제한 없이 1,000P 단위로 바로 결제에 적용하실 수 있습니다.',
  },
];

export default function FloatingAction() {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setShowTopBtn(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKakaoTalk = () => {
    alert('카카오톡 1:1 실시간 상담 채널로 연결됩니다.\n(채널명: @다써바모자)');
  };

  return (
    <>
      {/* 챗봇 대화창 모달 */}
      {isChatOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-84 sm:w-96 bg-white rounded-2xl shadow-2xl border border-zinc-200 z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* 헤더 */}
          <div className="bg-zinc-950 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center font-bold">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">다써바 AI 안내 챗봇</h4>
                <p className="text-[11px] text-zinc-400">자주 묻는 질문을 즉시 확인하세요</p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsChatOpen(false);
                setSelectedFaq(null);
              }}
              className="text-zinc-400 hover:text-white transition"
              aria-label="챗봇 닫기"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 본문 메시지 영역 */}
          <div className="p-4 bg-zinc-50 max-h-96 overflow-y-auto space-y-3 text-xs">
            {/* 기본 웰컴 메시지 */}
            <div className="flex gap-2 items-start">
              <div className="w-6 h-6 rounded-full bg-zinc-900 text-amber-400 flex items-center justify-center shrink-0 text-[10px] font-bold">
                🤖
              </div>
              <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-xs border border-zinc-200 text-zinc-800 leading-relaxed">
                안녕하세요! 모자 전문 쇼핑몰 <strong>다써바</strong>입니다. 🧢<br />
                궁금하신 내용을 클릭하시면 빠르게 안내해 드릴게요!
              </div>
            </div>

            {/* FAQ 버튼 목록 */}
            <div className="space-y-1.5 pl-8">
              <p className="text-[11px] font-bold text-zinc-500 mb-1 flex items-center gap-1">
                <HelpCircle className="w-3 h-3 text-amber-500" /> 자주 묻는 질문
              </p>
              {FAQS.map((faq, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedFaq(faq)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs transition font-medium ${
                    selectedFaq?.q === faq.q
                      ? 'bg-amber-50 border-amber-400 text-amber-900 font-bold'
                      : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  {faq.q}
                </button>
              ))}
            </div>

            {/* 선택된 답변 렌더링 */}
            {selectedFaq && (
              <div className="flex gap-2 items-start pt-2 animate-in fade-in">
                <div className="w-6 h-6 rounded-full bg-amber-400 text-zinc-950 flex items-center justify-center shrink-0 text-[10px] font-bold">
                  답변
                </div>
                <div className="bg-amber-50 p-3 rounded-2xl rounded-tl-none border border-amber-200 text-zinc-900 leading-relaxed font-medium">
                  {selectedFaq.a}
                </div>
              </div>
            )}
          </div>

          {/* 하단 카카오 상담 및 고객센터/Q&A 연결 링크 */}
          <div className="p-3 bg-white border-t border-zinc-200 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <a
                href="/community/cs"
                className="text-amber-800 font-bold hover:underline flex items-center gap-1"
              >
                고객센터 1:1 상담 →
              </a>
              <a
                href="/community/qna"
                className="text-zinc-600 hover:text-zinc-950 hover:underline"
              >
                Q&A 게시판 →
              </a>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-zinc-100">
              <span className="text-[11px] text-zinc-500">실시간 상담원 채팅</span>
              <button
                onClick={handleKakaoTalk}
                className="px-3 py-1 bg-[#FEE500] hover:bg-[#FDD835] text-zinc-900 font-bold text-xs rounded-lg flex items-center gap-1 shadow-2xs transition"
              >
                카카오 상담
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 우측 하단 플로팅 버튼 그룹 */}
      <div className="fixed bottom-6 right-4 sm:right-6 flex flex-col items-end gap-2.5 z-40">
        {/* 카카오톡 상담 버튼 */}
        <button
          onClick={handleKakaoTalk}
          className="group flex items-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3c1e1e] p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
          aria-label="카카오톡 1:1 상담"
        >
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pl-1">
            카톡 상담
          </span>
          <MessageCircle className="w-5 h-5 fill-current" />
        </button>

        {/* 챗봇 버튼 */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="group flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white p-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 relative"
          aria-label="빠른 답변 챗봇"
        >
          <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold pl-1">
            FAQ 챗봇
          </span>
          <Bot className="w-5 h-5 text-amber-400" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white"></span>
        </button>

        {/* 맨 위로 이동 (TOP) */}
        {showTopBtn && (
          <button
            onClick={scrollToTop}
            className="bg-white hover:bg-zinc-100 text-zinc-800 p-3 rounded-full shadow-md border border-zinc-200 transition-all duration-200 active:scale-95 flex items-center justify-center animate-in fade-in"
            aria-label="페이지 맨 위로 이동"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        )}
      </div>
    </>
  );
}
