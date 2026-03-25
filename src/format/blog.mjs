import { chat, parseJsonResponse } from '../llm.mjs';

const SYSTEM_PROMPT = `You are an SEO content strategist. Given content atoms from a book, create SEO-optimized blog post outlines and drafts.

For each blog post, output a JSON object:
{
  "atom_indices": [array of atom indices used in this post],
  "platform": "blog",
  "format": "blog_post",
  "title": "SEO-optimized blog title (include target keyword)",
  "meta_description": "155-character meta description for search",
  "target_keywords": ["primary keyword", "secondary keyword", "long-tail keyword"],
  "outline": [
    { "heading": "H2 heading", "content": "2-3 sentence summary of this section" }
  ],
  "intro": "Full intro paragraph (2-3 sentences, hook the reader)",
  "body_sections": [
    { "heading": "H2 heading", "content": "Full section content (2-4 paragraphs)" }
  ],
  "conclusion": "Concluding paragraph with CTA",
  "cta": "Call to action (Buy on Amazon, etc.)",
  "estimated_word_count": 1200,
  "internal_links": ["Suggested internal link topics"]
}

Rules:
- Each blog post should be a listicle or how-to format (these perform best)
- Target 1,000-1,500 words per post
- Include the primary keyword in the title, first paragraph, and 2-3 headings
- Meta descriptions should be compelling and include the primary keyword
- Group related atoms into single posts (e.g. "25 Funny Office Quotes")
- Include a clear CTA to buy the book on Amazon
- Write in a conversational, engaging tone`;

/**
 * Generate blog posts from content atoms.
 * @param {object} extractionResult — Full extraction result
 * @returns {Promise<object[]>} Array of blog post content
 */
export async function formatForBlog(extractionResult) {
  const { content_atoms, book_title, book_type } = extractionResult;

  const blogAtoms = content_atoms.filter(a =>
    a.platforms.includes('blog')
  );

  if (blogAtoms.length === 0) {
    console.log('   ⏭️  No atoms suitable for blog');
    return [];
  }

  console.log(`   ✍️  Formatting ${blogAtoms.length} atoms into blog posts...`);

  const response = await chat({
    system: SYSTEM_PROMPT,
    user: `Book: "${book_title}" (${book_type})

Content Atoms:
${JSON.stringify(blogAtoms.map((a, i) => ({ index: i, ...a })), null, 2)}

Group these atoms into 4-8 blog posts. Each post should use multiple related atoms.

Return a JSON object: { "posts": [...array of blog post objects...] }`,
    temperature: 0.6,
    maxTokens: 16000,
    json: true,
  });

  const result = parseJsonResponse(response);
  console.log(`   ✅ Generated ${result.posts?.length || 0} blog posts`);
  return result.posts || [];
}
