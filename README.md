# 📚 Content Pipeline

> **One book → 50-100+ pieces of marketing content.** Turn your entire book catalog into a compounding organic discovery engine across every major platform.

A system that takes any book manuscript and automatically generates a full content calendar with ready-to-post assets across TikTok, Instagram, Pinterest, Facebook, blog, and email. 60 titles become 3,000–6,000 pieces of marketing content — posted over months or years.

---

## 🧩 How It Works

```
Manuscript (Word/Text/PDF)
        │
        ▼
┌─────────────────────────┐
│  Stage 1: Extraction    │  LLM reads the book → extracts quotes,
│  (Content Atoms)        │  scenes, sample pages, facts
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Stage 2: Formatting    │  Each atom → platform-specific formats
│  (Per-Platform)         │  (video scripts, quote cards, pins, ads)
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Stage 3: Asset Gen     │  HTML templates + Puppeteer screenshots
│  (Images, Scripts)      │  for quote cards, pins, mockups
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Stage 4: Calendar      │  Distributes content across platforms
│  (Posting Schedule)     │  following cadence rules
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│  Stage 5: Output        │  Structured folders + Supabase sync
│  (Files + Dashboard)    │  for Mission Control dashboard
└─────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** (or npm/yarn)
- API key for an LLM provider (Kimi K2.5 recommended for 262K context)
- *(Optional)* Supabase project for dashboard storage

### Installation

```bash
git clone https://github.com/your-org/content-pipeline.git
cd content-pipeline
pnpm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# LLM Provider
LLM_API_KEY=your-api-key
LLM_MODEL=kimi-k2.5          # Or any OpenAI-compatible model
LLM_BASE_URL=https://api.moonshot.cn/v1

# Supabase (optional — for dashboard sync)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Usage

```bash
# 1. Place your manuscript in the input folder
cp manuscript.txt input/things-i-want-to-say-at-work.txt

# 2. Run the pipeline
node scripts/generate-content.mjs --book things-i-want-to-say-at-work

# 3. Review the output
ls output/things-i-want-to-say-at-work/
```

---

## 📂 Project Structure

```
content-pipeline/
├── input/                          # Drop manuscripts here
│   └── {book-slug}.txt
├── scripts/
│   ├── generate-content.mjs        # Main pipeline entry point
│   └── test-pipeline.mjs           # Test image gen + calendar (no API key needed)
├── src/
│   ├── extract/                     # Stage 1 — Content atom extraction
│   │   └── extractor.mjs
│   ├── format/                      # Stage 2 — Platform-specific formatters
│   │   ├── tiktok.mjs
│   │   ├── instagram.mjs
│   │   ├── pinterest.mjs
│   │   ├── facebook.mjs
│   │   ├── blog.mjs
│   │   └── email.mjs
│   ├── generate/                    # Stage 3 — Asset generation
│   │   ├── quote-card.mjs
│   │   ├── pin-image.mjs
│   │   └── book-mockup.mjs
│   ├── calendar/                    # Stage 4 — Calendar scheduling
│   │   └── scheduler.mjs
│   └── output/                      # Stage 5 — File output + Supabase sync
│       ├── writer.mjs
│       └── supabase.mjs
├── templates/                       # HTML templates for image generation
│   ├── quote-card.html
│   └── pinterest-pin.html
├── output/                          # Generated content (git-ignored)
│   └── {book-slug}/
│       ├── content-atoms.json
│       ├── calendar.json
│       ├── tiktok/
│       ├── instagram/
│       ├── pinterest/
│       ├── facebook/
│       ├── blog/
│       └── email/
├── .env                             # API keys (git-ignored)
├── .gitignore
├── package.json
└── README.md
```

---

## 📋 Pipeline Stages in Detail

### Stage 1: Content Extraction

The LLM reads the full manuscript and extracts every reusable **content atom** — the smallest unit of standalone content.

| Book Type | Atom Examples | Typical Count |
|-----------|---------------|---------------|
| Humor / Gift books | Quotes, one-liners, observations | 50–100 |
| Children's books | Funny scenes, character moments | 30–60 |
| Activity books | Sample puzzles, page descriptions | 20–40 |

Each atom is tagged with metadata:

```json
{
  "type": "quote",
  "text": "I'm not arguing, I'm just explaining why I'm right.",
  "tags": ["office humor", "meetings", "passive aggressive"],
  "tone": "sarcastic",
  "platforms": ["tiktok", "instagram", "facebook", "pinterest"],
  "viral_potential": 8
}
```

### Stage 2: Platform Formatting

Each content atom is transformed into ready-to-use formats for each platform:

