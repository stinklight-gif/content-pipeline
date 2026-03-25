import { createServerClient } from '@/lib/supabase';
import {
  BookOpen,
  Atom,
  Calendar,
  Image,
  TrendingUp,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

async function getStats() {
  try {
    const sb = createServerClient();
    const [manuscripts, atoms, calendarEntries, assets] = await Promise.all([
      sb.from('manuscripts').select('id', { count: 'exact', head: true }),
      sb.from('content_atoms').select('id', { count: 'exact', head: true }),
      sb.from('content_calendar').select('id', { count: 'exact', head: true }),
      sb.from('generated_assets').select('id', { count: 'exact', head: true }),
    ]);
    return {
      manuscripts: manuscripts.count ?? 0,
      atoms: atoms.count ?? 0,
      calendar: calendarEntries.count ?? 0,
      assets: assets.count ?? 0,
    };
  } catch {
    return { manuscripts: 0, atoms: 0, calendar: 0, assets: 0 };
  }
}

export default async function DashboardPage() {
  const stats = await getStats();

  const statCards = [
    { label: 'Books Processed', value: stats.manuscripts, icon: BookOpen, color: 'from-brand-500 to-brand-700', href: '/upload' },
    { label: 'Content Atoms', value: stats.atoms, icon: Atom, color: 'from-purple-500 to-purple-700', href: '/atoms' },
    { label: 'Calendar Entries', value: stats.calendar, icon: Calendar, color: 'from-emerald-500 to-emerald-700', href: '/calendar' },
    { label: 'Generated Assets', value: stats.assets, icon: Image, color: 'from-amber-500 to-amber-700', href: '/assets' },
  ];

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">
          <span className="gradient-text">Content Pipeline</span>
        </h1>
        <p className="page-description">
          Turn book manuscripts into multi-platform marketing content
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, href }, i) => (
          <Link href={href} key={label}>
            <div className="glass-card-hover p-5 group cursor-pointer animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <TrendingUp className="w-4 h-4 text-white/20 group-hover:text-brand-400 transition-colors" />
              </div>
              <p className="text-2xl font-bold">{value.toLocaleString()}</p>
              <p className="text-xs text-white/40 mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="glass-card p-6 mb-8">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link href="/upload" className="btn-primary justify-center">
            <Zap className="w-4 h-4" />
            Upload New Manuscript
          </Link>
          <Link href="/atoms" className="btn-secondary justify-center">
            <Atom className="w-4 h-4" />
            Browse Content Atoms
          </Link>
          <Link href="/calendar" className="btn-secondary justify-center">
            <Calendar className="w-4 h-4" />
            View Calendar
          </Link>
        </div>
      </div>

      {/* Pipeline Overview */}
      <div className="glass-card p-6">
        <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-6">Pipeline Flow</h2>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {['Upload', 'Extract', 'Format', 'Generate', 'Schedule'].map((step, i) => (
            <div key={step} className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-3 border border-dark-4">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${i === 0 ? 'bg-brand-500 text-white' : 'bg-dark-4 text-white/40'}`}>
                  {i + 1}
                </div>
                <span className="text-sm font-medium text-white/70">{step}</span>
              </div>
              {i < 4 && (
                <div className="w-8 h-px bg-dark-4 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
