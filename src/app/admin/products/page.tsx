'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MOCK_PRODUCTS } from '@/lib/data/mockData';
import { ProductItem } from '@/types/shop';
import {
  Package,
  Plus,
  Trash2,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Sparkles,
  UploadCloud,
  ImageIcon,
  Loader2,
  X,
} from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isDbConnected, setIsDbConnected] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 신규 상품 폼 상태
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState(19800);
  const [originalPrice, setOriginalPrice] = useState(28000);
  const [category, setCategory] = useState('ballcap');
  const [isBundle1Plus1, setIsBundle1Plus1] = useState(false);
  const [isCustomAvailable, setIsCustomAvailable] = useState(true);
  const [imageUrl, setImageUrl] = useState('/images/products/bundle-1.png');
  const [toastMessage, setToastMessage] = useState('');

  // 이미지 업로드 관련 상태
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStorageType, setUploadStorageType] = useState<'supabase' | 'local_fallback' | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isDirectUrlMode, setIsDirectUrlMode] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 1. Supabase 상품 목록 조회
  const fetchProducts = async () => {
    setIsLoading(true);
    setDbError(null);
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
        setIsDbConnected(Boolean(data.fromDb));
        if (!data.fromDb && data.error) {
          setDbError(data.error);
        }
      }
    } catch (err: any) {
      console.error('상품 목록 불러오기 실패:', err);
      setDbError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // 이미지 파일 업로드 핸들러
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일(PNG, JPG, WEBP 등)만 업로드할 수 있습니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 용량은 최대 10MB 이하만 가능합니다.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (data.success && data.url) {
        setImageUrl(data.url);
        setUploadedFileName(file.name);
        setUploadStorageType(data.storage);
        showToast(
          data.storage === 'supabase'
            ? '☁️ Supabase Storage에 이미지가 업로드되었습니다!'
            : '📁 이미지가 안전하게 업로드되었습니다!'
        );
      } else {
        setUploadError(data.error || '이미지 업로드에 실패했습니다.');
        alert('업로드 실패: ' + (data.error || '알 수 없는 오류'));
      }
    } catch (err: any) {
      setUploadError(err.message || '서버 통신 오류');
      alert('이미지 업로드 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 2. 신규 상품 등록 (Supabase products 테이블 INSERT)
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('상품명을 입력해주세요.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        price,
        originalPrice,
        category,
        subCategory: 'basic',
        isBundle1Plus1,
        isCustomAvailable,
        images: [imageUrl || '/images/products/bundle-1.png'],
        colors: ['블랙', '화이트'],
        sizes: ['FREE'],
        badge: (isBundle1Plus1 ? '1+1' : 'NEW') as ProductItem['badge'],
        description: '다써바 신규 등록 모자 상품',
      };

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success && data.product) {
        setProducts((prev) => [data.product, ...prev]);
        setIsModalOpen(false);
        setTitle('');
        setImageUrl('/images/products/bundle-1.png');
        setUploadedFileName('');
        setUploadStorageType(null);
        setIsDbConnected(true);
        showToast(`🎉 "${data.product.title}" 상품이 Supabase DB에 성공적으로 등록되었습니다!`);
      } else {
        // 테이블이 아직 없거나 Supabase 에러인 경우
        const errorMsg = data.error || '상품 등록 실패';
        console.warn('Supabase 등록 안내:', errorMsg);

        // 로컬 상태에도 임시 반영
        const fallbackProd: ProductItem = {
          id: 'prod-' + Date.now(),
          ...payload,
          rating: 5.0,
          reviewCount: 0,
        };
        setProducts((prev) => [fallbackProd, ...prev]);
        setIsModalOpen(false);
        setTitle('');
        setImageUrl('/images/products/bundle-1.png');
        setUploadedFileName('');
        setUploadStorageType(null);

        if (errorMsg.includes('schema cache') || errorMsg.includes('not find') || errorMsg.includes('products')) {
          setIsSqlModalOpen(true);
        } else {
          alert(`Supabase 등록 오류: ${errorMsg}\n(화면에는 임시 등록되었습니다)`);
        }
      }
    } catch (err: any) {
      alert('서버 통신 오류가 발생했습니다: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. 상품 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('해당 상품을 삭제하시겠습니까?')) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
        showToast('상품이 삭제되었습니다.');
      }
    } catch (err: any) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const copySqlToClipboard = () => {
    const sqlText = `-- Supabase 대시보드 (https://ibcfzsbgeqsocpbqhzsv.supabase.co) -> SQL Editor에서 실행
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod-' || substr(md5(random()::text), 1, 8)),
    title VARCHAR(200) NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    original_price INTEGER CHECK (original_price >= 0),
    category VARCHAR(50) NOT NULL,
    sub_category VARCHAR(50),
    is_bundle_1plus1 BOOLEAN DEFAULT FALSE,
    is_custom_available BOOLEAN DEFAULT TRUE,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    colors TEXT[] DEFAULT ARRAY[]::TEXT[],
    sizes TEXT[] DEFAULT ARRAY[]::TEXT[],
    badge VARCHAR(20),
    rating NUMERIC(3, 2) DEFAULT 5.0,
    review_count INTEGER DEFAULT 0,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public select products" ON public.products;
DROP POLICY IF EXISTS "Allow public insert products" ON public.products;
DROP POLICY IF EXISTS "Allow public update products" ON public.products;
DROP POLICY IF EXISTS "Allow public delete products" ON public.products;
CREATE POLICY "Allow public select products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON public.products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update products" ON public.products FOR UPDATE USING (true);
CREATE POLICY "Allow public delete products" ON public.products FOR DELETE USING (true);
`;
    navigator.clipboard.writeText(sqlText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-zinc-950 text-white px-5 py-3 rounded-full text-xs font-bold shadow-2xl z-50 flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 상단 타이틀 & Supabase 상태 배지 & 액션 버튼 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black text-zinc-950 tracking-tight flex items-center gap-2">
              <Package className="w-6 h-6" /> 모자 상품 마스터 관리
            </h1>
            {isDbConnected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Supabase DB 실시간 연동
              </span>
            ) : (
              <button
                onClick={() => setIsSqlModalOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition"
                title="클릭하여 Supabase DDL SQL 확인"
              >
                <Database className="w-3 h-3 text-amber-700" />
                Supabase DDL 설정 안내
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            전체 상품 리스트 조회 및 신규 모자 등록 시 Supabase <code>public.products</code> 테이블에 실시간 저장됩니다.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProducts}
            className="p-2.5 border border-zinc-300 text-zinc-700 hover:bg-zinc-100 rounded-xl transition"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            data-testid="open-add-modal-btn"
            onClick={() => {
              console.log('>>> BUTTON CLICKED: setIsModalOpen(true)');
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" /> 신규 상품 등록
          </button>
        </div>
      </div>

      {/* Supabase 테이블 미생성 알림 배너 */}
      {!isDbConnected && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <Database className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Supabase <code>products</code> 테이블 생성 준비 완료</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                프로젝트의 <code>supabase/create_products_table.sql</code> 파일로 DB에 테이블과 8종 상품 시드를 일괄 등록할 수 있습니다.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSqlModalOpen(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-lg transition shrink-0 shadow-xs"
          >
            SQL 스크립트 보기 / 복사
          </button>
        </div>
      )}

      {/* SQL 안내 모달 */}
      {isSqlModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsSqlModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 z-10 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-zinc-950">Supabase products 테이블 생성 안내</h3>
              </div>
              <button onClick={() => setIsSqlModalOpen(false)} className="text-zinc-400 font-bold text-sm">✕</button>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Supabase 대시보드 <strong>SQL Editor</strong>에서 아래 쿼리를 실행하시면 
              <strong>8종 대표 모자 상품 마스터 데이터</strong>와 <strong>신규 등록 권한</strong>이 자동 구성됩니다.
            </p>

            <div className="bg-zinc-900 text-zinc-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60 border border-zinc-800">
              <pre>{`-- 1. products 테이블 생성
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY DEFAULT ('prod-' || substr(md5(random()::text), 1, 8)),
    title VARCHAR(200) NOT NULL,
    price INTEGER NOT NULL CHECK (price >= 0),
    original_price INTEGER CHECK (original_price >= 0),
    category VARCHAR(50) NOT NULL,
    is_bundle_1plus1 BOOLEAN DEFAULT FALSE,
    is_custom_available BOOLEAN DEFAULT TRUE,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    colors TEXT[] DEFAULT ARRAY[]::TEXT[],
    sizes TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public select products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Allow public insert products" ON public.products FOR INSERT WITH CHECK (true);`}</pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href="https://supabase.com/dashboard/project/ibcfzsbgeqsocpbqhzsv/sql/new"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold"
              >
                Supabase SQL Editor 바로가기 <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copySqlToClipboard}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-zinc-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedSql ? '복사 완료!' : '전체 SQL 복사'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsSqlModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-xl font-bold text-xs text-zinc-700"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 등록 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200 z-10 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <h3 className="font-black text-base text-zinc-950">신규 모자 상품 등록 (Supabase 저장)</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 font-bold">✕</button>
            </div>

            <form id="admin-product-create-form" onSubmit={handleAddProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 mb-1">상품명 *</label>
                <input
                  data-testid="product-title-input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 2026 딥 크라운 피그먼트 볼캡"
                  required
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">판매가 (원) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(parseInt(e.target.value) || 0)}
                    min={0}
                    required
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 mb-1">정상가 (원)</label>
                  <input
                    type="number"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 mb-1">카테고리</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none"
                >
                  <option value="ballcap">볼캡 (Ballcap)</option>
                  <option value="buckethat">버킷햇 (Buckethat)</option>
                  <option value="beanie">비니 (Beanie)</option>
                  <option value="sunvisor">선바이저 (Sunvisor)</option>
                </select>
              </div>

              {/* 이미지 업로드 섹션 */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-zinc-700 flex items-center gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5 text-amber-500" />
                    대표 이미지 등록 (Supabase Storage 저장)
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsDirectUrlMode(!isDirectUrlMode)}
                    className="text-[11px] text-zinc-500 hover:text-zinc-800 underline"
                  >
                    {isDirectUrlMode ? '파일 업로드로 전환' : '직접 URL 입력'}
                  </button>
                </div>

                {isDirectUrlMode ? (
                  <div>
                    <input
                      data-testid="product-image-url-input"
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... 또는 /images/products/..."
                      className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:bg-white focus:outline-none text-xs"
                    />
                  </div>
                ) : (
                  <div>
                    <input
                      data-testid="product-image-file-input"
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(file);
                      }}
                      className="hidden"
                    />

                    {isUploading ? (
                      <div className="p-5 border-2 border-dashed border-amber-300 bg-amber-50/50 rounded-2xl flex flex-col items-center justify-center gap-2 text-zinc-600">
                        <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                        <span className="text-xs font-bold text-amber-800">
                          Supabase Storage에 이미지 업로드 중...
                        </span>
                      </div>
                    ) : imageUrl ? (
                      <div className="p-3 border border-zinc-200 bg-zinc-50 rounded-2xl flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={imageUrl}
                            alt="업로드 미리보기"
                            className="w-14 h-14 object-cover rounded-xl border border-zinc-300 shrink-0 bg-white"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="font-bold text-zinc-800 truncate block text-xs">
                                {uploadedFileName || '대표 이미지 선택됨'}
                              </span>
                              {uploadStorageType === 'supabase' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                                  Supabase Storage
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-zinc-400 font-mono truncate max-w-[200px]">
                              {imageUrl}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1.5 bg-white border border-zinc-300 hover:bg-zinc-100 rounded-lg text-[11px] font-semibold text-zinc-700 transition"
                          >
                            변경
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrl('');
                              setUploadedFileName('');
                              setUploadStorageType(null);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-500 rounded-lg transition"
                            title="삭제"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        data-testid="image-dropzone"
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="p-5 border-2 border-dashed border-zinc-300 hover:border-zinc-500 bg-zinc-50/70 hover:bg-zinc-50 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition group"
                      >
                        <div className="w-9 h-9 rounded-full bg-zinc-200/80 group-hover:bg-zinc-900 group-hover:text-white flex items-center justify-center transition">
                          <UploadCloud className="w-5 h-5 text-zinc-600 group-hover:text-white" />
                        </div>
                        <p className="text-xs font-bold text-zinc-700">
                          클릭하여 이미지 파일 선택 또는 드래그 앤 드롭
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          PNG, JPG, WEBP (최대 10MB) - Supabase Storage 자동 업로드
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 플래그 옵션 */}
              <div className="p-3 bg-zinc-50 rounded-xl space-y-2 border border-zinc-200">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-800">
                  <input
                    type="checkbox"
                    checked={isBundle1Plus1}
                    onChange={(e) => setIsBundle1Plus1(e.target.checked)}
                    className="rounded w-4 h-4 accent-red-600"
                  />
                  <span>1+1 기획전 묶음 할인 대상 상품</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-zinc-800">
                  <input
                    type="checkbox"
                    checked={isCustomAvailable}
                    onChange={(e) => setIsCustomAvailable(e.target.checked)}
                    className="rounded w-4 h-4 accent-blue-600"
                  />
                  <span>단체 자수/커스텀 제작 가능</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-zinc-300 rounded-xl font-bold text-zinc-600"
                >
                  취소
                </button>
                <button
                  data-testid="product-submit-btn"
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-zinc-950 hover:bg-zinc-800 text-white rounded-xl font-bold flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  {submitting ? '저장 중...' : 'Supabase 저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 상품 테이블 */}
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-xs">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-600 font-bold">
            <tr>
              <th className="p-3.5">상품정보</th>
              <th className="p-3.5">카테고리</th>
              <th className="p-3.5">판매가</th>
              <th className="p-3.5">1+1 여부</th>
              <th className="p-3.5">단체자수</th>
              <th className="p-3.5 text-right">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {products.map((item) => (
              <tr key={item.id} className="hover:bg-zinc-50/50">
                <td className="p-3.5 flex items-center gap-3">
                  <img
                    src={item.images?.[0] || '/images/products/bundle-1.png'}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover bg-zinc-100 shrink-0 border border-zinc-200"
                  />
                  <div>
                    <span className="font-bold text-zinc-900 block">{item.title}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">ID: {item.id}</span>
                  </div>
                </td>
                <td className="p-3.5 text-zinc-500 capitalize">{item.category}</td>
                <td className="p-3.5 font-bold text-zinc-900">{item.price.toLocaleString()}원</td>
                <td className="p-3.5">
                  {item.isBundle1Plus1 ? (
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold text-[10px]">1+1 적용</span>
                  ) : (
                    <span className="text-zinc-400">-</span>
                  )}
                </td>
                <td className="p-3.5">
                  {item.isCustomAvailable ? (
                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold text-[10px]">가능</span>
                  ) : (
                    <span className="text-zinc-400">불가</span>
                  )}
                </td>
                <td className="p-3.5 text-right">
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 transition"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
