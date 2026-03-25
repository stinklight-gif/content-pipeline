import { chat, parseJsonResponse } from '../llm.mjs';

const SYSTEM_PROMPT = `You are a Pinterest strategist. Given content atoms from a book, create Pinterest pin content optimized for discovery, saves, and click-through.

For each pin, output a JSON object:
{
  "atom_index": (index of the source content atom),
  "platform": "pinterest",
  "format": "pin",
  "title": "SEO-optimized pin title (60-100 chars)",
  "description": "Keyword-rich description (150-300 chars) with natural language",
  "text_overlay": "Text to show on the pin image (short, bold, readable)",
  "subtitle": "Secondary text on pin (e.g. book title or tagline)",
  "board_suggestions": ["Board Name 1", "Board Name 2"],
  "color_scheme": "dark" | "light" | "warm" | "cool" | "pastel",
  "keywords": ["seo", "keywords", "for", "pinterest"],
  "cta_text": "Call to action (e.g. 'Shop on Amazon', 'Get Your Copy')"
}

Rules:
- Titles must be SEO-optimized for Pinterest search (think: what people search for)
- Include gift-angle keywords: "gift for coworker", "funny birthday gift", "white elephant gift"
- Descriptions should read naturally but include 3-5 target keywords
- Pin images are vertical (1000x1500) — overlay text must be large and readable
- Suggest 2-3 relevant board names per pin
- Focus on discovery intent: people searching for gift ideas, funny content, activities`;

/**
 * Generate Pinterest pins from content atoms.
 * @param {object} extractionResult — Full extraction result
 * @returns {Promise<object[]>} Array of Pinterest-formatted content
 */
export async function formatForPinterest(extractionResult) {
  const { content_atoms, book_title, book_type } = extractionResult;

  const pinAtoms = content_atoms.filter(a =>
    a.platforms.includes('pinterest')
  );

  if (pinAtoms.length === 0) {
    console.log('   ⏭️  No atoms suitable for Pinterest');
    return [];
  }

  console.log(`   📌 Formatting ${pinAtoms.length} atoms for Pinterest...`);

  const response = await chat({
    system: SYSTEM_PROMPT,
    user: `Book: "${book_title}" (${book_type})

Content Atoms:
${JSON.stringify(pinAtoms.map((a, i) => ({ index: i, ...a })), null, 2)}

Return a JSON object: { "pins": [...array of pin objects...] }`,
    temperature: 0.7,
    maxTokens: 12000,
    json: true,
  });

  const result = parseJsonResponse(response);
  console.log(`   ✅ Generated ${result.pins?.length || 0} Pinterest pins`);
  return result.pins || [];
}
