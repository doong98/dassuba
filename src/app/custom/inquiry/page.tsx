'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Scissors,
  CheckCircle2,
  Clock,
  UploadCloud,
  Users,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  PhoneCall,
  Mail,
  Calendar,
  Layers,
  HelpCircle,
  FileCheck,
} from 'lucide-react';

interface InquirySubmission {
  id: string;
  groupName: string;
  managerName: string;
  contact: string;
  email: string;
  capType: string;
  capColor: string;
  embroideryType: string;
  embroideryPosition: string;
  quantity: number;
  dueDate: string;
  memo: string;
  logoFileName: string;
  createdAt: string;
  status: '접수완료';
}

const CAP_OPTIONS = [
  { id: 'deepfit-ballcap', name: '시그니처 딥핏 코튼 볼캡', basePrice: 18000, img: '/images/products/bundle-1.png' },
  { id: 'vintage-ballcap', name: '빈티지 피그먼트 워싱 볼캡', basePrice: 19500, img: '/images/products/bundle-3.png' },
  { id: 'campcap', name: '초경량 5패널 나일론 캠프캡', basePrice: 17500, img: '/images/products/bundle-4.png' },
  { id: 'buckethat', name: '빅사이즈 사계절 벙거지 버킷햇', basePrice: 22000, img: '/images/products/bundle-2.png' },
  { id: 'beanie', name: '골지 니트 숏/롱 비니', basePrice: 14000, img: '/images/products/bundle-5.png' },
];

const EMBROIDERY_TECHNIQUES = [
  { id: '3d-volume', name: '정면 3D 볼륨(우레탄) 자수', desc: '입체감이 살아있는 프리미엄 엠보 자수 (가장 인기)', extraPrice: 2000 },
  { id: 'flat', name: '평면 컴퓨터 침수 자수', desc: '정밀하고 세밀한 로고 및 영문 레터링에 최적', extraPrice: 0 },
  { id: 'patch', name: '가죽/우븐 자수 패치 오버로크', desc: '고급스럽고 빈티지한 아웃도어 무드 연출', extraPrice: 2500 },
  { id: 'printing', name: '실크스크린 & DTF 전사', desc: '다채로운 컬러 그라데이션 및 일러스트 표현', extraPrice: 1000 },
];

const RECENT_PORTFOLIOS = [
  {
    title: '서울 런클럽 정기마라톤 기념 캡',
    group: '러닝 크루 80명',
    cap: '초경량 5패널 캠프캡',
    tech: '정면 3D 볼륨 자수 + 측면 야광 레터링',
    image: '/images/products/bundle-4.png',
  },
  {
    title: '테크 스타트업 사내 워크숍 단체모',
    group: 'IT 기업 150명',
    cap: '시그니처 딥핏 볼캡 (블랙)',
    tech: '정면 미니멀 플랫 자수 + 후면 스트랩 음각',
    image: '/images/products/bundle-1.png',
  },
  {
    title: '대학교 디자인학부 졸전 기념 버킷햇',
    group: '디자인과 45명',
    cap: '사계절 코튼 버킷햇',
    tech: '정면 그래픽 자수 패치',
    image: '/images/products/bundle-2.png',
  },
];

