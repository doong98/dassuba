'use client';

import { useState, useEffect, useCallback } from 'react';
import { MOCK_PRODUCTS, ProductItem } from '@/lib/data/mockData';

export function useProducts() {
  const [products, setProducts] = useState<ProductItem[]>(MOCK_PRODUCTS);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      }
    } catch (err) {
      console.warn('상품 목록 불러오기 실패 (fallback 유지):', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, refetch: fetchProducts };
}

export function useProduct(id: string) {
  const { products, loading, refetch } = useProducts();
  const product = products.find((p) => p.id === id) || null;

  return { product, loading, refetch };
}
