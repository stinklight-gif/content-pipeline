'use client';

import { useState, useEffect } from 'react';
import { Image as ImageIcon, Download, Eye, Grid, List } from 'lucide-react';

interface Asset {
  id: string;
  platform: string;
  asset_type: string;
  public_url: string;
  metadata: any;
  created_at: string;
}

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    try {
      const res = await fetch('/api/assets');
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets || []);
      }
    } catch (err) {
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filterPlatform ? assets.filter(a => a.platform === filterPlatform) : assets;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Generated Assets</h1>
          <p className="page-description">{assets.length} images across all platforms</p>
        </div>
        <div className="flex items-center gap-1 bg-dark-3 rounded-xl p-1">
          <button
            onClick={() => setView('grid')}
            className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-dark-4 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView('list')}
            className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-dark-4 text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Platform Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button
          onClick={() => setFilterPlatform('')}
          className={`badge ${!filterPlatform ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' : 'bg-dark-3 text-white/40 border border-dark-4 hover:text-white/60'} cursor-pointer transition-colors`}
        >
          All
        </button>
        {['instagram', 'pinterest', 'facebook'].map(p => (
          <button
            key={p}
            onClick={() => setFilterPlatform(filterPlatform === p ? '' : p)}
            className={`badge cursor-pointer transition-colors ${
              filterPlatform === p
                ? `badge-${p}`
                : 'bg-dark-3 text-white/40 border border-dark-4 hover:text-white/60'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-4" />
          <p className="text-white/40 font-medium">No generated assets yet</p>
          <p className="text-xs text-white/20 mt-1">Upload a manuscript and run the pipeline to generate images</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((asset, i) => (
            <div
              key={asset.id}
              className="glass-card-hover overflow-hidden group cursor-pointer animate-slide-up"
              style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
              onClick={() => setPreviewAsset(asset)}
            >
              <div className="relative aspect-square bg-dark-3">
                <img
                  src={asset.public_url}
                  alt={asset.asset_type}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between">
                  <span className={`badge-${asset.platform}`}>{asset.platform}</span>
                  <span className="text-[10px] text-white/30">{asset.asset_type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((asset, i) => (
            <div
              key={asset.id}
              className="glass-card-hover p-3 flex items-center gap-4 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${Math.min(i * 30, 200)}ms` }}
              onClick={() => setPreviewAsset(asset)}
            >
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-dark-3 shrink-0">
                <img src={asset.public_url} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{asset.asset_type}</p>
                <p className="text-xs text-white/40">{new Date(asset.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`badge-${asset.platform}`}>{asset.platform}</span>
              <a
                href={asset.public_url}
                download
                onClick={(e) => e.stopPropagation()}
                className="btn-ghost p-2"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Preview */}
      {previewAsset && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-8 animate-fade-in"
          onClick={() => setPreviewAsset(null)}
        >
          <div className="max-w-2xl max-h-[80vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewAsset.public_url}
              alt={previewAsset.asset_type}
              className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
            />
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`badge-${previewAsset.platform}`}>{previewAsset.platform}</span>
                <span className="text-xs text-white/40">{previewAsset.asset_type}</span>
              </div>
              <a href={previewAsset.public_url} download className="btn-primary text-sm">
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