| Platform | Format | Output |
|----------|--------|--------|
| **TikTok** / Reels / Shorts | Vertical video script | Hook → body → CTA with timing + audio notes |
| **Instagram** | Quote card + carousel | Image files + caption + hashtags |
| **Pinterest** | Vertical pin | 1000×1500 image + SEO title/description + board |
| **Facebook** | Organic post + ad creative | Image + copy + targeting notes |
| **Blog** | SEO listicle | ~1,200 word post, keyword-optimized |
| **Email** | Welcome sequence | 3-email drip campaign per book |

### Stage 3: Asset Generation

- **Quote cards** — @vercel/og (Satori) → PNG (Instagram/Facebook)
- **Pinterest pins** — @vercel/og (Satori) → vertical PNG
- **Book mockups** — 3D cover on lifestyle backgrounds
- **Video scripts** — Plain text, ready for Creatomate / CapCut / Remotion
- **Copy** — Captions, hashtags, descriptions formatted per platform limits

### Stage 4: Content Calendar

Content is distributed across platforms following these cadence rules:

| Platform | Frequency | Days |
|----------|-----------|------|
| TikTok | 1/day | Daily |
| Instagram | 4/week | Mon, Wed, Fri, Sun |
| Pinterest | 3/week | Tue, Thu, Sat |
| Facebook | 2/week | Wed, Sat |
| Blog | 1/week | — |

> **Rule:** The same content atom is never posted on two platforms on the same day.
>
> **Result:** One book generates **3–4 months** of content at this cadence.

### Stage 5: Output

All content is saved to structured local folders and optionally synced to Supabase for the Mission Control dashboard.

---

## 🗄️ Database Schema (Supabase)

```sql
CREATE TABLE content_atoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id text NOT NULL,
  book_title text NOT NULL,
  content_type text NOT NULL,        -- quote, scene, sample_page, fact
  text text NOT NULL,
  tags text[] DEFAULT '{}',
  tone text,
  viral_potential integer,           -- 1-10
  platforms text[] DEFAULT '{}',
  used_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE content_calendar (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  atom_id uuid REFERENCES content_atoms(id),
  platform text NOT NULL,            -- tiktok, instagram, pinterest, etc.
  format text NOT NULL,              -- video_script, quote_card, carousel, etc.
  scheduled_date date,
  caption text,
  hashtags text,
  asset_paths text[],
  status text DEFAULT 'draft',       -- draft, scheduled, posted, skipped
  performance jsonb,                 -- Views, likes, clicks (post-posting)
  created_at timestamptz DEFAULT now()
);
```

---

## 💰 Cost Estimate

| Resource | Per Book | All 60 Books |
|----------|----------|--------------|
| LLM — extraction | ~$0.50 | ~$30 |
| LLM — formatting | ~$1.00 | ~$60 |
| Image gen (Puppeteer) | Free | Free |
| **Total** | **~$1.50** | **~$90** |

---

## 📊 Expected Output

| Metric | Per Book | 60 Books |
|--------|----------|----------|
| Content atoms | 50–100 | 3,000–6,000 |
| TikTok scripts | 30–50 | 1,800–3,000 |
| Instagram posts | 20–30 | 1,200–1,800 |
| Pinterest pins | 15–25 | 900–1,500 |
| Facebook posts | 10–15 | 600–900 |
| Blog posts | 4–8 | 240–480 |
| Email sequences | 1 (3 emails) | 60 (180 emails) |
| **Calendar duration** | **3–4 months** | **Years** |

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Content extraction | Kimi K2.5 (262K context window) |
| Image generation | @vercel/og (Satori) + sharp |
| Video scripts | LLM text output |
| Calendar logic | Node.js |
| Storage | Supabase + local filesystem |
| Dashboard | Mission Control `/content` page |

---

## 🏗️ Build Roadmap

| # | Milestone | Description |
|---|-----------|-------------|
| 1 | Content extraction | Script to read manuscripts and output `content-atoms.json` |
| 2 | Platform formatters | Transform atoms into per-platform formats |
| 3 | Quote card generator | @vercel/og (Satori) for Instagram/Pinterest images |
| 4 | Calendar generator | Distribute content across platforms and dates |
| 5 | Supabase sync | Store atoms + calendar in database |
| 6 | Mission Control page | Browse calendar, view assets, mark as posted |
| 7 | End-to-end test | Full pipeline on *"Things I Want to Say at Work"* |
| 8 | Batch run | Process remaining 59 titles |

---

## 🔮 Future Enhancements

- **Auto-posting** — Buffer / Later API integration for scheduled publishing
- **Performance tracking** — Pull engagement metrics back from platforms
- **A/B testing** — Generate 2 versions of each post, measure performance
- **Trending audio** — Suggest trending TikTok sounds matching content tone
- **Seasonal calendar** — Auto-ramp for Q4 gifting, Mother's Day, Father's Day
- **Video generation** — Creatomate API for fully automated video creation
- **Ada integration** — Ad pattern library informs hooks and format priorities

---

## 📄 License

Private / Internal Use Only.
