export interface Category {
  id: string;
  name: string;
  slug: string;
  subcategories?: { id: string; name: string; slug: string }[];
  isNew?: boolean;
  isHot?: boolean;
}

export interface ProductItem {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  category: string;
  subCategory?: string;
  isBundle1Plus1: boolean;
  images: string[];
  colors: string[];
  sizes: string[];
  badge?: 'BEST' | 'NEW' | '1+1' | 'SALE' | 'CUSTOM';
  rating: number;
  reviewCount: number;
  description?: string;
  isCustomAvailable?: boolean;
}

export interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  image: string;
  link: string;
  bgColor: string;
  textColor: string;
}

export interface CartItem {
  id: string;
  productId: string;
  title: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
  isBundle1Plus1: boolean;
}
