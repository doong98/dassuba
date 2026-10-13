'use client';

import React from 'react';
import Link from 'next/link';
import { Award, Flame, Sparkles, Scissors, ShieldAlert, Sun, Layers, Compass } from 'lucide-react';

const QUICK_ITEMS = [
  {
    name: '1+1 특가',
    tag: '기획전',
    href: '/category/bundle1plus1',
    icon: Flame,
    color: 'bg-red-500 text-white',
    badge: 'HOT',
  },
  {
    name: '베스트 50',
    tag: '랭킹',
    href: '/category/best',
    icon: Award,
    color: 'bg-amber-500 text-white',
    badge: 'BEST',
  },
  {
    name: '볼캡',
    tag: '딥핏/빅사이즈',
    href: '/category/ballcap',
    icon: Compass,
    color: 'bg-zinc-900 text-white',
  },
  {
    name: '버킷햇',
    tag: '벙거지/사파리',
    href: '/category/buckethat',
    icon: Layers,
    color: 'bg-zinc-800 text-white',
  },
  {
    name: '비니/와치캡',
    tag: '숏/골지',
    href: '/category/beanie',
    icon: Sparkles,
    color: 'bg-stone-700 text-white',
  },
  {
    name: '선바이저',
    tag: '골프/스포츠',
    href: '/category/sunvisor',
    icon: Sun,
    color: 'bg-emerald-600 text-white',
  },
  {
    name: '단체 자수제작',
    tag: '컴퓨터자수/인쇄',
    href: '/custom',
    icon: Scissors,
    color: 'bg-blue-600 text-white',
    badge: '1개부터',
  },
  {
    name: '신상품',
    tag: '2026 S/S',
    href: '/category/new',
    icon: Sparkles,
    color: 'bg-purple-600 text-white',
  },
];

export default function QuickCategories() {
  return (
    <section className="py-8 sm:py-10 bg-white border-b border-zinc-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-4 text-center">
          {QUICK_ITEMS.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className="group flex flex-col items-center p-2 rounded-2xl hover:bg-zinc-50 transition-all duration-200"
              >
                <div className="relative mb-2">
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all duration-200 ${item.color}`}
                  >
                    <IconComponent className="w-6 h-6 sm:w-7 sm:h-7" />
                  </div>
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full ring-2 ring-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-xs sm:text-sm font-bold text-zinc-900 group-hover:text-amber-600 transition">
                  {item.name}
                </span>
                <span className="text-[10px] text-zinc-400 hidden sm:block">
                  {item.tag}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
