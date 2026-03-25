import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
// @ts-ignore
import { formatAllPlatforms } from '../../../../lib/pipeline/format/index.mjs';

export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const { manuscriptId } = await request.json();
    if (!manuscriptId) {
      return NextResponse.json({ error: 'Missing manuscriptId' }, { status: 400 });
    }

    const sb = createServerClient();

    // Get manuscript
    const { data: manuscript } = await sb
      .from('manuscripts')
      .select('*')
      .eq('id', manuscriptId)
      .single();

    if (!manuscript) {
      return NextResponse.json({ error: 'Manuscript not found' }, { status: 404 });
    }

    await sb.from('manuscripts').update({ status: 'formatting', updated_at: new Date().toISOString() }).eq('id', manuscriptId);

    // Load extraction result from storage
    const { data: extractionFile } = await sb.storage
      .from('manuscripts')
      .download(`extractions/${manuscript.book_slug}.json`);

    if (!extractionFile) {
      return NextResponse.json({ error: 'Extraction data not found. Run extract first.' }, { status: 400 });
    }

    const extraction = JSON.parse(await extractionFile.text());

    // Run all platform formatters
    const formatted = await formatAllPlatforms(extraction);

    // Save formatted content to storage
    await sb.storage.from('manuscripts').upload(
      `formatted/${manuscript.book_slug}.json`,
      JSON.stringify(formatted, null, 2),
      { contentType: 'application/json', upsert: true }
    );

    // Save formatted content to DB
    await sb.from('formatted_content').delete().eq('manuscript_id', manuscriptId);

    const records: any[] = [];
    for (const [platform, items] of Object.entries(formatted)) {
      if (platform === 'email') {
        // Email is a single sequence object, not an array
        records.push({
          manuscript_id: manuscriptId,
          platform: 'email',
          format: 'welcome_sequence',
          content: items,
        });
      } else if (Array.isArray(items)) {
        for (const item of items) {
          records.push({
            manuscript_id: manuscriptId,
            platform,
            format: item.format || 'post',
            content: item,
          });
        }
      }
    }

    if (records.length > 0) {
      await sb.from('formatted_content').insert(records);
    }

    await sb.from('manuscripts').update({ status: 'formatted', updated_at: new Date().toISOString() }).eq('id', manuscriptId);

    const counts: Record<string, number> = {};
    for (const r of records) {
      counts[r.platform] = (counts[r.platform] || 0) + 1;
    }

    return NextResponse.json({ totalFormatted: records.length, platforms: counts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
