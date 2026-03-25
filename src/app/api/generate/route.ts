import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
// @ts-ignore
import { generateQuoteCard } from '../../../../lib/pipeline/generate/quote-card.mjs';
// @ts-ignore
import { generatePinImage } from '../../../../lib/pipeline/generate/pin-image.mjs';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

export const maxDuration = 60;

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

    await sb.from('manuscripts').update({ status: 'generating', updated_at: new Date().toISOString() }).eq('id', manuscriptId);

    // Load formatted content
    const { data: formattedFile } = await sb.storage
      .from('manuscripts')
      .download(`formatted/${manuscript.book_slug}.json`);

    if (!formattedFile) {
      return NextResponse.json({ error: 'Formatted data not found. Run format first.' }, { status: 400 });
    }

    const formatted = JSON.parse(await formattedFile.text());
    const tmpDir = await mkdtemp(join(tmpdir(), 'assets-'));

    // Clear previous assets
    await sb.from('generated_assets').delete().eq('manuscript_id', manuscriptId);

    const assetRecords: any[] = [];

    // Generate quote cards for Instagram
    const quoteCards = (formatted.instagram || []).filter(
      (p: any) => p.format === 'quote_card' && p.quote_text
    );

    for (let i = 0; i < quoteCards.length; i++) {
      const post = quoteCards[i];
      const filename = `quote-card-${String(i + 1).padStart(2, '0')}.png`;
      const localPath = join(tmpDir, filename);

      await generateQuoteCard(post, localPath);

      const fileBuffer = await readFile(localPath);
      const storagePath = `assets/${manuscript.book_slug}/instagram/${filename}`;

      await sb.storage.from('manuscripts').upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

      const { data: urlData } = sb.storage.from('manuscripts').getPublicUrl(storagePath);

      assetRecords.push({
        manuscript_id: manuscriptId,
        platform: 'instagram',
        asset_type: 'quote_card',
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        metadata: { quote_text: post.quote_text, color_scheme: post.color_scheme },
      });
    }

    // Generate pin images for Pinterest
    const pins = formatted.pinterest || [];
    for (let i = 0; i < pins.length; i++) {
      const pin = pins[i];
      const filename = `pin-${String(i + 1).padStart(2, '0')}.png`;
      const localPath = join(tmpDir, filename);

      await generatePinImage(pin, localPath);

      const fileBuffer = await readFile(localPath);
      const storagePath = `assets/${manuscript.book_slug}/pinterest/${filename}`;

      await sb.storage.from('manuscripts').upload(storagePath, fileBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

      const { data: urlData } = sb.storage.from('manuscripts').getPublicUrl(storagePath);

      assetRecords.push({
        manuscript_id: manuscriptId,
        platform: 'pinterest',
        asset_type: 'pin_image',
        storage_path: storagePath,
        public_url: urlData.publicUrl,
        metadata: { title: pin.title, color_scheme: pin.color_scheme },
      });
    }

    // Insert asset records
    if (assetRecords.length > 0) {
      await sb.from('generated_assets').insert(assetRecords);
    }

    // Cleanup temp dir
    await rm(tmpDir, { recursive: true, force: true });

    return NextResponse.json({
      totalAssets: assetRecords.length,
      quoteCards: quoteCards.length,
      pinImages: pins.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
