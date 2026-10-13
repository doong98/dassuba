'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Scissors, CheckCircle2, Clock, UploadCloud, Users, ArrowRight, ShieldCheck } from 'lucide-react';

interface CustomInquiry {
  id: string;
  groupName: string;
  capType: string;
  embroideryType: string;
  quantity: number;
  contact: string;
  createdAt: string;
  status: '접수완료' | '시안제작중' | '견적발송';
}

const DEMO_INQUIRIES: CustomInquiry[] = [
  {
    id: 'inq-1',
    groupName: '서울 마라톤 크루 러너스',
    capType: '초경량 캠프캡 5패널',
    embroideryType: '정면 3D 볼륨 자수',
    quantity: 50,
    contact: '010-9876-****',
    createdAt: '2026-10-06',
    status: '시안제작중',
  },
  {
    id: 'inq-2',
    groupName: '스타트업 핀테크랩 사우회',
    capType: '시그니처 딥핏 코튼 볼캡',
    embroideryType: '평면 컴퓨터 자수 + 측면 패치',
    quantity: 120,
    contact: '010-4455-****',
    createdAt: '2026-10-05',
    status: '견적발송',
  },
];

export default function CustomOrderPage() {
  const [inquiries, setInquiries] = useState<CustomInquiry[]>(DEMO_INQUIRIES);
  const [groupName, setGroupName] = useState('');
  const [capType, setCapType] = useState('시그니처 딥핏 코튼 볼캡');
  const [embroideryType, setEmbroideryType] = useState('정면 컴퓨터 자수');
  const [quantity, setQuantity] = useState(30);
  const [contact, setContact] = useState('');
  const [memo, setMemo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName || !contact) {
      alert('단체/기업명과 연락처를 입력해 주세요.');
      return;
    }

    const newInq: CustomInquiry = {
      id: 'inq-' + Date.now(),
      groupName,
      capType,
      embroideryType,
      quantity,
      contact: contact.slice(0, 9) + '****',
      createdAt: new Date().toISOString().split('T')[0],
      status: '접수완료',
    };

    setInquiries([newInq, ...inquiries]);
    setGroupName('');
    setContact('');
    setMemo('');
    alert('단체 맞춤 자수 견적 및 무료 시안 신청이 접수되었습니다!\n담당 디자이너가 24시간 이내 연락드립니다.');
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* 상단 헤더 */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-800 rounded-full inline-flex items-center gap-1">
            <Scissors className="w-3.5 h-3.5" /> B2B & 단체 커스텀 자수 서비스
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-zinc-950 tracking-tight">
            원하는 디자인 그대로, <span className="text-blue-600">단체 모자 자수</span> 제작
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            1개 샘플부터 10,000개 대량 제작까지! 신청 시 전문 디자이너의 <strong>3D 무료 디지털 시안</strong>을 제공해 드립니다.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 신청 폼 (좌측 7칸) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200 shadow-xs space-y-5">
            <h2 className="font-black text-base text-zinc-950 pb-3 border-b border-zinc-100">
              실시간 무료 견적 & 시안 요청서
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">단체명 / 회사명 / 주문자명</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="예: 서울대학교 동아리, (주)다써바"
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">베이스 모자 종류</label>
                  <select
                    value={capType}
                    onChange={(e) => setCapType(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option>시그니처 딥핏 코튼 볼캡</option>
                    <option>빈티지 피그먼트 워싱 볼캡</option>
                    <option>빅사이즈 대두 버킷햇</option>
                    <option>아웃도어 사파리 스트랩햇</option>
                    <option>초경량 캠프캡 5패널</option>
                    <option>골프/테니스 선바이저</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">자수 / 인쇄 방식</label>
                  <select
                    value={embroideryType}
                    onChange={(e) => setEmbroideryType(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                  >
                    <option>정면 평면 컴퓨터 자수</option>
                    <option>정면 3D 볼륨 입체 자수</option>
                    <option>좌/우 측면 소형 자수</option>
                    <option>실크스크린 특수 인쇄</option>
                    <option>자수 패치 오바로크 부착</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">예상 제작 수량</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">연락처 / 이메일</label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">로고/디자인 첨부 및 요청사항</label>
                <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-4 text-center hover:border-blue-400 transition cursor-pointer bg-zinc-50/50">
                  <UploadCloud className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-zinc-600 font-semibold text-xs">로고 파일(AI, PDF, PNG, JPG) 업로드</p>
                  <p className="text-[10px] text-zinc-400">파일이 없으셔도 원하는 문구만 적어주시면 디자인해 드립니다.</p>
                </div>
                <textarea
                  rows={2}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="원하시는 자수 크기나 위치(정면 5cm 등)를 적어주세요."
                  className="w-full mt-2 p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-sm rounded-2xl transition shadow-lg flex items-center justify-center gap-1.5"
              >
                무료 3D 시안 및 견적 신청하기
              </button>
            </form>
          </div>

          {/* 우측 실시간 접수 현황 (5칸) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <h3 className="font-black text-sm text-zinc-950 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" /> 실시간 단체 예약 접수 현황
              </h3>

              <div className="space-y-3">
                {inquiries.map((inq) => (
                  <div key={inq.id} className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-zinc-900">{inq.groupName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {inq.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      {inq.capType} | {inq.embroideryType} | <strong className="text-zinc-800">{inq.quantity}개</strong>
                    </p>
                    <div className="flex justify-between text-[10px] text-zinc-400 pt-1">
                      <span>연락처: {inq.contact}</span>
                      <span>{inq.createdAt}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 안내 배너 */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 text-white p-6 rounded-3xl space-y-2">
              <h4 className="font-black text-sm text-amber-400">다써바 단체 제작 특별 혜택</h4>
              <p className="text-xs text-zinc-300 leading-relaxed">
                • 10개 이상부터 수량별 최대 40% 차등 할인<br />
                • 사업자등록증 전자세금계산서 100% 즉시 발행<br />
                • 대량 주문 시 샘플 1개 사전 무료 제작 배송
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
