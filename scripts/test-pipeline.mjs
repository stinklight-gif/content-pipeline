/**
 * Test script — validates Milestones 3 & 4 (image gen + calendar)
 * with mock content atoms and formatted data.
 * No LLM API key needed.
 */

import { generateQuoteCard } from '../src/generate/quote-card.mjs';
import { generatePinImage } from '../src/generate/pin-image.mjs';
import { generateCalendar } from '../src/calendar/scheduler.mjs';
import { writeOutput } from '../src/output/writer.mjs';
import fs from 'fs/promises';
import path from 'path';

const MOCK_EXTRACTION = {
  book_title: "Things I Want to Say at Work But Can't",
  book_type: "humor",
  target_audience: "Office workers, corporate employees, anyone surviving cubicle life",
  content_atoms: [
    {
      type: "quote",
      text: "I'm not arguing, I'm just explaining why I'm right.",
      tags: ["office humor", "meetings", "passive aggressive"],
      tone: "sarcastic",
      platforms: ["tiktok", "instagram", "facebook", "pinterest"],
      viral_potential: 8,
      hook_angle: "relatable office moment"
    },
    {
      type: "quote",
      text: "Per my last email means I already told you this and I'm annoyed.",
      tags: ["email humor", "passive aggressive", "corporate"],
      tone: "sarcastic",
      platforms: ["tiktok", "instagram", "facebook"],
      viral_potential: 9,
      hook_angle: "corporate translation"
    },
    {
      type: "quote",
      text: "I survived another meeting that should have been an email.",
      tags: ["meetings", "office life", "productivity"],
      tone: "dry humor",
      platforms: ["tiktok", "instagram", "pinterest", "facebook"],
      viral_potential: 9,
      hook_angle: "universal office experience"
    },
  ]
};

const MOCK_FORMATTED = {
  tiktok: [
    {
      atom_index: 0,
      platform: "tiktok",
      format: "video_script",
      hook: "Things I actually say in meetings 🤫",
      body: "Show book, read 3 quotes with deadpan reactions",
      close: "Link in bio. Your coworkers need this.",
      text_overlays: ["POV: You're in your 5th meeting today", "\"I'm not arguing...\""],
      audio_note: "Use trending corporate humor sound",
      hashtags: ["#officetok", "#workmemes", "#corporatehumor", "#booktok"],
      caption: "Tag your coworker who says this in every meeting 😤",
      estimated_duration_seconds: 15
    },
    {
      atom_index: 1,
      platform: "tiktok",
      format: "video_script",
      hook: "Corporate email translator 📧",
      body: "Show common email phrases with real translations",
      close: "This book says what we're all thinking. Link in bio.",
      text_overlays: ["What they write vs what they mean", "Per my last email = I already told you"],
      audio_note: "Text-to-speech or voiceover",
      hashtags: ["#corporatelife", "#emailhumor", "#officetok", "#booktok"],
      caption: "Per my last email... 😤 We all know what it really means",
      estimated_duration_seconds: 20
    }
  ],
  instagram: [
    {
      atom_index: 0,
      platform: "instagram",
      format: "quote_card",
      quote_text: "I'm not arguing, I'm just explaining why I'm right.",
      attribution: "— Things I Want to Say at Work But Can't",
      caption: "Tag your coworker who says this in every meeting 😤\n.\n.\n.\n📚 Link in bio",
      hashtags: ["officehumor", "worklife", "coworkermemes", "funnygifts", "gaggift", "officegifts", "booktok"],
      color_scheme: "dark",
      engagement_cta: "Tag someone who needs this book"
    },
    {
      atom_index: 1,
      platform: "instagram",
      format: "quote_card",
      quote_text: "Per my last email means I already told you this and I'm annoyed.",
      attribution: "— Things I Want to Say at Work But Can't",
      caption: "We've all sent this email. You know the one. 📧\n.\n.\n.\n📚 Link in bio",
      hashtags: ["emailhumor", "corporatelife", "officehumor", "workmemes"],
      color_scheme: "cool",
      engagement_cta: "Double tap if you've sent this email"
    },
    {
      atom_index: 2,
      platform: "instagram",
      format: "quote_card",
      quote_text: "I survived another meeting that should have been an email.",
      attribution: "— Things I Want to Say at Work But Can't",
      caption: "Every. Single. Day. 😩\n.\n.\n.\n📚 This book is a whole mood. Link in bio.",
      hashtags: ["meetings", "officelife", "workhumor", "corporateamerica"],
      color_scheme: "warm",
      engagement_cta: "How many unnecessary meetings did you survive this week?"
    }
  ],
  pinterest: [
    {
      atom_index: 0,
      platform: "pinterest",
      format: "pin",
      title: "Funny Office Gift Under $15 — Things I Want to Say at Work",
      description: "The perfect coworker gift, white elephant gift, or just-because gift for anyone surviving corporate life. Funny quotes about meetings, emails, and that one coworker we all have.",
      text_overlay: "Things I Want to Say at Work But Can't",
      subtitle: "The #1 Office Humor Gift on Amazon",
      board_suggestions: ["Office Gift Ideas", "Funny Books", "White Elephant Gifts"],
      color_scheme: "dark",
      keywords: ["funny office gift", "coworker gift", "white elephant gift", "office humor book"],
      cta_text: "Shop on Amazon →"
    },
    {
      atom_index: 2,
      platform: "pinterest",
      format: "pin",
      title: "Best Gag Gift for Your Office Bestie — Meeting Humor Book",
      description: "Because every office needs a little humor. This book says all the things you wish you could say in meetings, emails, and to that one coworker.",
      text_overlay: "I survived another meeting that should have been an email.",
      subtitle: "— Things I Want to Say at Work But Can't",
      board_suggestions: ["Gift Ideas for Coworkers", "Funny Books to Read"],
      color_scheme: "warm",
      keywords: ["meeting humor", "office gift", "funny book", "coworker birthday gift"],
      cta_text: "Get Your Copy →"
    }
  ],
  facebook: [
    {
      atom_index: 0,
      platform: "facebook",
      format: "organic_post",
      primary_text: "Finally, a book that says what we're all thinking at work. 😤",
      image_text: "I'm not arguing, I'm just explaining why I'm right.",
      cta: "Tag your favorite coworker 👇",
      engagement_hook: "What's YOUR most-used phrase from this list?",
      hashtags: ["#offichumor", "#worklife", "#gaggift"]
    }
  ],
  blog: [
    {
      atom_indices: [0, 1, 2],
      platform: "blog",
      format: "blog_post",
      title: "25 Things Everyone Wants to Say at Work (But Can't)",
      meta_description: "Funny office quotes from the bestselling Amazon humor book. Perfect for anyone surviving corporate life.",
      target_keywords: ["funny office quotes", "things to say at work", "office humor"],
      intro: "We've all been there. Sitting in a meeting that should have been an email, reading a passive-aggressive reply-all, or watching someone microwave fish in the office kitchen. This book captures every thought you've ever had at work but couldn't say out loud.",
      body_sections: [
        { heading: "Meeting Madness", content: "\"I survived another meeting that could have been an email.\" If this doesn't resonate with you, you might be the one scheduling those meetings." },
        { heading: "Email Warfare", content: "\"Per my last email\" — the four words that strike fear into every inbox. We all know what it really means." },
      ],
      conclusion: "If any of these quotes made you laugh (or cry), this book is for you — or for that coworker who definitely needs it.",
      cta: "Buy on Amazon →",
      estimated_word_count: 1200
    }
  ],
  email: {
    sequence_name: "Welcome sequence for Things I Want to Say at Work",
    emails: [
      {
        email_number: 1,
        send_day: 0,
        subject_line: "You're going to want to read this at work",
        preview_text: "5 quotes that will make your Monday bearable",
        purpose: "welcome",
        body_sections: [
          { type: "text", content: "Welcome! Here's a sneak peek at the book that's making offices everywhere slightly more bearable." },
          { type: "quote_highlight", content: "I'm not arguing, I'm just explaining why I'm right." },
          { type: "quote_highlight", content: "Per my last email means I already told you this and I'm annoyed." },
          { type: "cta", text: "Get Your Copy", url_placeholder: "{{amazon_link}}" }
        ],
        atom_indices: [0, 1]
      }
    ]
  }
};

