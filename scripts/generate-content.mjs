#!/usr/bin/env node

/**
 * Content Pipeline — Main Entry Point
 *
 * Usage:
 *   node scripts/generate-content.mjs --book <book-slug>
 *   node scripts/generate-content.mjs --book <book-slug> --stage extract
 *   node scripts/generate-content.mjs --book <book-slug> --stage format
 *   node scripts/generate-content.mjs --book <book-slug> --stage images
 *   node scripts/generate-content.mjs --book <book-slug> --stage calendar
 */

import { program } from 'commander';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { extractContentAtoms } from '../src/extract/extractor.mjs';
import { formatAllPlatforms } from '../src/format/index.mjs';
import { generateAllAssets } from '../src/generate/index.mjs';
import { generateCalendar } from '../src/calendar/scheduler.mjs';
import { writeOutput } from '../src/output/writer.mjs';

dotenv.config();

program
  .name('generate-content')
  .description('Generate multi-platform marketing content from a book manuscript')
  .requiredOption('--book <slug>', 'Book slug (matches filename in input/ folder)')
  .option('--stage <stage>', 'Run only a specific stage: extract, format, images, calendar', '')
  .option('--input-dir <dir>', 'Input directory containing manuscripts', 'input')
  .option('--output-dir <dir>', 'Output directory for generated content', 'output')
  .parse();

const opts = program.opts();
const bookSlug = opts.book;
const stage = opts.stage;
const inputDir = path.resolve(opts.inputDir);
const outputDir = path.resolve(opts.outputDir);
const bookOutputDir = path.join(outputDir, bookSlug);

async function findManuscript() {
  const extensions = ['.txt', '.md', '.text'];
  for (const ext of extensions) {
    const filepath = path.join(inputDir, `${bookSlug}${ext}`);
    try {
      await fs.access(filepath);
      return filepath;
    } catch { /* not found */ }
  }
  throw new Error(
    `Manuscript not found. Expected one of:\n` +
    extensions.map(ext => `  ${path.join(inputDir, `${bookSlug}${ext}`)}`).join('\n')
  );
}

async function loadPreviousStage(filename) {
  const filepath = path.join(bookOutputDir, filename);
  try {
    const data = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(data);
  } catch {
    throw new Error(
      `Required data from previous stage not found: ${filepath}\n` +
      `Run the full pipeline or the previous stage first.`
    );
  }
}

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║         📚 Content Repurposing Pipeline         ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   Book:   ${bookSlug}`);
  console.log(`   Stage:  ${stage || 'all'}`);
  console.log(`   Output: ${bookOutputDir}`);
  console.log('');

  // Validate API key
  if (!process.env.LLM_API_KEY) {
    console.error('❌ LLM_API_KEY not set in environment or .env file');
    process.exit(1);
  }

  let extraction;
  let formatted;
  let assets;
  let calendar;

  // ─── Stage 1: Extract ──────────────────────────────────
  if (!stage || stage === 'extract') {
    const manuscriptPath = await findManuscript();

    console.log('📖 Stage 1: Content Extraction');
    console.log('─'.repeat(40));

    extraction = await extractContentAtoms(manuscriptPath, bookSlug);

    // Save intermediate result
    await fs.mkdir(bookOutputDir, { recursive: true });
    await fs.writeFile(
      path.join(bookOutputDir, 'content-atoms.json'),
      JSON.stringify(extraction, null, 2)
    );

    if (stage === 'extract') {
      console.log('\n✅ Extraction complete. Run with --stage format to continue.');
      return;
    }
  }

  // ─── Stage 2: Format ──────────────────────────────────
  if (!stage || stage === 'format') {
    if (!extraction) {
      extraction = await loadPreviousStage('content-atoms.json');
      console.log(`📦 Loaded ${extraction.content_atoms.length} content atoms from previous extraction`);
    }

    formatted = await formatAllPlatforms(extraction);

    // Save intermediate result
    await fs.mkdir(bookOutputDir, { recursive: true });
    await fs.writeFile(
      path.join(bookOutputDir, 'formatted.json'),
      JSON.stringify(formatted, null, 2)
    );

    if (stage === 'format') {
      console.log('\n✅ Formatting complete. Run with --stage images to continue.');
      return;
    }
  }

  // ─── Stage 3: Generate Images ──────────────────────────
  if (!stage || stage === 'images') {
    if (!formatted) {
      formatted = await loadPreviousStage('formatted.json');
      console.log('📦 Loaded formatted content from previous stage');
    }

    assets = await generateAllAssets(formatted, bookOutputDir);

    if (stage === 'images') {
      console.log('\n✅ Image generation complete. Run with --stage calendar to continue.');
      return;
    }
  }

  // ─── Stage 4: Calendar ─────────────────────────────────
  if (!stage || stage === 'calendar') {
    if (!formatted) {
      formatted = await loadPreviousStage('formatted.json');
      console.log('📦 Loaded formatted content from previous stage');
    }
    if (!extraction) {
      extraction = await loadPreviousStage('content-atoms.json');
    }

    calendar = generateCalendar(formatted, {
      bookTitle: extraction.book_title || bookSlug,
    });
  }

  // ─── Stage 5: Write Output ────────────────────────────
  if (!stage) {
    await writeOutput({
      bookSlug,
      extraction,
      formatted,
      calendar,
      baseDir: outputDir,
    });
  }

  // ─── Summary ──────────────────────────────────────────
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║              ✅ Pipeline Complete!               ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  console.log(`   Output:  ${bookOutputDir}/`);

  if (calendar) {
    console.log(`   Posts:   ${calendar.stats.total_entries}`);
    console.log(`   Weeks:   ${calendar.stats.total_weeks}`);
    console.log(`   Months:  ~${calendar.stats.total_months}`);
  }

  console.log('');
}

main().catch(err => {
  console.error('\n❌ Pipeline failed:', err.message);
  if (process.env.DEBUG) {
    console.error(err.stack);
  }
  process.exit(1);
});
