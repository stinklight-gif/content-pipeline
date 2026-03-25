'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  BookOpen,
  Upload,
  Atom,
  Calendar,
  Image,
  LayoutDashboard,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/upload', label: 'Upload', icon: Upload },
  { href: '/atoms', label: 'Content Atoms', icon: Atom },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/assets', label: 'Assets', icon: Image },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-dark-1 border-r border-dark-3 flex flex-col z-50">
      {/* Brand */}
      <div className="p-6 border-b border-dark-3">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-shadow">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Content Pipeline</h1>
            <p className="text-[10px] text-white/40 font-medium tracking-wider uppercase">Book → Marketing</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={isActive ? 'sidebar-link-active' : 'sidebar-link'}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-dark-3">
        <div className="flex items-center gap-3 px-2">
          <UserButton afterSignOutUrl="/sign-in" />
          <span className="text-xs text-white/40">Account</span>
        </div>
      </div>
    </aside>
  );
}
