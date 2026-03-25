import { ImageResponse } from '@vercel/og';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Color scheme presets
const COLOR_SCHEMES = {
  dark: {
    bg: '#1a1a2e',
    bgGradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    text: '#ffffff',
    accent: '#e94560',
    secondary: '#a8a8b3',
  },
  light: {
    bg: '#fafafa',
    bgGradient: 'linear-gradient(135deg, #fafafa 0%, #f0f0f5 50%, #e8e8f0 100%)',
    text: '#1a1a2e',
    accent: '#e94560',
    secondary: '#666680',
  },
  warm: {
    bg: '#2d1b00',
    bgGradient: 'linear-gradient(135deg, #2d1b00 0%, #4a2c0a 50%, #6b3a10 100%)',
    text: '#fff5e6',
    accent: '#ff9f43',
    secondary: '#d4a574',
  },
  cool: {
    bg: '#0a192f',
    bgGradient: 'linear-gradient(135deg, #0a192f 0%, #112240 50%, #1d3557 100%)',
    text: '#ccd6f6',
    accent: '#64ffda',
    secondary: '#8892b0',
  },
  brand: {
    bg: '#1e1e3f',
    bgGradient: 'linear-gradient(135deg, #1e1e3f 0%, #2d2d5e 50%, #3d3d7e 100%)',
    text: '#ffffff',
    accent: '#ff6b6b',
    secondary: '#c8c8e0',
  },
  pastel: {
    bg: '#fef9ff',
    bgGradient: 'linear-gradient(135deg, #fef9ff 0%, #f3e8ff 50%, #e8d5ff 100%)',
    text: '#2d1b4e',
    accent: '#a855f7',
    secondary: '#7c6f8a',
  },
};

/**
 * Generate a quote card image (1080x1080 for Instagram).
 * @param {object} post — Instagram post data
 * @param {string} outputPath — Where to save the PNG
 * @returns {Promise<string>} Path to generated image
 */
export async function generateQuoteCard(post, outputPath) {
  const scheme = COLOR_SCHEMES[post.color_scheme] || COLOR_SCHEMES.dark;
  const quoteText = post.quote_text || post.text || '';
  const attribution = post.attribution || '';

  // Adjust font size based on text length
  const fontSize = quoteText.length > 150 ? 32 : quoteText.length > 80 ? 40 : 48;

  const html = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: scheme.bgGradient,
        padding: '80px',
        fontFamily: 'sans-serif',
      },
      children: [
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '80px',
              color: scheme.accent,
              marginBottom: '20px',
              fontFamily: 'sans-serif',
            },
            children: '"',
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: `${fontSize}px`,
              color: scheme.text,
              textAlign: 'center',
              lineHeight: 1.5,
              fontWeight: 600,
              maxWidth: '900px',
              fontFamily: 'sans-serif',
            },
            children: quoteText,
          },
        },
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              fontSize: '22px',
              color: scheme.secondary,
              marginTop: '40px',
              fontStyle: 'italic',
              fontFamily: 'sans-serif',
            },
            children: attribution,
          },
        },
      ],
    },
  };

  const response = new ImageResponse(html, {
    width: 1080,
    height: 1080,
  });

  const buffer = Buffer.from(await response.arrayBuffer());

  // Use sharp to ensure proper PNG output
  const pngBuffer = await sharp(buffer).png({ quality: 90 }).toBuffer();

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, pngBuffer);

  return outputPath;
}

/**
 * Generate quote card images for all Instagram posts that need them.
 * @param {object[]} instagramPosts — Array of Instagram post data
 * @param {string} outputDir — Base output directory
 * @returns {Promise<string[]>} Array of generated image paths
 */
export async function generateAllQuoteCards(instagramPosts, outputDir) {
  const quoteCards = instagramPosts.filter(
    p => p.format === 'quote_card' && p.quote_text
  );

  if (quoteCards.length === 0) {
    console.log('   ⏭️  No quote cards to generate');
    return [];
  }

  console.log(`   🎨 Generating ${quoteCards.length} quote card images...`);

  const paths = [];
  for (let i = 0; i < quoteCards.length; i++) {
    const post = quoteCards[i];
    const filename = `quote-card-${String(i + 1).padStart(2, '0')}.png`;
    const outputPath = path.join(outputDir, 'instagram', filename);
    await generateQuoteCard(post, outputPath);
    paths.push(outputPath);
  }

  console.log(`   ✅ Generated ${paths.length} quote card images`);
  return paths;
}
