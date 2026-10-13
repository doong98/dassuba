import type { Metadata } from 'next';
import './globals.css';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import FloatingAction from '@/components/common/FloatingAction';
import AuthModal from '@/components/auth/AuthModal';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { WishlistProvider } from '@/context/WishlistContext';

export const metadata: Metadata = {
  title: '다써바 (DASSEOBA) | 모자 전문 커머스 & 단체 자수 주문',
  description: '볼캡, 버킷햇, 비니, 선바이저 전문 쇼핑몰. 1+1 기획전 및 1개부터 가능한 맞춤 컴퓨터 자수·단체 모자 제작.',
  keywords: '모자쇼핑몰, 볼캡, 대두볼캡, 버킷햇, 숏비니, 단체모자, 모자자수, 1+1모자, iamcap, 다써바',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-white text-zinc-900 selection:bg-amber-400 selection:text-zinc-950">
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Header />
              <main className="flex-1 w-full">{children}</main>
              <Footer />
              <FloatingAction />
              <AuthModal />
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
