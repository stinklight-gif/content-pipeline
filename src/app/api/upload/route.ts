import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bookSlug = formData.get('bookSlug') as string;
    const bookTitle = formData.get('bookTitle') as string;

    if (!file || !bookSlug || !bookTitle) {
      return NextResponse.json({ error: 'Missing file, bookSlug, or bookTitle' }, { status: 400 });
    }

    const sb = createServerClient();
    const content = await file.text();
    const wordCount = content.split(/\s+/).length;

    // Upload to Supabase Storage
    const storagePath = `manuscripts/${bookSlug}.txt`;
    const { error: uploadError } = await sb.storage
      .from('manuscripts')
      .upload(storagePath, content, {
        contentType: 'text/plain',
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Create manuscript record
    const { data: manuscript, error: dbError } = await sb
      .from('manuscripts')
      .upsert({
        book_slug: bookSlug,
        book_title: bookTitle,
        file_path: storagePath,
        word_count: wordCount,
        status: 'uploaded',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'book_slug' })
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: `DB error: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ manuscriptId: manuscript.id, wordCount });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
