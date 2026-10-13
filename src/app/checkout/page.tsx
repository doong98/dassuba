'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import {
  CreditCard,
  Sparkles,
  Truck,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  User,
  MapPin,
  Lock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

const TOSS_CLIENT_KEY =
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJqK4WBaEpYkVQbgHNz7Y';

export default function CheckoutPage() {
  const router = useRouter();
  const { user, deductPoints } = useAuth();
  const { cartItems, subtotal, bundleDiscount, shippingFee, finalTotal, clearCart } = useCart();

  // 1. 배송지 및 주문자 폼 상태
  const [recipient, setRecipient] = useState(user?.name || '홍길동');
  const [phone, setPhone] = useState(user?.phone || '010-1234-5678');
  const [postcode, setPostcode] = useState('04780');
  const [address, setAddress] = useState('서울특별시 성동구 성수동 1가 12-34');
  const [addressDetail, setAddressDetail] = useState('다써바 타워 101동 202호');
  const [deliveryNote, setDeliveryNote] = useState('문 앞에 놓아주세요.');
  const [customerEmail, setCustomerEmail] = useState('dasseoba_customer@example.com');

  // 2. 포인트 사용 상태 (PRD 비즈니스 로직)
  const [usedPoints, setUsedPoints] = useState<number>(0);
  const [pointInput, setPointInput] = useState<string>('0');
  const [pointError, setPointError] = useState<string>('');

  // 3. 결제 수단 선택
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'kakaopay' | 'tosspay' | 'naverpay' | 'vbank'>('card');
  const [isProcessing, setIsProcessing] = useState(false);

  // 3-1. 토스페이먼츠 안심 테스트 결제 모달 상태
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [preparedOrder, setPreparedOrder] = useState<{
    orderNumber: string;
    amount: number;
    orderName: string;
    fullAddress: string;
  } | null>(null);
  const [selectedTestCard, setSelectedTestCard] = useState('토스뱅크 체크카드');
  const [isApprovingTest, setIsApprovingTest] = useState(false);

  // 4. 약관 동의 상태
  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeThirdParty, setAgreeThirdParty] = useState(false);
  const [agreePurchase, setAgreePurchase] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState<string | null>(null);

  const handleAgreeAllChange = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeThirdParty(checked);
    setAgreePurchase(checked);
  };

  const checkAllAgreed = (t: boolean, p: boolean, tp: boolean, pc: boolean) => {
    setAgreeAll(t && p && tp && pc);
  };

  const userAvailablePoints = user?.points || 0;
  const maxUsablePoints = Math.min(
    userAvailablePoints,
    Math.floor((finalTotal * 0.5) / 1000) * 1000 // PRD: 최대 50%까지, 1,000P 단위
  );

  const handleApplyPoints = (amount: number) => {
    setPointError('');
    if (userAvailablePoints < 2000) {
      setPointError('포인트는 누적 2,000P 이상 보유 시 사용 가능합니다.');
      return;
    }
    if (amount % 1000 !== 0) {
      setPointError('포인트는 1,000P 단위로만 사용 가능합니다.');
      return;
    }
    if (amount > maxUsablePoints) {
      setPointError(`주문 금액의 최대 50%인 ${maxUsablePoints.toLocaleString()}P까지 사용 가능합니다.`);
      return;
    }
    setUsedPoints(amount);
    setPointInput(amount.toString());
  };

  const handleMaxPoints = () => {
    handleApplyPoints(maxUsablePoints);
  };

  const amountToPay = Math.max(0, finalTotal - usedPoints);

  // 1. 주문서 사전 검증 및 테스트 결제창 호출
  const handlePayment = async () => {
    if (!recipient.trim()) {
      alert('받는 분 성함을 입력해 주세요.');
      return;
    }
    if (!phone.trim()) {
      alert('연락처를 입력해 주세요.');
      return;
    }
    if (!address.trim()) {
      alert('배송지 주소를 입력해 주세요.');
      return;
    }
    if (!agreeTerms || !agreePrivacy || !agreeThirdParty || !agreePurchase) {
      alert('주문 및 결제를 진행하시려면 필수 이용약관에 모두 동의하셔야 합니다.');
      return;
    }

    if (cartItems.length === 0) {
      alert('결제할 장바구니 상품이 없습니다.');
      return;
    }

    setIsProcessing(true);

    try {
      // 서버 사전 주문 생성 및 결제 금액 검증 API 호출 (/api/orders/prepare)
      const fullAddress = `${address} ${addressDetail}`.trim();
      const prepareRes = await fetch('/api/orders/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient,
          phone,
          address: fullAddress,
          deliveryNote,
          customerEmail,
          items: cartItems,
          usedPoints,
          paymentMethod,
        }),
      });

      const prepareData = await prepareRes.json();
      if (!prepareRes.ok || !prepareData.success) {
        throw new Error(prepareData.error || '주문 사전 등록에 실패했습니다.');
      }

      const { orderNumber, orderName, amount } = prepareData;

      // 테스트 결제창 띄우기 준비 완료
      setPreparedOrder({
        orderNumber,
        amount,
        orderName,
        fullAddress,
      });

      setIsProcessing(false);
      setIsTestModalOpen(true);
    } catch (err: any) {
      console.error('Payment prepare error:', err);
      alert(err.message || '결제 준비 중 오류가 발생했습니다.');
      setIsProcessing(false);
    }
  };

  // 2. 토스페이먼츠 테스트 결제 최종 승인 처리
  const handleExecuteTestPayment = async () => {
    if (!preparedOrder) return;
    setIsApprovingTest(true);

    try {
      const paymentKey = `test_pay_${Date.now()}`;

      // 서버 결제 승인 API 호출 (/api/payments/confirm)
      const confirmRes = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentKey,
          orderId: preparedOrder.orderNumber,
          amount: preparedOrder.amount,
        }),
      });

      const confirmData = await confirmRes.json();

      // 포인트 차감 적용
      if (usedPoints > 0) {
        deductPoints(usedPoints);
      }

      // 로컬 스토리지에 새 주문 즉시 저장 (마이페이지에서 바로 확인 가능)
      const trackingNumber = `CJ${Math.floor(100000000 + Math.random() * 900000000)}`;
      const newOrder = {
        id: `ord-${Date.now()}`,
        orderNumber: preparedOrder.orderNumber,
        createdAt: new Date().toISOString(),
        totalAmount: preparedOrder.amount,
        status: 'paid' as const, // 결제완료
        trackingNumber,
        items: cartItems,
        recipient,
        phone,
        address: preparedOrder.fullAddress,
        deliveryNote,
        usedPoints,
        paymentMethod: `${paymentMethod === 'card' ? '신용/체크카드' : paymentMethod === 'kakaopay' ? '카카오페이' : '토스페이'} (${selectedTestCard})`,
        receiptUrl: confirmData.receiptUrl || `https://dashboard.tosspayments.com/receipt/test?orderId=${preparedOrder.orderNumber}`,
      };

      try {
        const existingOrders = JSON.parse(localStorage.getItem('dasseoba_orders') || '[]');
        localStorage.setItem('dasseoba_orders', JSON.stringify([newOrder, ...existingOrders]));
      } catch (storageErr) {
        console.warn('localStorage save warning:', storageErr);
      }

      // 장바구니 비우기
      clearCart();

      // 결제 완료 페이지로 이동
      router.push(
        `/order/complete?orderNumber=${preparedOrder.orderNumber}&amount=${preparedOrder.amount}&paymentKey=${paymentKey}`
      );
    } catch (err: any) {
      console.error('Test payment approve error:', err);
      alert('테스트 결제 승인 중 오류가 발생했습니다.');
      setIsApprovingTest(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-zinc-50">
        <div className="bg-white p-10 rounded-3xl border border-zinc-200 text-center max-w-md shadow-xs">
          <p className="text-zinc-600 font-semibold mb-4 text-sm">결제할 상품이 없습니다.</p>
          <Link
            href="/"
            className="px-6 py-2.5 bg-zinc-950 text-white rounded-xl text-xs font-bold inline-block"
          >
            쇼핑하러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-10 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 pb-4 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
              <CreditCard className="w-7 h-7" /> 주문서 작성 및 토스페이먼츠 결제
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              토스페이먼츠 보안 에스크로 결제 시스템을 통해 안전하게 실물 상품을 구매하세요.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 font-bold self-start sm:self-auto">
            <Lock className="w-3.5 h-3.5" /> 256-bit SSL 암호화 결제 보안
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 좌측 영역: 배송지 + 포인트 + 결제수단 + 약관 */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. 배송지 정보 */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <h2 className="font-black text-base text-zinc-950 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" /> 1. 배송지 및 주문자 정보
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">받는 분 성함 *</label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none font-medium text-xs"
                    placeholder="홍길동"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">연락처 *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none font-medium text-xs"
                    placeholder="010-1234-5678"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">우편번호</label>
                  <input
                    type="text"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none font-medium text-xs"
                    placeholder="04780"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">이메일 (결제 영수증 수신)</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none font-medium text-xs"
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-zinc-700 mb-1">기본 배송 주소 *</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none font-medium text-xs"
                    placeholder="서울특별시 성동구 성수동 1가 12-34"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-zinc-700 mb-1">상세 주소 (동, 호수 등)</label>
                  <input
                    type="text"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none font-medium text-xs"
                    placeholder="다써바 타워 101동 202호"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-bold text-zinc-700 mb-1">배송 요청사항</label>
                  <input
                    type="text"
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none font-medium text-xs"
                    placeholder="문 앞에 놓아주세요."
                  />
                </div>
              </div>
            </div>

            {/* 2. 적립금 / 포인트 사용 */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-base text-zinc-950 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" /> 2. 적립금 / 포인트 사용
                </h2>
                <div className="text-xs">
                  보유 포인트: <strong className="text-amber-600 font-black">{userAvailablePoints.toLocaleString()}P</strong>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1">
                <p>• <strong>포인트 규정</strong>: 누적 2,000P 이상 보유 시, 1,000P 단위로 주문 금액의 최대 50%까지 차감 가능</p>
                <p>• 고객님의 현재 최대 사용 가능 금액: <strong>{maxUsablePoints.toLocaleString()}P</strong></p>
              </div>

              {pointError && (
                <div className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {pointError}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="number"
                  step="1000"
                  min="0"
                  max={maxUsablePoints}
                  value={pointInput}
                  onChange={(e) => setPointInput(e.target.value)}
                  placeholder="0"
                  className="flex-1 p-2.5 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none font-mono font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleApplyPoints(parseInt(pointInput) || 0)}
                  className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl text-xs font-bold transition"
                >
                  적용
                </button>
                <button
                  type="button"
                  onClick={handleMaxPoints}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 rounded-xl text-xs font-black transition"
                >
                  전액 사용
                </button>
              </div>

              {usedPoints > 0 && (
                <div className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {usedPoints.toLocaleString()}P가 성공적으로 차감 적용되었습니다.
                </div>
              )}
            </div>

            {/* 3. 토스페이먼츠 결제 수단 선택 */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-black text-base text-zinc-950 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> 3. 결제 수단 선택 (토스페이먼츠 연동)
                </h2>
                <span className="text-[11px] text-zinc-400">토스 공식 인증 결제창</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {[
                  { id: 'card', name: '신용/체크카드', desc: '국내 모든 카드사' },
                  { id: 'kakaopay', name: '카카오페이', desc: '간편결제' },
                  { id: 'tosspay', name: '토스페이', desc: '간편결제' },
                  { id: 'naverpay', name: '네이버페이', desc: '간편결제' },
                  { id: 'vbank', name: '가상계좌', desc: '무통장 입금' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentMethod(item.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === item.id
                        ? 'border-blue-600 bg-blue-50/40 text-blue-950 shadow-sm ring-2 ring-blue-600/30'
                        : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                    }`}
                  >
                    <span className="font-bold text-xs">{item.name}</span>
                    <span className={`text-[10px] mt-1 ${paymentMethod === item.id ? 'text-blue-600' : 'text-zinc-400'}`}>
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 4. 구매조건 및 전자금융거래 약관 동의 UI (필수 요구사항) */}
            <div className="bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-4">
              <h2 className="font-black text-base text-zinc-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-zinc-700" /> 4. 약관 및 결제 동의
              </h2>

              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200 space-y-3 text-xs">
                {/* 전체 동의 */}
                <label className="flex items-center gap-2.5 font-black text-zinc-900 pb-2.5 border-b border-zinc-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeAll}
                    onChange={(e) => handleAgreeAllChange(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <span>주문 및 결제 관련 필수 약관에 전체 동의합니다.</span>
                </label>

                {/* 개별 항목 */}
                <div className="space-y-2 text-zinc-600 pl-1">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => {
                          setAgreeTerms(e.target.checked);
                          checkAllAgreed(e.target.checked, agreePrivacy, agreeThirdParty, agreePurchase);
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                      />
                      <span><strong className="text-blue-600">[필수]</strong> 전자상거래 이용약관 동의</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(showTermsModal === 'terms' ? null : 'terms')}
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 underline"
                    >
                      내용보기
                    </button>
                  </div>
                  {showTermsModal === 'terms' && (
                    <div className="p-3 bg-white rounded-xl border border-zinc-200 text-[10px] text-zinc-500 max-h-24 overflow-y-auto leading-relaxed">
                      제1조(목적): 본 약관은 다써바 쇼핑몰이 제공하는 인터넷 전자상거래 서비스 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreePrivacy}
                        onChange={(e) => {
                          setAgreePrivacy(e.target.checked);
                          checkAllAgreed(agreeTerms, e.target.checked, agreeThirdParty, agreePurchase);
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                      />
                      <span><strong className="text-blue-600">[필수]</strong> 개인정보 수집 및 이용 동의</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(showTermsModal === 'privacy' ? null : 'privacy')}
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 underline"
                    >
                      내용보기
                    </button>
                  </div>
                  {showTermsModal === 'privacy' && (
                    <div className="p-3 bg-white rounded-xl border border-zinc-200 text-[10px] text-zinc-500 max-h-24 overflow-y-auto leading-relaxed">
                      1. 수집 항목: 성명, 휴대전화번호, 배송지 주소, 결제 정보<br />
                      2. 수집 목적: 상품 배송, 결제 승인 및 주문 내역 안내<br />
                      3. 보유 기간: 전자상거래법에 따른 법정 보존 기간(5년)
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreeThirdParty}
                        onChange={(e) => {
                          setAgreeThirdParty(e.target.checked);
                          checkAllAgreed(agreeTerms, agreePrivacy, e.target.checked, agreePurchase);
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                      />
                      <span><strong className="text-blue-600">[필수]</strong> 개인정보 제3자(토스페이먼츠/택배사) 제공 동의</span>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={agreePurchase}
                        onChange={(e) => {
                          setAgreePurchase(e.target.checked);
                          checkAllAgreed(agreeTerms, agreePrivacy, agreeThirdParty, e.target.checked);
                        }}
                        className="w-3.5 h-3.5 rounded text-blue-600 cursor-pointer"
                      />
                      <span><strong className="text-blue-600">[필수]</strong> 구매조건 확인 및 결제 진행 동의</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 우측 영역: 주문 상품 요약 및 결제 확정 */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-zinc-200 shadow-xs space-y-5 sticky top-28">
            <h2 className="font-black text-base text-zinc-950 pb-3 border-b border-zinc-100">
              최종 결제 내역
            </h2>

            {/* 주문 상품 미니 리스트 */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 text-xs">
              {cartItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-2">
                  <div className="flex-1 truncate">
                    <p className="font-bold text-zinc-900 truncate">{item.title}</p>
                    <p className="text-[11px] text-zinc-400">
                      {item.color} / {item.size} × {item.quantity}개
                    </p>
                  </div>
                  <span className="font-semibold text-zinc-800">
                    {(item.price * item.quantity).toLocaleString()}원
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-zinc-100 space-y-2 text-xs text-zinc-600">
              <div className="flex justify-between">
                <span>상품 주문 금액</span>
                <span className="font-bold text-zinc-900">{subtotal.toLocaleString()}원</span>
              </div>
              {bundleDiscount > 0 && (
                <div className="flex justify-between text-red-600 font-bold">
                  <span>1+1 번들 특별할인</span>
                  <span>-{bundleDiscount.toLocaleString()}원</span>
                </div>
              )}
              {usedPoints > 0 && (
                <div className="flex justify-between text-amber-600 font-bold">
                  <span>포인트 즉시 차감</span>
                  <span>-{usedPoints.toLocaleString()}원</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>배송비 (30,000원 이상 무료)</span>
                <span className="font-bold text-zinc-900">
                  {shippingFee === 0 ? '무료' : `${shippingFee.toLocaleString()}원`}
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-zinc-200 flex justify-between items-baseline">
              <div>
                <span className="text-xs text-zinc-400 block">최종 실결제 금액</span>
                <span className="text-2xl font-black text-zinc-950">
                  {amountToPay.toLocaleString()}원
                </span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600">
                +{Math.floor(amountToPay * 0.01).toLocaleString()}P 적립 예정
              </span>
            </div>

            {/* 결제하기 버튼 (중복 클릭 방지) */}
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white font-black text-sm rounded-2xl transition shadow-xl flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>토스페이먼츠 결제창 연결 중...</span>
                </>
              ) : (
                <>
                  <span>{amountToPay.toLocaleString()}원 토스페이먼츠 결제하기</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-[11px] text-zinc-400 space-y-1">
              <p>• 토스페이먼츠(Toss Payments) 테스트 결제 시스템이 적용됩니다.</p>
              <p>• 테스트 모드로 실제 비용 청구 없이 안전하게 결제 및 주문내역을 확인하실 수 있습니다.</p>
            </div>
          </div>
        </div>

        {/* 토스페이먼츠 안심 테스트 결제창 모달 */}
        {isTestModalOpen && preparedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-zinc-200 overflow-hidden space-y-5 p-6 sm:p-8 animate-in zoom-in-95 duration-150">
              {/* 모달 상단 헤더 */}
              <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                    T
                  </div>
                  <div>
                    <h3 className="font-black text-base text-zinc-950 flex items-center gap-1.5">
                      <span>토스페이먼츠</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">
                        테스트 결제
                      </span>
                    </h3>
                    <p className="text-[10px] text-zinc-400">Toss Payments Secure Sandbox</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="text-zinc-400 hover:text-zinc-800 text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* 주문 상품 & 결제 금액 */}
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2 text-xs">
                <div className="flex justify-between items-center text-zinc-500">
                  <span>주문 상품</span>
                  <span className="font-bold text-zinc-900 truncate max-w-[200px]">
                    {preparedOrder.orderName}
                  </span>
                </div>
                <div className="flex justify-between items-center text-zinc-500">
                  <span>주문 번호</span>
                  <span className="font-mono font-bold text-zinc-700">
                    {preparedOrder.orderNumber}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-zinc-200 text-zinc-900 font-bold">
                  <span className="text-xs">결제 요청 금액</span>
                  <span className="text-xl font-black text-blue-600">
                    {preparedOrder.amount.toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* 결제 카드사 가상 선택 */}
              <div className="space-y-2 text-xs">
                <label className="block font-bold text-zinc-700">테스트 결제 카드/수단 선택</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    '토스뱅크 체크카드',
                    'KB국민카드',
                    '신한카드',
                    '현대카드',
                    '카카오페이 머니',
                    '네이버페이 포인트',
                  ].map((card) => (
                    <button
                      key={card}
                      type="button"
                      onClick={() => setSelectedTestCard(card)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                        selectedTestCard === card
                          ? 'border-blue-600 bg-blue-50 text-blue-950 ring-2 ring-blue-600/20'
                          : 'border-zinc-200 text-zinc-700 hover:border-zinc-400 bg-white'
                      }`}
                    >
                      <span className="truncate">{card}</span>
                      {selectedTestCard === card && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 안심 안내 배너 */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/70 text-[11px] text-emerald-900 space-y-0.5">
                <p className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  실제 비용이 청구되지 않는 안전한 테스트 결제입니다.
                </p>
                <p className="text-emerald-700">
                  승인 완료 시 Supabase DB 및 마이페이지 주문 내역에 즉시 정상 반영됩니다.
                </p>
              </div>

              {/* 결제 승인 버튼 */}
              <div className="pt-1 space-y-2">
                <button
                  type="button"
                  onClick={handleExecuteTestPayment}
                  disabled={isApprovingTest}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-400 text-white font-black text-sm rounded-2xl transition shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isApprovingTest ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>결제 승인 처리 중...</span>
                    </>
                  ) : (
                    <>
                      <span>{preparedOrder.amount.toLocaleString()}원 테스트 결제 승인 완료</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(false)}
                  className="w-full py-2.5 text-xs text-zinc-500 hover:text-zinc-800 font-bold"
                >
                  결제 취소하고 주문서로 돌아가기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
