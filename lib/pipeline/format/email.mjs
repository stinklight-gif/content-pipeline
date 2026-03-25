import { chat, parseJsonResponse } from '../llm.mjs';

const SYSTEM_PROMPT = `You are an email marketing strategist. Given content atoms from a book, create an email welcome/nurture sequence.

Output a JSON object with the email sequence:
{
  "sequence_name": "Welcome sequence for [book title]",
  "emails": [
    {
      "email_number": 1,
      "send_day": 0,
      "subject_line": "Compelling subject line (50 chars max)",
      "preview_text": "Preview text shown in inbox (90 chars max)", 
      "purpose": "welcome | value | social_proof | cross_sell | urgency",
      "body_sections": [
        { "type": "text", "content": "paragraph content" },
        { "type": "quote_highlight", "content": "featured quote from book" },
        { "type": "cta", "text": "Button text", "url_placeholder": "{{amazon_link}}" }
      ],
      "atom_indices": [indices of atoms used]
    }
  ]
}

Rules:
- Create a 3-email sequence:
  - Email 1 (Day 0): Welcome + free sample content (best 3-5 quotes/excerpts)
  - Email 2 (Day 3): Social proof + gift angle push
  - Email 3 (Day 7): Cross-sell to related titles or new content
- Subject lines must be short, curiosity-driven, and emoji-optional
- Each email should provide genuine value, not just sell
- Include the best, most shareable content atoms as highlights
- End each email with a clear, single CTA
- Write in a friendly, conversational tone`;

/**
 * Generate email sequences from content atoms.
 * @param {object} extractionResult — Full extraction result
 * @returns {Promise<object>} Email sequence data
 */
export async function formatForEmail(extractionResult) {
  const { content_atoms, book_title, book_type } = extractionResult;

  console.log(`   📧 Creating email sequence for "${book_title}"...`);

  // Use the top-rated atoms for email
  const topAtoms = [...content_atoms]
    .sort((a, b) => (b.viral_potential || 0) - (a.viral_potential || 0))
    .slice(0, 15);

  const response = await chat({
    system: SYSTEM_PROMPT,
    user: `Book: "${book_title}" (${book_type})

Top content atoms (sorted by viral potential):
${JSON.stringify(topAtoms.map((a, i) => ({ index: i, ...a })), null, 2)}

Create a 3-email welcome sequence.

Return a JSON object with the structure described.`,
    temperature: 0.7,
    maxTokens: 8000,
    json: true,
  });

  const result = parseJsonResponse(response);
  console.log(`   ✅ Generated ${result.emails?.length || 0}-email sequence`);
  return result;
}
