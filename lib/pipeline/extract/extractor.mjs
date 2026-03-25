import { chat, parseJsonResponse } from '../llm.mjs';
import fs from 'fs/promises';

const SYSTEM_PROMPT = `You are a content strategist specializing in book marketing. Your job is to read a book manuscript and extract every piece of reusable content — content atoms — that can be repurposed across social media, blogs, email, and ads.

For each content atom, output a JSON object with these fields:
- "type": one of "quote", "scene", "sample_page", "fact", "tip", "list", "anecdote"
- "text": the exact text or a concise description of the content
- "tags": array of 3-6 relevant topic/theme tags (lowercase)
- "tone": the emotional tone (e.g. "sarcastic", "heartfelt", "funny", "inspirational", "educational")
- "platforms": array of recommended platforms from ["tiktok", "instagram", "facebook", "pinterest", "blog", "email"]
- "viral_potential": integer 1-10 rating of how likely this content is to get engagement
- "hook_angle": a short phrase describing how to present this content (e.g. "relatable office moment", "gift idea angle", "read-aloud moment")

Rules:
- Extract EVERY standalone piece of content, aim for 30-100+ atoms
- Prioritize content that is funny, relatable, surprising, or highly shareable
- Each atom should work on its own without needing context from the rest of the book
- For quote-style books: extract individual quotes or small groups of related quotes
- For children's books: extract funny scenes, characters, and read-aloud moments
- For activity books: describe sample pages that could be shown as previews
- Rate viral_potential honestly — only give 8+ to truly exceptional content

Return your response as a JSON object with this structure:
{
  "book_title": "...",
  "book_type": "humor|children|activity|nonfiction|other",
  "target_audience": "...",
  "content_atoms": [ ...array of atoms... ]
}`;

/**
 * Extract content atoms from a book manuscript.
 * @param {string} manuscriptPath — Path to the manuscript text file
 * @param {string} bookSlug — URL-friendly book identifier
 * @returns {Promise<object>} Extracted content atoms
 */
export async function extractContentAtoms(manuscriptPath, bookSlug) {
  const manuscript = await fs.readFile(manuscriptPath, 'utf-8');

  const wordCount = manuscript.split(/\s+/).length;
  console.log(`📖 Reading manuscript: ${manuscriptPath}`);
  console.log(`   Word count: ${wordCount.toLocaleString()}`);
  console.log(`   Sending to LLM for extraction...`);

  const startTime = Date.now();

  const response = await chat({
    system: SYSTEM_PROMPT,
    user: `Here is the full manuscript. Extract all content atoms.\n\nBook slug: ${bookSlug}\n\n---\n\n${manuscript}`,
    temperature: 0.4,
    maxTokens: 16000,
    json: true,
  });

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`   ✅ LLM responded in ${elapsed}s`);

  const result = parseJsonResponse(response);

  console.log(`   📦 Extracted ${result.content_atoms?.length || 0} content atoms`);
  console.log(`   📚 Book type: ${result.book_type}`);
  console.log(`   🎯 Target audience: ${result.target_audience}`);

  return result;
}
