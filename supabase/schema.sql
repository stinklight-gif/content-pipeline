-- Content Pipeline — Supabase Schema
-- Run this in your Supabase SQL editor to set up the required tables.

-- 1. Manuscripts
CREATE TABLE IF NOT EXISTS manuscripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_slug text UNIQUE NOT NULL,
  book_title text NOT NULL,
  file_path text NOT NULL,
  word_count integer DEFAULT 0,
  status text DEFAULT 'uploaded'
    CHECK (status IN ('uploaded', 'extracting', 'extracted', 'formatting', 'formatted', 'generating', 'complete', 'error')),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Content Atoms
CREATE TABLE IF NOT EXISTS content_atoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id uuid REFERENCES manuscripts(id) ON DELETE CASCADE,
  book_slug text NOT NULL,
  book_title text NOT NULL,
  content_type text NOT NULL,
  text text NOT NULL,
  tags text[] DEFAULT '{}',
  tone text,
  viral_potential integer DEFAULT 0,
  platforms text[] DEFAULT '{}',
  hook_angle text,
  used_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- 3. Formatted Content
CREATE TABLE IF NOT EXISTS formatted_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id uuid REFERENCES manuscripts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  format text NOT NULL,
  content jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 4. Content Calendar
CREATE TABLE IF NOT EXISTS content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id uuid REFERENCES manuscripts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  format text NOT NULL,
  scheduled_date date,
  week_number integer,
  content jsonb DEFAULT '{}',
  atom_index integer DEFAULT 0,
  status text DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'posted', 'skipped')),
  created_at timestamptz DEFAULT now()
);

-- 5. Generated Assets
CREATE TABLE IF NOT EXISTS generated_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manuscript_id uuid REFERENCES manuscripts(id) ON DELETE CASCADE,
  platform text NOT NULL,
  asset_type text NOT NULL,
  storage_path text NOT NULL,
  public_url text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_atoms_manuscript ON content_atoms(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_atoms_platform ON content_atoms USING gin(platforms);
CREATE INDEX IF NOT EXISTS idx_atoms_viral ON content_atoms(viral_potential DESC);
CREATE INDEX IF NOT EXISTS idx_atoms_tags ON content_atoms USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_calendar_date ON content_calendar(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_calendar_platform ON content_calendar(platform);
CREATE INDEX IF NOT EXISTS idx_calendar_manuscript ON content_calendar(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_formatted_manuscript ON formatted_content(manuscript_id);
CREATE INDEX IF NOT EXISTS idx_assets_manuscript ON generated_assets(manuscript_id);

-- Storage bucket (run separately or create via Supabase dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('manuscripts', 'manuscripts', true);
