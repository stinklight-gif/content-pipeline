'use client';

import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalIcon } from 'lucide-react';

interface CalendarEntry {
  id: string;
  platform: string;
  format: string;
  scheduled_date: string;
  week_number: number;
  content: any;
  status: string;
}

const PLATFORM_CONFIG: Record<string, { color: string; bg: string; border: string }> = {
  tiktok: { color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
  instagram: { color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  pinterest: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  facebook: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  blog: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  email: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function CalendarPage() {
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));

  useEffect(() => {
    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    try {
      const res = await fetch('/api/calendar');
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        // Jump to the first week that has entries
        if (data.entries?.length > 0) {
          const firstDate = new Date(data.entries[0].scheduled_date + 'T00:00:00');
          setWeekStart(getWeekStart(firstDate));
        }
      }
    } catch (err) {
      console.error('Error fetching calendar:', err);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = useMemo(() => {
    return DAYS.map((label, i) => ({
      label,
      date: addDays(weekStart, i),
      dateStr: formatDate(addDays(weekStart, i)),
    }));
  }, [weekStart]);

  const weekEntries = useMemo(() => {
    const startStr = formatDate(weekStart);
    const endStr = formatDate(addDays(weekStart, 6));
    return entries.filter(e => e.scheduled_date >= startStr && e.scheduled_date <= endStr);
  }, [entries, weekStart]);

  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));
  const today = () => setWeekStart(getWeekStart(new Date()));

  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${addDays(weekStart, 6).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  return (
    <div className="max-w-7xl mx-auto animate-fade-in">
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="page-title">Content Calendar</h1>
          <p className="page-description">{entries.length} scheduled posts across all platforms</p>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="glass-card p-4 mb-6 flex items-center justify-between">
        <button onClick={prevWeek} className="btn-ghost p-2">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <CalIcon className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-sm">{weekLabel}</span>
          <button onClick={today} className="text-xs text-brand-400 hover:text-brand-300 transition-colors">Today</button>
        </div>
        <button onClick={nextWeek} className="btn-ghost p-2">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        /* Weekly Grid */
        <div className="grid grid-cols-7 gap-3">
          {weekDays.map(({ label, date, dateStr }) => {
            const dayEntries = weekEntries.filter(e => e.scheduled_date === dateStr);
            const isToday = dateStr === formatDate(new Date());

            return (
              <div key={dateStr} className="min-h-[300px]">
                {/* Day header */}
                <div className={`text-center mb-2 pb-2 border-b ${isToday ? 'border-brand-500/30' : 'border-dark-4'}`}>
                  <p className={`text-xs font-medium ${isToday ? 'text-brand-400' : 'text-white/40'}`}>{label}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-brand-400' : 'text-white/70'}`}>{date.getDate()}</p>
                </div>

                {/* Entries */}
                <div className="space-y-2">
                  {dayEntries.map(entry => {
                    const cfg = PLATFORM_CONFIG[entry.platform] || { color: 'text-white/50', bg: 'bg-dark-4', border: 'border-dark-5' };
                    return (
                      <div
                        key={entry.id}
                        className={`${cfg.bg} ${cfg.border} border rounded-xl p-2.5 cursor-pointer 
                          hover:scale-[1.02] transition-transform duration-200`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>
                            {entry.platform}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            entry.status === 'posted' ? 'bg-emerald-400' :
                            entry.status === 'scheduled' ? 'bg-yellow-400' :
                            'bg-white/20'
                          }`} />
                        </div>
                        <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                          {entry.content?.hook || entry.content?.quote_text || entry.content?.title || entry.format}
                        </p>
                      </div>
                    );
                  })}

                  {dayEntries.length === 0 && (
                    <div className="h-16 border border-dashed border-dark-4 rounded-xl flex items-center justify-center">
                      <span className="text-[10px] text-white/10">No posts</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
