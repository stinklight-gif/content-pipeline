import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
// @ts-ignore
import { generateCalendar } from '../../../../lib/pipeline/calendar/scheduler.mjs';

export async function GET() {
  try {
    const sb = createServerClient();

    const { data, error } = await sb
      .from('content_calendar')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ entries: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { manuscriptId } = await request.json();
    if (!manuscriptId) {
      return NextResponse.json({ error: 'Missing manuscriptId' }, { status: 400 });
    }

    const sb = createServerClient();

    const { data: manuscript } = await sb
      .from('manuscripts')
      .select('*')
      .eq('id', manuscriptId)
      .single();

    if (!manuscript) {
      return NextResponse.json({ error: 'Manuscript not found' }, { status: 404 });
    }

    // Load formatted content
    const { data: formattedFile } = await sb.storage
      .from('manuscripts')
      .download(`formatted/${manuscript.book_slug}.json`);

    if (!formattedFile) {
      return NextResponse.json({ error: 'Formatted data not found. Run format first.' }, { status: 400 });
    }

    const formatted = JSON.parse(await formattedFile.text());

    // Generate calendar
    const calendar: any = generateCalendar(formatted, {
      bookTitle: manuscript.book_title,
    });

    // Save calendar entries to DB
    await sb.from('content_calendar').delete().eq('manuscript_id', manuscriptId);

    const entries = calendar.entries.map((entry: any) => ({
      manuscript_id: manuscriptId,
      platform: entry.platform,
      format: entry.format,
      scheduled_date: entry.scheduled_date,
      week_number: entry.week_number,
      content: entry.content,
      atom_index: entry.atom_index ?? 0,
      status: 'draft',
    }));

    if (entries.length > 0) {
      await sb.from('content_calendar').insert(entries);
    }

    // Save full calendar JSON to storage
    await sb.storage.from('manuscripts').upload(
      `calendars/${manuscript.book_slug}.json`,
      JSON.stringify(calendar, null, 2),
      { contentType: 'application/json', upsert: true }
    );

    await sb.from('manuscripts').update({ status: 'complete', updated_at: new Date().toISOString() }).eq('id', manuscriptId);

    return NextResponse.json({
      stats: calendar.stats,
      entryCount: entries.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
