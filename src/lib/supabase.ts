import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase client (uses service role key for admin access).
 */
export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

// ─── Database Types ──────────────────────────────

export interface Manuscript {
  id: string;
  book_slug: string;
  book_title: string;
  file_path: string;
  word_count: number;
  status: 'uploaded' | 'extracting' | 'extracted' | 'formatting' | 'formatted' | 'generating' | 'complete' | 'error';
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ContentAtom {
  id: string;
  manuscript_id: string;
  book_slug: string;
  book_title: string;
  content_type: string;
  text: string;
  tags: string[];
  tone: string;
  viral_potential: number;
  platforms: string[];
  hook_angle: string;
  used_count: number;
  created_at: string;
}

export interface FormattedContent {
  id: string;
  atom_id: string;
  manuscript_id: string;
  platform: string;
  format: string;
  content: Record<string, any>;
  created_at: string;
}

export interface CalendarEntry {
  id: string;
  manuscript_id: string;
  platform: string;
  format: string;
  scheduled_date: string;
  week_number: number;
  content: Record<string, any>;
  atom_index: number;
  status: 'draft' | 'scheduled' | 'posted' | 'skipped';
  created_at: string;
}

export interface GeneratedAsset {
  id: string;
  manuscript_id: string;
  platform: string;
  asset_type: string;
  storage_path: string;
  public_url: string;
  metadata: Record<string, any>;
  created_at: string;
}
