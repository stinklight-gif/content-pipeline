import { chat, parseJsonResponse } from '../llm.mjs';

const SYSTEM_PROMPT = `You are an Instagram content strategist. Given content atoms from a book, create Instagram-ready post formats: quote cards, carousels, and single image posts.

For each post, output a JSON object:
{
  "atom_index": (index of the source content atom),
  "platform": "instagram",
  "format": "quote_card" | "carousel" | "single_image",
  "quote_text": "The text to display on the image (for quote cards)",
  "attribution": "— Book Title",
  "caption": "Full Instagram caption with hooks and CTA",
  "hashtags": ["array", "of", "hashtags"],
  "color_scheme": "dark" | "light" | "brand" | "warm" | "cool",
  "carousel_slides": ["array of text for each slide if carousel"],
  "engagement_cta": "Question or call to action to drive comments"
}

Rules:
- Captions should start with a hook line, use line breaks for readability
- Include 20-30 hashtags mixing broad and niche
- Quote cards should have clean, bold text — no clutter
- Carousels should tell a story or build anticipation across slides
- End captions with a clear CTA: tag someone, save this, link in bio
- Color scheme should match the content tone`;

/**
 * Generate Instagram posts from content atoms.
 * @param {object} extractionResult — Full extraction result
 * @returns {Promise<object[]>} Array of Instagram-formatted content
 */
export async function formatForInstagram(extractionResult) {
  const { content_atoms, book_title, book_type } = extractionResult;

  const igAtoms = content_atoms.filter(a =>
    a.platforms.includes('instagram')
  );

  if (igAtoms.length === 0) {
    console.log('   ⏭️  No atoms suitable for Instagram');
    return [];
  }

  console.log(`   📸 Formatting ${igAtoms.length} atoms for Instagram...`);

  const response = await chat({
    system: SYSTEM_PROMPT,
    user: `Book: "${book_title}" (${book_type})

Content Atoms:
${JSON.stringify(igAtoms.map((a, i) => ({ index: i, ...a })), null, 2)}

Return a JSON object: { "posts": [...array of post objects...] }`,
    temperature: 0.7,
    maxTokens: 12000,
    json: true,
  });

  const result = parseJsonResponse(response);
  console.log(`   ✅ Generated ${result.posts?.length || 0} Instagram posts`);
  return result.posts || [];
}
