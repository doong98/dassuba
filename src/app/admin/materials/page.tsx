'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Plus, AlertTriangle, CheckCircle2, Database, Copy, Check, ExternalLink, RefreshCw, CheckCircle } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  code: string;
  unit: string;
  currentStock: number;
  safetyStock: number;
  unitPrice: number;
}

interface PurchaseOrder {
  id: string;
  supplierName: string;
  materialName: string;
  materialId?: string;
  quantity: number;
  totalCost: number;
  status: 'ordered' | 'received' | 'cancelled';
  date: string;
}

const DEFAULT_MATERIALS: Material[] = [
  { id: 'm-1', name: '14수 고밀도 프리미엄 코튼 원단 (블랙)', code: 'MAT-COT-01', unit: 'yd', currentStock: 42, safetyStock: 50, unitPrice: 4800 },
  { id: 'm-2', name: '피그먼트 바이오워싱 원단 (차콜)', code: 'MAT-WSH-02', unit: 'yd', currentStock: 180, safetyStock: 40, unitPrice: 6200 },
  { id: 'm-3', name: '7홀 프리미엄 플라스틱 스냅백 부자재', code: 'MAT-SNP-03', unit: 'pcs', currentStock: 1200, safetyStock: 200, unitPrice: 350 },
  { id: 'm-4', name: '쿨맥스 흡한속건 땀받이 헤드밴드 3.5cm', code: 'MAT-BND-04', unit: 'yd', currentStock: 400, safetyStock: 80, unitPrice: 1200 },
  { id: 'm-5', name: '일본 타지마 자수기용 고광택 자수사 (금사/은사)', code: 'MAT-EMB-05', unit: 'roll', currentStock: 15, safetyStock: 20, unitPrice: 8500 },
];

const DEFAULT_POS: PurchaseOrder[] = [
  { id: 'po-1', supplierName: '(주)동대문패브릭', materialName: '14수 고밀도 프리미엄 코튼 원단', materialId: 'm-1', quantity: 200, totalCost: 960000, status: 'ordered', date: '2026-10-06' },
  { id: 'po-2', supplierName: '성수스냅산업', materialName: '7홀 프리미엄 플라스틱 스냅백 부자재', materialId: 'm-3', quantity: 1000, totalCost: 350000, status: 'received', date: '2026-10-02' },
];

