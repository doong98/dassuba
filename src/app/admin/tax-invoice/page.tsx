'use client';

import React, { useState } from 'react';
import { FileText, Printer, Download, Building, CheckCircle2 } from 'lucide-react';

export default function AdminTaxInvoicePage() {
  const [buyerName, setBuyerName] = useState('(주)한국모자클럽');
  const [businessNumber, setBusinessNumber] = useState('123-45-67890');
  const [ceoName, setCeoName] = useState('홍길동');
  const [itemTitle, setItemTitle] = useState('모자 단체 제작 및 완제품 공급');
  const [supplyPrice, setSupplyPrice] = useState(1000000);

  const vat = Math.floor(supplyPrice * 0.1);
  const total = supplyPrice + vat;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6" /> 사업자 전자 세금계산서/명세서 출력
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            B2B 거래처 및 단체 주문 고객 사업자등록번호 기반 영수증/세금명세서 인쇄 및 PDF 저장
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
        >
          <Printer className="w-4 h-4" /> 세금명세서 즉시 인쇄 / PDF
        </button>
      </div>

      {/* 입력 컨트롤 */}
      <div className="bg-white p-6 rounded-2xl border border-zinc-200 shadow-xs space-y-4 text-xs">
        <h3 className="font-bold text-sm text-zinc-900">공급받는 자 정보 설정</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-zinc-600 mb-1">상호(법인명)</label>
            <input
              type="text"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-zinc-600 mb-1">사업자등록번호</label>
            <input
              type="text"
              value={businessNumber}
              onChange={(e) => setBusinessNumber(e.target.value)}
              className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-zinc-600 mb-1">공급가액 (원)</label>
            <input
              type="number"
              value={supplyPrice}
              onChange={(e) => setSupplyPrice(parseInt(e.target.value) || 0)}
              className="w-full p-2 bg-zinc-50 border border-zinc-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* 세금명세서 출력 프리뷰 (인쇄 최적화 서식) */}
      <div className="bg-white p-8 rounded-3xl border-2 border-zinc-800 shadow-md space-y-6 print:border-none print:shadow-none">
        <div className="text-center pb-4 border-b-2 border-zinc-800 space-y-1">
          <span className="text-xs font-bold text-zinc-500 uppercase">국세청 전송용 전자세금계산서 표준양식</span>
          <h2 className="text-2xl font-black text-zinc-950 tracking-widest">
            세 금 계 산 서 (공급받는자 보관용)
          </h2>
        </div>

        {/* 공급자 & 공급받는자 표 */}
        <div className="grid grid-cols-2 border border-zinc-800 text-xs">
          {/* 공급자 */}
          <div className="p-4 border-r border-zinc-800 space-y-2 bg-zinc-50/50">
            <span className="font-bold text-indigo-700 block pb-1 border-b border-zinc-300">
              [공급자]
            </span>
            <p><strong>등록번호:</strong> 123-45-67890</p>
            <p><strong>상호:</strong> 주식회사 다써바커머스</p>
            <p><strong>성명:</strong> 김다써</p>
            <p><strong>사업장 주소:</strong> 서울특별시 동대문구 모자패션로 42</p>
            <p><strong>업태/종목:</strong> 제조 및 도소매 / 모자 및 의류부자재</p>
          </div>

          {/* 공급받는 자 */}
          <div className="p-4 space-y-2">
            <span className="font-bold text-zinc-700 block pb-1 border-b border-zinc-300">
              [공급받는 자]
            </span>
            <p><strong>등록번호:</strong> {businessNumber}</p>
            <p><strong>상호:</strong> {buyerName}</p>
            <p><strong>성명:</strong> {ceoName}</p>
            <p><strong>작성일자:</strong> 2026년 10월 06일</p>
          </div>
        </div>

        {/* 품목 및 금액 */}
        <div className="border border-zinc-800 text-xs">
          <div className="grid grid-cols-4 bg-zinc-100 font-bold p-2.5 border-b border-zinc-800 text-center">
            <span className="col-span-2">품목 / 규격</span>
            <span>공급가액</span>
            <span>세액 (VAT)</span>
          </div>
          <div className="grid grid-cols-4 p-3 border-b border-zinc-200 text-center">
            <span className="col-span-2 font-medium">{itemTitle}</span>
            <span className="font-mono">{supplyPrice.toLocaleString()}원</span>
            <span className="font-mono">{vat.toLocaleString()}원</span>
          </div>
          <div className="grid grid-cols-2 p-4 bg-zinc-50 font-black text-sm">
            <span>합계 금액 (총 공급대가)</span>
            <span className="text-right font-mono text-indigo-600">
              {total.toLocaleString()}원 (원천세 및 부가세 포함)
            </span>
          </div>
        </div>

        <div className="text-center text-xs text-zinc-400 pt-2">
          위 금액을 영수(청구) 함. 주식회사 다써바커머스 [직인생략]
        </div>
      </div>
    </div>
  );
}
