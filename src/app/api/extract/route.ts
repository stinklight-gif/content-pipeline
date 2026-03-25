import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
// @ts-ignore — pipeline code is .mjs
import { extractContentAtoms } from '../../../../lib/pipeline/extract/extractor.mjs';
import { writeFile, mkdtemp } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export const maxDuration = 120; // 2 min for LLM extraction

export async function POST(request: NextRequest) {
  try {
    const { manuscriptId } = await request.json();
    if (!manuscriptId) {
      return NextResponse.json({ error: 'Missing manuscriptId' }, { status: 400 });
    }

    const sb = createServerClient();

    // Get manuscript record
    const { data: manuscript, error: msErr } = await sb
      .from('manuscripts')
      .select('*')
      .eq('id', manuscriptId)
      .single();

    if (msErr || !manuscript) {
      return NextResponse.json({ error: 'Manuscript not found' }, { status: 404 });
    }

    // Update status
    await sb.from('manuscripts').update({ status: 'extracting', updated_at: new Date().toISOString() }).eq('id', manuscriptId);

    // Download manuscript from storage
    const { data: fileData, error: dlErr } = await sb.storage
      .from('manuscripts')
      .download(manuscript.file_path);

    if (dlErr || !fileData) {
      return NextResponse.json({ error: 'Failed to download manuscript' }, { status: 500 });
    }

    const content = await fileData.text();

    // Write to temp file for the pipeline extractor
    const tmpDir = await mkdtemp(join(tmpdir(), 'pipeline-'));
    const tmpPath = join(tmpDir, `${manuscript.book_slug}.txt`);
    await writeFile(tmpPath, content, 'utf-8');

    // Run extraction
    const result: any = await extractContentAtoms(tmpPath, manuscript.book_slug);

    // Save atoms to DB
    const atoms = (result.content_atoms || []).map((atom: any) => ({
      manuscript_id: manuscriptId,
      book_slug: manuscript.book_slug,
      book_title: result.book_title || manuscript.book_title,
      content_type: atom.type,
      text: atom.text,
      tags: atom.tags || [],
      tone: atom.tone || '',
      viral_potential: atom.viral_potential || 0,
      platforms: atom.platforms || [],
      hook_angle: atom.hook_angle || '',
      used_count: 0,
    }));

    if (atoms.length > 0) {
      // Clear previous atoms for this manuscript
      await sb.from('content_atoms').delete().eq('manuscript_id', manuscriptId);
      const { error: insertErr } = await sb.from('content_atoms').insert(atoms);
      if (insertErr) {
        console.error('Atom insert error:', insertErr);
      }
    }

    // Store full extraction result as JSON in storage
    await sb.storage.from('manuscripts').upload(
      `extractions/${manuscript.book_slug}.json`,
      JSON.stringify(result, null, 2),
      { contentType: 'application/json', upsert: true }
    );

    await sb.from('manuscripts').update({ status: 'extracted', updated_at: new Date().toISOString() }).eq('id', manuscriptId);

    return NextResponse.json({
      atomCount: atoms.length,
      bookType: result.book_type,
      targetAudience: result.target_audience,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
