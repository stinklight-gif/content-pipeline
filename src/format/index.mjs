import { formatForTikTok } from './tiktok.mjs';
import { formatForInstagram } from './instagram.mjs';
import { formatForPinterest } from './pinterest.mjs';
import { formatForFacebook } from './facebook.mjs';
import { formatForBlog } from './blog.mjs';
import { formatForEmail } from './email.mjs';

/**
 * Run all platform formatters on extracted content atoms.
 * Runs formatters sequentially to respect API rate limits.
 *
 * @param {object} extractionResult — Full extraction result with content_atoms
 * @returns {Promise<object>} All formatted content, keyed by platform
 */
export async function formatAllPlatforms(extractionResult) {
  console.log('\n📱 Stage 2: Platform Formatting');
  console.log('─'.repeat(40));

  const formatted = {};

  formatted.tiktok = await formatForTikTok(extractionResult);
  formatted.instagram = await formatForInstagram(extractionResult);
  formatted.pinterest = await formatForPinterest(extractionResult);
  formatted.facebook = await formatForFacebook(extractionResult);
  formatted.blog = await formatForBlog(extractionResult);
  formatted.email = await formatForEmail(extractionResult);

  const totalPieces =
    formatted.tiktok.length +
    formatted.instagram.length +
    formatted.pinterest.length +
    formatted.facebook.length +
    formatted.blog.length +
    (formatted.email?.emails?.length || 0);

  console.log(`\n   📊 Total formatted pieces: ${totalPieces}`);

  return formatted;
}
