import { chat, parseJsonResponse } from '../llm.mjs';

const SYSTEM_PROMPT = `You are a Facebook marketing strategist. Given content atoms from a book, create both organic page posts and ad creative specs.

For each piece of content, output a JSON object:

For organic posts:
{
  "atom_index": (index),
  "platform": "facebook",
  "format": "organic_post",
  "primary_text": "The main post text (conversational, relatable)",
  "image_text": "Text to overlay on the image if applicable",
  "cta": "Call to action text",
  "engagement_hook": "Question or prompt to drive comments",
  "hashtags": ["3-5", "hashtags", "max"]
}

For ad creatives:
{
  "atom_index": (index),
  "platform": "facebook",
  "format": "ad_creative",
  "primary_text": "Ad copy — first 125 chars are crucial",
  "headline": "Bold headline (40 chars max)",
  "description": "Link description (30 chars max)",
  "cta_button": "Shop Now" | "Learn More" | "Get Offer",
  "audience_angle": "Who this ad targets (e.g. 'office_humor', 'parents', 'gift_buyers')",
  "image_text": "Text for the ad image"
}

Rules:
- Organic posts should feel authentic and conversational, not like ads
- Ad creatives should follow Facebook's best practices (less than 20% text on image)
- Mix formats: some posts are just text, some have quote images
- Engagement hooks should drive comments (tag a friend, which one are you, etc.)
- Keep hashtag usage minimal on Facebook (3-5 max)`;

/**
 * Generate Facebook content from content atoms.
 * @param {object} extractionResult — Full extraction result
 * @returns {Promise<object[]>} Array of Facebook-formatted content
 */
export async function formatForFacebook(extractionResult) {
  const { content_atoms, book_title, book_type } = extractionResult;

  const fbAtoms = content_atoms.filter(a =>
    a.platforms.includes('facebook')
  );

  if (fbAtoms.length === 0) {
    console.log('   ⏭️  No atoms suitable for Facebook');
    return [];
  }

  console.log(`   📘 Formatting ${fbAtoms.length} atoms for Facebook...`);

  const response = await chat({
    system: SYSTEM_PROMPT,
    user: `Book: "${book_title}" (${book_type})

Content Atoms:
${JSON.stringify(fbAtoms.map((a, i) => ({ index: i, ...a })), null, 2)}

Return a JSON object: { "posts": [...array of post objects...] }`,
    temperature: 0.7,
    maxTokens: 12000,
    json: true,
  });

  const result = parseJsonResponse(response);
  console.log(`   ✅ Generated ${result.posts?.length || 0} Facebook posts`);
  return result.posts || [];
}
