'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle, BookOpen } from 'lucide-react';

type Status = 'idle' | 'uploading' | 'extracting' | 'formatting' | 'generating' | 'scheduling' | 'complete' | 'error';

const STAGE_LABELS: Record<string, string> = {
  uploading: 'Uploading manuscript...',
  extracting: 'Extracting content atoms with AI...',
  formatting: 'Formatting for all platforms...',
  generating: 'Generating quote card & pin images...',
  scheduling: 'Creating content calendar...',
  complete: 'Pipeline complete!',
  error: 'Something went wrong',
};

const PIPELINE_STAGES = ['uploading', 'extracting', 'formatting', 'generating', 'scheduling', 'complete'];

export default function UploadPage() {
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState('');
  const [bookTitle, setBookTitle] = useState('');
  const [bookSlug, setBookSlug] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<any>(null);
  const [dragOver, setDragOver] = useState(false);

  const generateSlug = (title: string) => {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setBookTitle(title);
    setBookSlug(generateSlug(title));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.type === 'text/plain' || droppedFile.name.endsWith('.txt') || droppedFile.name.endsWith('.md'))) {
      setFile(droppedFile);
      if (!bookTitle) {
        const name = droppedFile.name.replace(/\.(txt|md|text)$/, '').replace(/[-_]/g, ' ');
        setBookTitle(name);
        setBookSlug(generateSlug(name));
      }
    }
  }, [bookTitle]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      if (!bookTitle) {
        const name = selected.name.replace(/\.(txt|md|text)$/, '').replace(/[-_]/g, ' ');
        setBookTitle(name);
        setBookSlug(generateSlug(name));
      }
    }
  };

  const runPipeline = async () => {
    if (!file || !bookSlug) return;

    setError('');

    try {
      // Stage 1: Upload
      setStatus('uploading');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bookSlug', bookSlug);
      formData.append('bookTitle', bookTitle);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error(await uploadRes.text());
      const { manuscriptId } = await uploadRes.json();

      // Stage 2: Extract
      setStatus('extracting');
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manuscriptId }),
      });
      if (!extractRes.ok) throw new Error(await extractRes.text());

      // Stage 3: Format
      setStatus('formatting');
      const formatRes = await fetch('/api/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manuscriptId }),
      });
      if (!formatRes.ok) throw new Error(await formatRes.text());

      // Stage 4: Generate images
      setStatus('generating');
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manuscriptId }),
      });
      if (!genRes.ok) throw new Error(await genRes.text());

      // Stage 5: Calendar
      setStatus('scheduling');
      const calRes = await fetch('/api/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manuscriptId }),
      });
      if (!calRes.ok) throw new Error(await calRes.text());
      const calData = await calRes.json();

      setResults(calData);
      setStatus('complete');
    } catch (err: any) {
      setError(err.message || 'Pipeline failed');
      setStatus('error');
    }
  };

  const currentStageIndex = PIPELINE_STAGES.indexOf(status);

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Upload Manuscript</h1>
        <p className="page-description">Drop a book manuscript to generate multi-platform marketing content</p>
      </div>

      {/* Upload Form */}
      <div className="glass-card p-6 mb-6">
        {/* Book Title */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Book Title</label>
          <input
            type="text"
            value={bookTitle}
            onChange={handleTitleChange}
            placeholder="Things I Want to Say at Work But Can't"
            className="input-field"
            disabled={status !== 'idle'}
          />
          {bookSlug && (
            <p className="text-xs text-white/30 mt-1.5 font-mono">slug: {bookSlug}</p>
          )}
        </div>

        {/* Drop Zone */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-white/50 mb-2 uppercase tracking-wider">Manuscript File</label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer
              ${dragOver ? 'border-brand-500 bg-brand-500/5' : 'border-dark-4 hover:border-dark-5 hover:bg-dark-3/30'}
              ${file ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <input
              id="file-input"
              type="file"
              accept=".txt,.md,.text"
              onChange={handleFileInput}
              className="hidden"
              disabled={status !== 'idle'}
            />
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-emerald-400">{file.name}</p>
                  <p className="text-xs text-white/40 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-dark-4 flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white/40" />
                </div>
                <div>
                  <p className="text-white/60 font-medium">Drop your manuscript here</p>
                  <p className="text-xs text-white/30 mt-1">.txt, .md, or .text files</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={runPipeline}
          disabled={!file || !bookSlug || (status !== 'idle' && status !== 'error' && status !== 'complete')}
          className="btn-primary w-full justify-center disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <BookOpen className="w-4 h-4" />
          Run Content Pipeline
        </button>
      </div>

      {/* Progress */}
      {status !== 'idle' && (
        <div className="glass-card p-6 animate-slide-up">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4">Pipeline Progress</h2>

          <div className="space-y-3">
            {PIPELINE_STAGES.slice(0, -1).map((stage, i) => {
              const isActive = status === stage;
              const isDone = currentStageIndex > i;
              const isError = status === 'error' && currentStageIndex === i;

              return (
                <div key={stage} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all
                    ${isActive ? 'bg-brand-500 shadow-lg shadow-brand-500/30' : ''}
                    ${isDone ? 'bg-emerald-500' : ''}
                    ${isError ? 'bg-red-500' : ''}
                    ${!isActive && !isDone && !isError ? 'bg-dark-4' : ''}`}>
                    {isActive && <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />}
                    {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    {isError && <AlertCircle className="w-3.5 h-3.5 text-white" />}
                    {!isActive && !isDone && !isError && (
                      <span className="text-xs text-white/40 font-bold">{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm ${isActive ? 'text-white font-medium' : isDone ? 'text-emerald-400' : 'text-white/30'}`}>
                    {STAGE_LABELS[stage]}
                  </span>
                </div>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {status === 'complete' && results && (
            <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <p className="text-sm text-emerald-400 font-medium mb-2">✅ Pipeline complete!</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                <div>Calendar entries: <span className="text-white font-medium">{results.stats?.total_entries}</span></div>
                <div>Total weeks: <span className="text-white font-medium">{results.stats?.total_weeks}</span></div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
