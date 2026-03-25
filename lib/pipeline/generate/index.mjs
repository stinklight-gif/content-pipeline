import { generateAllQuoteCards } from './quote-card.mjs';
import { generateAllPinImages } from './pin-image.mjs';

/**
 * Generate all image assets from formatted content.
 * @param {object} formatted — Formatted content keyed by platform
 * @param {string} outputDir — Base output directory
 * @returns {Promise<object>} Generated asset paths keyed by type
 */
export async function generateAllAssets(formatted, outputDir) {
  console.log('\n🎨 Stage 3: Asset Generation');
  console.log('─'.repeat(40));

  const assets = {};

  assets.quoteCards = await generateAllQuoteCards(
    formatted.instagram || [],
    outputDir
  );

  assets.pinImages = await generateAllPinImages(
    formatted.pinterest || [],
    outputDir
  );

  const totalAssets = assets.quoteCards.length + assets.pinImages.length;
  console.log(`\n   📊 Total images generated: ${totalAssets}`);

  return assets;
}