export default function CustomInquiryPage() {
  // 1. 단체 및 담당자 정보
  const [groupName, setGroupName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [dueDate, setDueDate] = useState('');

  // 2. 모자 및 자수 사양
  const [selectedCap, setSelectedCap] = useState(CAP_OPTIONS[0]);
  const [capColor, setCapColor] = useState('블랙');
  const [selectedEmbroidery, setSelectedEmbroidery] = useState(EMBROIDERY_TECHNIQUES[0]);
  const [embroideryPosition, setEmbroideryPosition] = useState('정면 중앙');
  const [quantity, setQuantity] = useState(50);
  const [memo, setMemo] = useState('');
  const [logoFileName, setLogoFileName] = useState('');

  // 접수 완료 상태
  const [submittedInquiry, setSubmittedInquiry] = useState<InquirySubmission | null>(null);

  // 예상 단가 계산기 (수량별 할인율)
  const getDiscountRate = (qty: number) => {
    if (qty >= 300) return 0.35; // 35% 할인
    if (qty >= 100) return 0.25; // 25% 할인
    if (qty >= 50) return 0.15;  // 15% 할인
    if (qty >= 30) return 0.10;  // 10% 할인
    return 0;
  };

  const unitBasePrice = selectedCap.basePrice + selectedEmbroidery.extraPrice;
  const discountRate = getDiscountRate(quantity);
  const estimatedUnitPrice = Math.round(unitBasePrice * (1 - discountRate));
  const estimatedTotalPrice = estimatedUnitPrice * quantity;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !contact || !managerName) {
      alert('단체명, 담당자 성함, 연락처를 모두 입력해 주세요.');
      return;
    }

    const newSubmission: InquirySubmission = {
      id: 'INQ-' + Date.now().toString().slice(-6),
      groupName,
      managerName,
      contact,
      email,
      capType: selectedCap.name,
      capColor,
      embroideryType: selectedEmbroidery.name,
      embroideryPosition,
      quantity,
      dueDate: dueDate || '협의 가능',
      memo,
      logoFileName: logoFileName || '별도 이메일 전달 예정',
      createdAt: new Date().toISOString().split('T')[0],
      status: '접수완료',
    };

    setSubmittedInquiry(newSubmission);

    // 로컬 스토리지에 문의 백업
    try {
      const existing = JSON.parse(localStorage.getItem('dasseoba_custom_inquiries') || '[]');
      localStorage.setItem('dasseoba_custom_inquiries', JSON.stringify([newSubmission, ...existing]));
    } catch (err) {
      console.warn('Storage sync notice:', err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* 상단 헤더 배너 */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 24시간 내 전문 디자이너 3D 디지털 무료시안 발송
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
            단체 모자 자수 <span className="text-blue-600">무료 시안 & 맞춤 견적</span> 신청
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 leading-relaxed">
            동호회, 러닝크루, 기업 워크숍, 브랜드 굿즈까지! 로고 이미지만 올려주시면<br className="hidden sm:inline" />
            다써바 전문 자수 디자이너가 실물과 99% 일치하는 <strong>3D 디지털 시안을 비용 없이 무료로 제작</strong>해 드립니다.
          </p>
        </div>

        {/* 3대 무료 혜택 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-zinc-950">100% 무료 3D 시안 제작</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">결제 전 실제 제작 핏을 눈으로 직접 확인</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-zinc-950">24시간 내 초고속 회신</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">평일 접수 시 전담 디자이너 1:1 당일 상담</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-zinc-950">수량별 대량 제작 할인</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">30개 이상 주문 시 최대 35% 단가 할인 적용</p>
            </div>
          </div>
        </div>

        {/* 메인 폼 그리드 (좌측 신청서 / 우측 실시간 견적기) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 좌측 신청 폼 (8칸) */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-6">
            <h2 className="font-black text-lg text-zinc-950 pb-3 border-b border-zinc-100 flex items-center gap-2">
              <Scissors className="w-5 h-5 text-blue-600" /> 무료 시안 제작 신청서 작성
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6 text-xs">
              {/* 1. 단체 및 담당자 정보 */}
              <div className="space-y-3">
                <span className="font-black text-xs text-zinc-900 block flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">1</span>
                  기본 정보 및 연락처
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">단체명 / 회사명 *</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="예: 서울 마라톤 크루, OO스타트업"
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">담당자 성함 *</label>
                    <input
                      type="text"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="홍길동"
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">연락처 *</label>
                    <input
                      type="tel"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="010-1234-5678"
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">시안 수신 이메일</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="design@example.com"
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. 모자 종류 및 수량 선택 */}
              <div className="space-y-3 pt-3 border-t border-zinc-100">
                <span className="font-black text-xs text-zinc-900 block flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">2</span>
                  제작 모자 모델 및 수량 선택
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {CAP_OPTIONS.map((cap) => (
                    <button
                      key={cap.id}
                      type="button"
                      onClick={() => setSelectedCap(cap)}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        selectedCap.id === cap.id
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                          : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <img src={cap.img} alt={cap.name} className="w-12 h-12 rounded-lg object-cover mb-2 bg-white" />
                      <span className="font-bold text-xs text-zinc-900 line-clamp-1">{cap.name}</span>
                      <span className="text-[11px] text-zinc-400 mt-1">기본 {cap.basePrice.toLocaleString()}원~</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">모자 원단 컬러</label>
                    <select
                      value={capColor}
                      onChange={(e) => setCapColor(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="블랙">매트 블랙 (가장 인기)</option>
                      <option value="화이트">클린 화이트</option>
                      <option value="네이비">딥 네이비</option>
                      <option value="차콜">차콜 그레이</option>
                      <option value="베이지">샌드 베이지</option>
                      <option value="카키">카키 올리브</option>
                      <option value="커스텀컬러">기타 염색 주문 (별도 문의)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">제작 예정 수량 (개)</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min="10"
                        step="5"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(10, parseInt(e.target.value) || 10))}
                        className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none font-mono font-bold"
                      />
                      <div className="flex gap-1">
                        {[30, 50, 100].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setQuantity(q)}
                            className="px-2.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-lg text-[11px] font-bold shrink-0"
                          >
                            {q}개
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. 자수 기법 및 위치 선택 */}
              <div className="space-y-3 pt-3 border-t border-zinc-100">
                <span className="font-black text-xs text-zinc-900 block flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">3</span>
                  자수 기법 및 위치
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {EMBROIDERY_TECHNIQUES.map((tech) => (
                    <button
                      key={tech.id}
                      type="button"
                      onClick={() => setSelectedEmbroidery(tech)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        selectedEmbroidery.id === tech.id
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/20'
                          : 'border-zinc-200 hover:border-zinc-400'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-zinc-900">{tech.name}</span>
                        {tech.extraPrice > 0 && (
                          <span className="text-[10px] text-blue-600 font-bold">+{tech.extraPrice.toLocaleString()}원</span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1">{tech.desc}</p>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">자수 부착 위치</label>
                    <select
                      value={embroideryPosition}
                      onChange={(e) => setEmbroideryPosition(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none font-bold"
                    >
                      <option value="정면 중앙">정면 중앙 (기본 권장)</option>
                      <option value="정면 + 좌측면 레터링">정면 + 좌측면 레터링 (2곳)</option>
                      <option value="정면 + 후면 아치형">정면 + 후면 아치형 (2곳)</option>
                      <option value="전면 360도 풀커스텀">전면 360도 풀커스텀</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-zinc-700 mb-1">수령 희망 납기일</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 4. 로고 파일 첨부 및 요청 메모 */}
              <div className="space-y-3 pt-3 border-t border-zinc-100">
                <span className="font-black text-xs text-zinc-900 block flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-900 text-white flex items-center justify-center text-[10px]">4</span>
                  로고 이미지 첨부 및 요청사항
                </span>

                <div className="p-4 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl text-center space-y-2">
                  <UploadCloud className="w-8 h-8 text-blue-600 mx-auto" />
                  <p className="text-xs font-bold text-zinc-800">
                    로고 이미지 파일 첨부 (AI, PDF, PNG, JPG)
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    파일이 없으시거나 스케치인 경우에도 디자이너가 무상으로 벡터 변환해 드립니다.
                  </p>
                  <input
                    type="text"
                    value={logoFileName}
                    onChange={(e) => setLogoFileName(e.target.value)}
                    placeholder="파일명 입력 또는 이메일 전달 메모 (예: seoul_marathon_logo.ai)"
                    className="w-full p-2 bg-white border border-zinc-200 rounded-xl text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">추가 제작 요청 메모</label>
                  <textarea
                    rows={3}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    placeholder="자수 크기, 실 색상 코드, 스트랩 버클 사양 등 원하시는 세부 요구사항을 자유롭게 기재해 주세요."
                    className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl transition shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  <span>무료 시안 및 견적 신청서 접수하기</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* 우측 실시간 견적기 & 납품 포트폴리오 (4칸) */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">
            {/* 실시간 예상 단가 계산기 */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <h3 className="font-black text-base text-zinc-950 pb-3 border-b border-zinc-100 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-500" /> 실시간 예상 견적 시뮬레이터
              </h3>

              <div className="space-y-2.5 text-xs text-zinc-600">
                <div className="flex justify-between">
                  <span>선택 모델</span>
                  <span className="font-bold text-zinc-900 truncate max-w-[160px]">{selectedCap.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>자수 기법</span>
                  <span className="font-bold text-zinc-900">{selectedEmbroidery.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>신청 수량</span>
                  <span className="font-bold text-zinc-900">{quantity}개</span>
                </div>
                {discountRate > 0 && (
                  <div className="flex justify-between text-red-600 font-bold">
                    <span>대량 주문 우대 할인</span>
                    <span>-{Math.round(discountRate * 100)}% 적용</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-200 space-y-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-zinc-400">1개당 예상 단가</span>
                  <span className="text-lg font-black text-blue-600">
                    {estimatedUnitPrice.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-zinc-500 font-bold">총 예상 견적 (VAT 별도)</span>
                  <span className="text-2xl font-black text-zinc-950">
                    {estimatedTotalPrice.toLocaleString()}원
                  </span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 space-y-1">
                <p>• <strong>3D 디지털 시안 제작비는 100% 무료</strong>입니다.</p>
                <p>• 정식 발주 전 시안 수정은 횟수 제한 없이 지원됩니다.</p>
              </div>
            </div>

            {/* 실제 제작 납품 사례 */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-amber-500" /> 최근 단체 제작 사례
              </h3>

              <div className="space-y-3">
                {RECENT_PORTFOLIOS.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-50 border border-zinc-100">
                    <img src={item.image} alt={item.title} className="w-12 h-12 rounded-lg object-cover bg-white" />
                    <div className="flex-1 truncate text-xs">
                      <p className="font-bold text-zinc-900 truncate">{item.title}</p>
                      <p className="text-[11px] text-zinc-400">{item.group} · {item.tech}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 접수 완료 모달 */}
      {submittedInquiry && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase">
                무료 시안 신청 접수완료
              </span>
              <h3 className="text-2xl font-black text-zinc-950 mt-3 tracking-tight">
                신청이 정상적으로 접수되었습니다!
              </h3>
              <p className="text-xs text-zinc-500 mt-2">
                접수번호: <strong className="text-zinc-900 font-mono">{submittedInquiry.id}</strong>
              </p>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl text-left text-xs space-y-2 border border-zinc-200">
              <div className="flex justify-between py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500">단체명 / 담당자</span>
                <span className="font-bold text-zinc-900">{submittedInquiry.groupName} ({submittedInquiry.managerName}님)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-200/60">
                <span className="text-zinc-500">선택 모델 / 수량</span>
                <span className="font-bold text-zinc-900">{submittedInquiry.capType} / {submittedInquiry.quantity}개</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-zinc-500">자수 사양</span>
                <span className="font-bold text-blue-600">{submittedInquiry.embroideryType}</span>
              </div>
            </div>

            <p className="text-xs text-zinc-400">
              담당 전문 디자이너가 기재해주신 연락처({submittedInquiry.contact})로 24시간 이내 3D 디지털 시안을 전달드립니다.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setSubmittedInquiry(null)}
                className="py-3.5 px-4 rounded-xl border border-zinc-300 hover:bg-zinc-50 text-zinc-800 font-bold text-xs"
              >
                닫기
              </button>
              <Link
                href="/"
                className="py-3.5 px-4 rounded-xl bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs flex items-center justify-center gap-1"
              >
                홈으로 이동
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
