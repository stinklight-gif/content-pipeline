import { ImageResponse } from '@vercel/og';
import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

// Pinterest pin color schemes
const PIN_SCHEMES = {
  dark: {
    bg: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
    text: '#ffffff',
    accent: '#e94560',
    secondary: '#a8a8b3',
    ctaBg: '#e94560',
    ctaText: '#ffffff',
  },
  light: {
    bg: 'linear-gradient(180deg, #ffffff 0%, #f8f9fa 60%, #e9ecef 100%)',
    text: '#212529',
    accent: '#e94560',
    secondary: '#6c757d',
    ctaBg: '#e94560',
    ctaText: '#ffffff',
  },
  warm: {
    bg: 'linear-gradient(180deg, #fff5e6 0%, #ffe8cc 60%, #ffd9b3 100%)',
    text: '#3d2800',
    accent: '#ff9f43',
    secondary: '#8b6914',
    ctaBg: '#ff9f43',
    ctaText: '#ffffff',
  },
  cool: {
    bg: 'linear-gradient(180deg, #e8f4f8 0%, #d1ecf1 60%, #bee5eb 100%)',
    text: '#0c5460',
    accent: '#17a2b8',
    secondary: '#3d8b99',
    ctaBg: '#17a2b8',
    ctaText: '#ffffff',
  },
  pastel: {
    bg: 'linear-gradient(180deg, #fef9ff 0%, #f3e8ff 60%, #e8d5ff 100%)',
    text: '#2d1b4e',
    accent: '#a855f7',
    secondary: '#7c6f8a',
    ctaBg: '#a855f7',
    ctaText: '#ffffff',
  },
};

/**
 * Generate a Pinterest pin image (1000x1500 vertical format).
 * @param {object} pin — Pinterest pin data
 * @param {string} outputPath — Where to save the PNG
 * @returns {Promise<string>} Path to generated image
 */
export async function generatePinImage(pin, outputPath) {
  const scheme = PIN_SCHEMES[pin.color_scheme] || PIN_SCHEMES.dark;
  const overlayText = pin.text_overlay || pin.title || '';
  const subtitle = pin.subtitle || '';
  const ctaText = pin.cta_text || 'Shop Now →';

  const fontSize = overlayText.length > 100 ? 36 : overlayText.length > 60 ? 44 : 52;

  const html = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: scheme.bg,
        padding: '80px 60px',
        fontFamily: 'sans-serif',
      },
      children: [
        // Top spacer
        {
          type: 'div',
          props: {
            style: { display: 'flex', height: '60px' },
            children: '',
          },
        },
        // Main content area
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              gap: '40px',
            },
            children: [
              // Decorative element
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    width: '60px',
                    height: '4px',
                    background: scheme.accent,
                    borderRadius: '2px',
                  },
                  children: '',
                },
              },
              // Main text
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: `${fontSize}px`,
                    color: scheme.text,
                    textAlign: 'center',
                    lineHeight: 1.4,
                    fontWeight: 700,
                    maxWidth: '850px',
                    fontFamily: 'sans-serif',
                  },
                  children: overlayText,
                },
              },
              // Subtitle
              {
                type: 'div',
                props: {
                  style: {
                    display: 'flex',
                    fontSize: '24px',
                    color: scheme.secondary,
                    textAlign: 'center',
                    fontFamily: 'sans-serif',
                  },
                  children: subtitle,
                },
              },
            ],
          },
        },
        // CTA button
        {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              background: scheme.ctaBg,
              color: scheme.ctaText,
              fontSize: '22px',
              fontWeight: 600,
              padding: '16px 48px',
              borderRadius: '50px',
              fontFamily: 'sans-serif',
            },
            children: ctaText,
          },
        },
      ],
    },
  };

  const response = new ImageResponse(html, {
    width: 1000,
    height: 1500,
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  const pngBuffer = await sharp(buffer).png({ quality: 90 }).toBuffer();

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, pngBuffer);

  return outputPath;
}

/**
 * Generate pin images for all Pinterest pins.
 * @param {object[]} pinterestPins — Array of Pinterest pin data
 * @param {string} outputDir — Base output directory
 * @returns {Promise<string[]>} Array of generated image paths
 */
export async function generateAllPinImages(pinterestPins, outputDir) {
  if (!pinterestPins || pinterestPins.length === 0) {
    console.log('   ⏭️  No Pinterest pins to generate');
    return [];
  }

  console.log(`   📌 Generating ${pinterestPins.length} Pinterest pin images...`);

  const paths = [];
  for (let i = 0; i < pinterestPins.length; i++) {
    const pin = pinterestPins[i];
    const filename = `pin-${String(i + 1).padStart(2, '0')}.png`;
    const outputPath = path.join(outputDir, 'pinterest', filename);
    await generatePinImage(pin, outputPath);

    // Also save the pin metadata alongside the image
    const metaPath = path.join(outputDir, 'pinterest', `pin-${String(i + 1).padStart(2, '0')}.json`);
    await fs.writeFile(metaPath, JSON.stringify(pin, null, 2));

    paths.push(outputPath);
  }

  console.log(`   ✅ Generated ${paths.length} Pinterest pin images`);
  return paths;
}
