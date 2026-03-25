'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Atom as AtomIcon, Flame, Tag, ChevronDown } from 'lucide-react';

interface ContentAtom {
  id: string;
  book_slug: string;
  book_title: string;
  content_type: string;
  text: string;
  tags: string[];
  tone: string;
  viral_potential: number;
  platforms: string[];
  hook_angle: string;
  created_at: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  tiktok: 'badge-tiktok',
  instagram: 'badge-instagram',
  pinterest: 'badge-pinterest',
  facebook: 'badge-facebook',
  blog: 'badge-blog',
  email: 'badge-email',
};

const VIRAL_COLORS = [
  'bg-gray-500', 'bg-gray-500', 'bg-gray-400',
  'bg-yellow-500', 'bg-yellow-400', 'bg-yellow-300',
  'bg-orange-400', 'bg-orange-300',
  'bg-red-400', 'bg-red-300', 'bg-rose-400',
];

export default function AtomsPage() {
  const [atoms, setAtoms] = useState<ContentAtom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterBook, setFilterBook] = useState('');
  const [filterType, setFilterType] = useState('');
  const [minViral, setMinViral] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAtoms();
  }, []);

  const fetchAtoms = async () => {
    try {
      const res = await fetch('/api/atoms');
      if (res.ok) {
        const data = await res.json();
        setAtoms(data.atoms || []);
      }
    } catch (err) {
      console.error('Error fetching atoms:', err);
    } finally {
      setLoading(false);
    }
  };

  const books = useMemo(() => [...new Set(atoms.map(a => a.book_title))], [atoms]);
  const types = useMemo(() => [...new Set(atoms.map(a => a.content_type))], [atoms]);
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    atoms.forEach(a => a.tags?.forEach(t => tagSet.add(t)));
    return [...tagSet].sort();
  }, [atoms]);

  const filtered = useMemo(() => {
    return atoms.filter(a => {
      if (search && !a.text.toLowerCase().includes(search.toLowerCase()) &&
          !a.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
      if (filterPlatform && !a.platforms?.includes(filterPlatform)) return false;
      if (filterBook && a.book_title !== filterBook) return false;
      if (filterType && a.content_type !== filterType) return false;
      if (minViral && a.viral_potential < minViral) return false;
      return true;
    });
  }, [atoms, search, filterPlatform, filterBook, filterType, minViral]);

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Content Atoms</h1>
          <p className="page-description">{atoms.length} atoms extracted from {books.length} book{books.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span className="px-2 py-1 bg-dark-3 rounded-lg">{filtered.length} shown</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-card p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search atoms by text or tag..."
              className="input-field pl-10"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-ghost ${showFilters ? 'bg-dark-3 text-white' : ''}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-dark-4 animate-slide-up">
            <div>
              <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Platform</label>
              <select
                value={filterPlatform}
                onChange={(e) => setFilterPlatform(e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="">All platforms</option>
                {['tiktok', 'instagram', 'pinterest', 'facebook', 'blog', 'email'].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Book</label>
              <select
                value={filterBook}
                onChange={(e) => setFilterBook(e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="">All books</option>
                {books.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="input-field text-sm py-2"
              >
                <option value="">All types</option>
                {types.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-white/40 uppercase tracking-wider mb-1.5">Min Viral Score</label>
              <select
                value={minViral}
                onChange={(e) => setMinViral(Number(e.target.value))}
                className="input-field text-sm py-2"
              >
                <option value={0}>Any score</option>
                {[5, 6, 7, 8, 9, 10].map(v => (
                  <option key={v} value={v}>{v}+</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Atoms Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <AtomIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 font-medium">No content atoms found</p>
          <p className="text-xs text-white/20 mt-1">Upload a manuscript to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((atom, i) => (
            <div
              key={atom.id}
              className="glass-card-hover p-5 flex flex-col gap-3 animate-slide-up"
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms`}}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <span className="badge bg-dark-4 text-white/50 border-dark-5 capitalize">{atom.content_type}</span>
                <div className="flex items-center gap-1.5">
                  <Flame className={`w-3.5 h-3.5 ${atom.viral_potential >= 8 ? 'text-red-400' : atom.viral_potential >= 5 ? 'text-yellow-400' : 'text-white/20'}`} />
                  <span className="text-xs font-bold text-white/60">{atom.viral_potential}/10</span>
                </div>
              </div>

              {/* Text */}
              <p className="text-sm text-white/80 leading-relaxed flex-1">&ldquo;{atom.text}&rdquo;</p>

              {/* Viral bar */}
              <div className="viral-bar">
                <div
                  className={`viral-bar-fill ${VIRAL_COLORS[atom.viral_potential] || 'bg-gray-500'}`}
                  style={{ width: `${atom.viral_potential * 10}%` }}
                />
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {atom.tags?.slice(0, 4).map(tag => (
                  <span key={tag} className="inline-flex items-center gap-1 text-[10px] text-white/30 bg-dark-4 px-2 py-0.5 rounded-md">
                    <Tag className="w-2.5 h-2.5" />{tag}
                  </span>
                ))}
              </div>

              {/* Platforms */}
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-dark-4">
                {atom.platforms?.map(p => (
                  <span key={p} className={PLATFORM_COLORS[p] || 'badge bg-dark-4 text-white/40'}>{p}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
