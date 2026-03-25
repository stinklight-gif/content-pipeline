import { chat, parseJsonResponse } from '../llm.mjs';

const SYSTEM_PROMPT = `You are a TikTok content strategist. Given content atoms from a book, create vertical video scripts optimized for TikTok / Instagram Reels / YouTube Shorts.

For each script, output a JSON object:
{
  "atom_index": (index of the source content atom),
  "platform": "tiktok",
  "format": "video_script",
  "hook": "Text that appears in the first 1.5 seconds to stop scrolling",
  "body": "The main content — what to show/say (10-20 seconds)",
  "close": "Call-to-action (3 seconds)",
  "text_overlays": ["array of text to show on screen"],
  "audio_note": "Suggestion for trending sound or voiceover style",
  "hashtags": ["array", "of", "hashtags"],
  "caption": "Post caption text",
  "estimated_duration_seconds": 15
}

Rules:
- Hook MUST be attention-grabbing and appear in the first 1.5 seconds
- Keep total video length 10-30 seconds
- Use trending formats: POV, storytelling, hot takes, relatable moments
- Include 5-8 relevant hashtags including #booktok
- Caption should encourage engagement (comments, shares, saves)
- Group related atoms into batches of 3-5 for compilation videos`;

/**
 * Generate TikTok video scripts from content atoms.
 * @param {object} extractionResult — Full extraction result with content_atoms
 * @returns {Promise<object[]>} Array of TikTok-formatted content
 */
export async function formatForTikTok(extractionResult) {
  const { content_atoms, book_title, book_type } = extractionResult;

  const tiktokAtoms = content_atoms.filter(a =>
    a.platforms.includes('tiktok')
  );

  if (tiktokAtoms.length === 0) {
    console.log('   ⏭️  No atoms suitable for TikTok');
    return [];
  }

  console.log(`   🎵 Formatting ${tiktokAtoms.length} atoms for TikTok...`);

  const response = await chat({
    system: SYSTEM_PROMPT,
    user: `Book: "${book_title}" (${book_type})

Here are the content atoms to format for TikTok. Create a video script for each one, plus any compilation video scripts that make sense by grouping related atoms.

Content Atoms:
${JSON.stringify(tiktokAtoms.map((a, i) => ({ index: i, ...a })), null, 2)}

Return a JSON object: { "scripts": [...array of script objects...] }`,
    temperature: 0.7,
    maxTokens: 12000,
    json: true,
  });

  const result = parseJsonResponse(response);
  console.log(`   ✅ Generated ${result.scripts?.length || 0} TikTok scripts`);
  return result.scripts || [];
}