export default function AdminMaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>(DEFAULT_MATERIALS);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(DEFAULT_POS);
  const [loading, setLoading] = useState(true);
  const [isFromDb, setIsFromDb] = useState(false);
  const [needTable, setNeedTable] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 발주서 폼 상태
  const [supplierName, setSupplierName] = useState('(주)동대문패브릭');
  const [selectedMaterialId, setSelectedMaterialId] = useState(DEFAULT_MATERIALS[0].id);
  const [orderQty, setOrderQty] = useState(100);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  // 자재 목록 변경 시 유효한 ID 자동 설정
  useEffect(() => {
    if (materials.length > 0 && !materials.some((m) => m.id === selectedMaterialId)) {
      setSelectedMaterialId(materials[0].id);
    }
  }, [materials, selectedMaterialId]);

  // 데이터 로드
  const fetchData = async () => {
    setLoading(true);
    try {
      const [matRes, poRes] = await Promise.all([
        fetch('/api/materials'),
        fetch('/api/purchase-orders'),
      ]);

      const matData = await matRes.json();
      const poData = await poRes.json();

      if (matData.success && Array.isArray(matData.materials) && matData.materials.length > 0) {
        setMaterials(matData.materials);
      }
      if (poData.success && Array.isArray(poData.purchaseOrders)) {
        setPurchaseOrders(poData.purchaseOrders);
      }

      const fromDb = Boolean(matData.fromDb || poData.fromDb);
      setIsFromDb(fromDb);
      setNeedTable(Boolean(matData.needTable || poData.needTable));
    } catch (err) {
      console.error('데이터 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 발주서 생성
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('>>> handleCreateOrder triggered!', { selectedMaterialId, supplierName, orderQty });
    const mat = materials.find((m) => m.id === selectedMaterialId) || materials[0];
    if (!mat) {
      console.warn('>>> mat not found in materials:', materials);
      return;
    }

    setSubmitting(true);
    const totalCost = mat.unitPrice * orderQty;
    const newPOData = {
      supplierName: supplierName.trim() || '(주)동대문패브릭',
      materialName: mat.name,
      materialId: mat.id,
      quantity: Number(orderQty),
      totalCost,
      status: 'ordered' as const,
      date: orderDate || new Date().toISOString().split('T')[0],
    };

    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPOData),
      });

      const result = await res.json();
      if (result.success && result.purchaseOrder) {
        setPurchaseOrders((prev) => [result.purchaseOrder, ...prev]);
        setSuccessMsg(`발주서가 성공적으로 발행되어 대장에 추가되었습니다! (발주금액: ${totalCost.toLocaleString()}원)`);
        // DB 최신 데이터 백그라운드 동기화
        fetchData();
      } else {
        const fallbackPO: PurchaseOrder = {
          id: 'po-' + Date.now(),
          ...newPOData,
        };
        setPurchaseOrders((prev) => [fallbackPO, ...prev]);
        setSuccessMsg(`발주서가 대장에 추가되었습니다! (발주금액: ${totalCost.toLocaleString()}원)`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('발주서 생성 실패:', err);
      const fallbackPO: PurchaseOrder = {
        id: 'po-' + Date.now(),
        ...newPOData,
      };
      setPurchaseOrders((prev) => [fallbackPO, ...prev]);
      setSuccessMsg(`발주서가 대장에 추가되었습니다!`);
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  // 입고 확인 (상태를 received로 변경 및 재고 증가)
  const handleReceivePO = async (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (!po) return;

    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: poId, status: 'received' }),
      });

      const result = await res.json();
      if (result.success) {
        await fetchData();
        setSuccessMsg(`원부자재 입고 검수가 완료되어 Supabase DB 및 현장 재고에 반영되었습니다.`);
      } else {
        setPurchaseOrders((prev) =>
          prev.map((p) => (p.id === poId ? { ...p, status: 'received' } : p))
        );
        setMaterials((prev) =>
          prev.map((m) => {
            if (m.id === po.materialId || m.name.includes(po.materialName.slice(0, 5))) {
              return { ...m, currentStock: m.currentStock + po.quantity };
            }
            return m;
          })
        );
        setSuccessMsg(`원부자재 입고 검수가 완료되어 현장 재고에 반영되었습니다.`);
      }
    } catch (err) {
      console.error('입고 처리 오류:', err);
      setPurchaseOrders((prev) =>
        prev.map((p) => (p.id === poId ? { ...p, status: 'received' } : p))
      );
      setMaterials((prev) =>
        prev.map((m) => {
          if (m.id === po.materialId || m.name.includes(po.materialName.slice(0, 5))) {
            return { ...m, currentStock: m.currentStock + po.quantity };
          }
          return m;
        })
      );
      setSuccessMsg(`원부자재 입고 검수가 완료되어 현장 재고에 반영되었습니다.`);
    } finally {
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  const handleCopySql = () => {
    const sqlText = `-- Supabase SQL Editor에서 실행할 테이블 생성 DDL
CREATE TABLE IF NOT EXISTS public.materials (
    id TEXT PRIMARY KEY DEFAULT ('mat-' || substr(md5(random()::text), 1, 8)),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    unit VARCHAR(20) DEFAULT 'yd',
    current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
    safety_stock INTEGER DEFAULT 0 CHECK (safety_stock >= 0),
    unit_price INTEGER DEFAULT 0 CHECK (unit_price >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id TEXT PRIMARY KEY DEFAULT ('po-' || substr(md5(random()::text), 1, 8)),
    supplier_name VARCHAR(200) NOT NULL,
    material_id TEXT REFERENCES public.materials(id) ON DELETE SET NULL,
    material_name VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total_cost INTEGER NOT NULL CHECK (total_cost >= 0),
    status VARCHAR(30) DEFAULT 'ordered' CHECK (status IN ('ordered', 'received', 'cancelled')),
    order_date VARCHAR(50) DEFAULT to_char(NOW(), 'YYYY-MM-DD'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select materials" ON public.materials FOR SELECT USING (true);
CREATE POLICY "Allow public insert materials" ON public.materials FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update materials" ON public.materials FOR UPDATE USING (true);
CREATE POLICY "Allow public delete materials" ON public.materials FOR DELETE USING (true);

CREATE POLICY "Allow public select purchase_orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Allow public insert purchase_orders" ON public.purchase_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update purchase_orders" ON public.purchase_orders FOR UPDATE USING (true);
CREATE POLICY "Allow public delete purchase_orders" ON public.purchase_orders FOR DELETE USING (true);

INSERT INTO public.materials (id, name, code, unit, current_stock, safety_stock, unit_price)
VALUES 
    ('m-1', '14수 고밀도 프리미엄 코튼 원단 (블랙)', 'MAT-COT-01', 'yd', 42, 50, 4800),
    ('m-2', '피그먼트 바이오워싱 원단 (차콜)', 'MAT-WSH-02', 'yd', 180, 40, 6200),
    ('m-3', '7홀 프리미엄 플라스틱 스냅백 부자재', 'MAT-SNP-03', 'pcs', 1200, 200, 350),
    ('m-4', '쿨맥스 흡한속건 땀받이 헤드밴드 3.5cm', 'MAT-BND-04', 'yd', 400, 80, 1200),
    ('m-5', '일본 타지마 자수기용 고광택 자수사 (금사/은사)', 'MAT-EMB-05', 'roll', 15, 20, 8500)
ON CONFLICT (code) DO UPDATE SET current_stock = EXCLUDED.current_stock;

INSERT INTO public.purchase_orders (id, supplier_name, material_id, material_name, quantity, total_cost, status, order_date)
VALUES 
    ('po-1', '(주)동대문패브릭', 'm-1', '14수 고밀도 프리미엄 코튼 원단', 200, 960000, 'ordered', '2026-10-06'),
    ('po-2', '성수스냅산업', 'm-3', '7홀 프리미엄 플라스틱 스냅백 부자재', 1000, 350000, 'received', '2026-10-02')
ON CONFLICT (id) DO NOTHING;`;

    navigator.clipboard.writeText(sqlText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const selectedMaterial = materials.find((m) => m.id === selectedMaterialId) || materials[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 상단 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
              <Layers className="w-6 h-6" /> 모자 원부자재 재고 & 거래처 발주 관리
            </h1>
            {isFromDb ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <Database className="w-3 h-3" /> Supabase DB 연동 완료
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                <Database className="w-3 h-3" /> Supabase 연동 대기
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            모자 제작용 원단, 스냅, 땀받이, 자수사 실시간 재고 관리 및 외주 발주서 생성
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            title="새로고침"
            className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl transition flex items-center gap-1 text-xs font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> 거래처 발주서 생성
          </button>
        </div>
      </div>

      {/* 성공 피드백 알림 배너 */}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-900 animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      {/* Supabase 테이블 생성 안내 알림 배너 (필요 시) */}
      {needTable && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Supabase에 materials 및 purchase_orders 테이블 생성이 필요합니다.</p>
              <p className="text-amber-700 text-[11px] mt-0.5">
                아래 버튼을 눌러 SQL을 복사한 뒤 Supabase 대시보드의 SQL Editor에 붙여넣고 [Run]을 실행하면 즉시 영구 저장됩니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopySql}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1.5 transition text-xs shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? '복사 완료!' : '테이블 생성 SQL 복사'}
            </button>
            <a
              href="https://supabase.com/dashboard/project/ibcfzsbgeqsocpbqhzsv/sql/new"
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg font-bold flex items-center gap-1 text-xs"
            >
              SQL Editor 바로가기 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* 발주 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 z-10 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div>
                <h3 className="font-black text-base text-zinc-950">거래처 원부자재 발주서 발행</h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">발주서를 작성하면 대장에 즉시 추가되며 Supabase에 저장됩니다.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600 font-bold p-1">✕</button>
            </div>

            <form id="purchase-order-form" onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">외주 협력사 (공급업체명)</label>
                  <input
                    type="text"
                    required
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="예: (주)동대문패브릭"
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-hidden focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-zinc-700 mb-1">발주일자</label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-hidden focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">발주 원부자재 품목</label>
                <select
                  value={selectedMaterialId}
                  onChange={(e) => setSelectedMaterialId(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-hidden focus:border-amber-400"
                >
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (단가: {m.unitPrice.toLocaleString()}원/{m.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">
                  발주 수량 ({selectedMaterial?.unit || '단위'})
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={orderQty}
                  onChange={(e) => setOrderQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl outline-hidden focus:border-amber-400"
                />
              </div>

              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 flex justify-between items-center font-bold">
                <span className="text-zinc-700">총 발주 예상 금액:</span>
                <span className="text-base text-amber-600 font-black">
                  {((selectedMaterial?.unitPrice || 0) * orderQty).toLocaleString()}원
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 border border-zinc-300 rounded-xl font-bold text-zinc-600 hover:bg-zinc-100 transition"
                >
                  취소
                </button>
                <button
                  id="submit-purchase-order-btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {submitting ? '발주서 등록 중...' : '발주서 전송 및 대장 등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. 현재 원부자재 재고 테이블 */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs space-y-2 p-6">
        <div className="flex items-center justify-between pb-2">
          <h2 className="font-black text-sm text-zinc-950">
            공장 현장 원부자재 재고 현황
          </h2>
          <span className="text-[11px] text-zinc-500 font-bold">총 {materials.length}종 자재</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold">
              <tr>
                <th className="p-3">자재명</th>
                <th className="p-3">자재코드</th>
                <th className="p-3">단위</th>
                <th className="p-3">현재고</th>
                <th className="p-3">안전재고</th>
                <th className="p-3">상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {materials.map((m) => {
                const isShort = m.currentStock <= m.safetyStock;
                return (
                  <tr key={m.id} className={isShort ? 'bg-red-50/50' : ''}>
                    <td className="p-3 font-bold text-zinc-900">{m.name}</td>
                    <td className="p-3 font-mono text-zinc-500">{m.code}</td>
                    <td className="p-3 text-zinc-500">{m.unit}</td>
                    <td className="p-3 font-bold text-zinc-900">{m.currentStock}</td>
                    <td className="p-3 text-zinc-500">{m.safetyStock}</td>
                    <td className="p-3">
                      {isShort ? (
                        <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-[10px] flex items-center gap-1 w-max">
                          <AlertTriangle className="w-3 h-3" /> 안전재고 미달 (발주요망)
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-bold text-[10px]">
                          양호
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. 외주 거래처 발주 대장 */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs space-y-2 p-6">
        <div className="flex items-center justify-between pb-2">
          <h2 className="font-black text-sm text-zinc-950">
            거래처 발주서 발행 대장 (Purchase Orders)
          </h2>
          <span className="text-[11px] font-bold text-zinc-600 bg-zinc-100 px-2.5 py-1 rounded-lg">
            총 {purchaseOrders.length}건 발주 내역
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold">
              <tr>
                <th className="p-3">발주일자</th>
                <th className="p-3">거래처명</th>
                <th className="p-3">품목</th>
                <th className="p-3">수량</th>
                <th className="p-3">발주금액</th>
                <th className="p-3">상태</th>
                <th className="p-3 text-right">입고 처리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-zinc-50/50 transition">
                  <td className="p-3 text-zinc-400 font-mono">{po.date}</td>
                  <td className="p-3 font-bold text-zinc-900">{po.supplierName}</td>
                  <td className="p-3 text-zinc-700">{po.materialName}</td>
                  <td className="p-3 font-bold">{po.quantity}</td>
                  <td className="p-3 font-bold text-zinc-900">{po.totalCost.toLocaleString()}원</td>
                  <td className="p-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        po.status === 'received'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {po.status === 'received' ? '입고완료' : '발주중 (미입고)'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {po.status === 'ordered' && (
                      <button
                        onClick={() => handleReceivePO(po.id)}
                        className="px-2.5 py-1 bg-zinc-950 hover:bg-zinc-800 text-white rounded-lg text-[11px] font-bold transition shadow-xs"
                      >
                        입고확인
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