async function test() {
  console.log('🧪 Testing Milestones 3 & 4 with mock data\n');

  const outputDir = path.resolve('output', '__test__');

  // ─── Test quote card generation ────────────────
  console.log('── Test: Quote Card Generation ──');
  try {
    const imgPath = path.join(outputDir, 'instagram', 'test-quote-card.png');
    await generateQuoteCard(MOCK_FORMATTED.instagram[0], imgPath);
    const stats = await fs.stat(imgPath);
    console.log(`   ✅ Quote card generated: ${imgPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`   ❌ Quote card failed:`, err.message);
  }

  // ─── Test pin image generation ─────────────────
  console.log('\n── Test: Pin Image Generation ──');
  try {
    const imgPath = path.join(outputDir, 'pinterest', 'test-pin.png');
    await generatePinImage(MOCK_FORMATTED.pinterest[0], imgPath);
    const stats = await fs.stat(imgPath);
    console.log(`   ✅ Pin image generated: ${imgPath} (${(stats.size / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`   ❌ Pin image failed:`, err.message);
  }

  // ─── Test calendar generation ──────────────────
  console.log('\n── Test: Calendar Generation ──');
  try {
    const calendar = generateCalendar(MOCK_FORMATTED, {
      bookTitle: MOCK_EXTRACTION.book_title,
    });
    console.log(`   ✅ Calendar generated: ${calendar.stats.total_entries} entries`);
    console.log(`      Date range: ${calendar.stats.date_range.start} → ${calendar.stats.date_range.end}`);
    console.log(`      Platforms:`, calendar.stats.platforms);
  } catch (err) {
    console.error(`   ❌ Calendar failed:`, err.message);
  }

  // ─── Test full output writer ───────────────────
  console.log('\n── Test: Output Writer ──');
  try {
    await writeOutput({
      bookSlug: '__test__',
      extraction: MOCK_EXTRACTION,
      formatted: MOCK_FORMATTED,
      calendar: generateCalendar(MOCK_FORMATTED, { bookTitle: MOCK_EXTRACTION.book_title }),
      baseDir: 'output',
    });
    console.log('   ✅ Output writer completed');
  } catch (err) {
    console.error(`   ❌ Output writer failed:`, err.message);
  }

  // ─── List generated files ─────────────────────
  console.log('\n── Generated Files ──');
  await listDir(outputDir, '');

  // Cleanup
  console.log('\n🧪 Tests complete! Cleaning up test output...');
  await fs.rm(outputDir, { recursive: true, force: true });
  console.log('   ✅ Test output cleaned up\n');
}

async function listDir(dir, indent) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      console.log(`   ${indent}📁 ${entry.name}/`);
      await listDir(fullPath, indent + '  ');
    } else {
      const stats = await fs.stat(fullPath);
      console.log(`   ${indent}📄 ${entry.name} (${(stats.size / 1024).toFixed(1)} KB)`);
    }
  }
}

test().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
