import fs from 'fs/promises';
import path from 'path';

/**
 * Write all pipeline output to structured folders.
 *
 * @param {object} params
 * @param {string} params.bookSlug — Book identifier
 * @param {object} params.extraction — Extracted content atoms
 * @param {object} params.formatted — Formatted content by platform
 * @param {object} params.calendar — Generated calendar
 * @param {string} [params.baseDir] — Base output directory
 */
export async function writeOutput({
  bookSlug,
  extraction,
  formatted,
  calendar,
  baseDir = 'output',
}) {
  console.log('\n💾 Stage 5: Writing Output');
  console.log('─'.repeat(40));

  const outputDir = path.resolve(baseDir, bookSlug);
  await fs.mkdir(outputDir, { recursive: true });

  // 1. Content atoms
  const atomsPath = path.join(outputDir, 'content-atoms.json');
  await fs.writeFile(atomsPath, JSON.stringify(extraction, null, 2));
  console.log(`   📦 ${atomsPath}`);

  // 2. Calendar
  const calendarPath = path.join(outputDir, 'calendar.json');
  await fs.writeFile(calendarPath, JSON.stringify(calendar, null, 2));
  console.log(`   📅 ${calendarPath}`);

  // 3. TikTok scripts
  if (formatted.tiktok?.length > 0) {
    const tiktokDir = path.join(outputDir, 'tiktok');
    await fs.mkdir(tiktokDir, { recursive: true });

    for (let i = 0; i < formatted.tiktok.length; i++) {
      const script = formatted.tiktok[i];
      const filename = `script-${String(i + 1).padStart(2, '0')}.md`;
      const content = formatTikTokScript(script, i + 1);
      await fs.writeFile(path.join(tiktokDir, filename), content);
    }
    console.log(`   🎵 ${formatted.tiktok.length} TikTok scripts → tiktok/`);
  }

  // 4. Instagram posts
  if (formatted.instagram?.length > 0) {
    const igDir = path.join(outputDir, 'instagram');
    await fs.mkdir(igDir, { recursive: true });

    for (let i = 0; i < formatted.instagram.length; i++) {
      const post = formatted.instagram[i];
      const filename = `post-${String(i + 1).padStart(2, '0')}.json`;
      await fs.writeFile(path.join(igDir, filename), JSON.stringify(post, null, 2));

      // Write caption as separate text file for easy copy-paste
      if (post.caption) {
        const captionFile = `post-${String(i + 1).padStart(2, '0')}-caption.txt`;
        const captionContent = `${post.caption}\n\n${(post.hashtags || []).map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`;
        await fs.writeFile(path.join(igDir, captionFile), captionContent);
      }
    }
    console.log(`   📸 ${formatted.instagram.length} Instagram posts → instagram/`);
  }

  // 5. Pinterest pins
  if (formatted.pinterest?.length > 0) {
    const pinDir = path.join(outputDir, 'pinterest');
    await fs.mkdir(pinDir, { recursive: true });

    for (let i = 0; i < formatted.pinterest.length; i++) {
      const pin = formatted.pinterest[i];
      const filename = `pin-${String(i + 1).padStart(2, '0')}.txt`;
      const content = formatPinterestPin(pin, i + 1);
      await fs.writeFile(path.join(pinDir, filename), content);
    }
    console.log(`   📌 ${formatted.pinterest.length} Pinterest pins → pinterest/`);
  }

  // 6. Facebook posts
  if (formatted.facebook?.length > 0) {
    const fbDir = path.join(outputDir, 'facebook');
    await fs.mkdir(fbDir, { recursive: true });

    for (let i = 0; i < formatted.facebook.length; i++) {
      const post = formatted.facebook[i];
      const filename = `${post.format || 'post'}-${String(i + 1).padStart(2, '0')}.json`;
      await fs.writeFile(path.join(fbDir, filename), JSON.stringify(post, null, 2));
    }
    console.log(`   📘 ${formatted.facebook.length} Facebook posts → facebook/`);
  }

  // 7. Blog posts
  if (formatted.blog?.length > 0) {
    const blogDir = path.join(outputDir, 'blog');
    await fs.mkdir(blogDir, { recursive: true });

    for (let i = 0; i < formatted.blog.length; i++) {
      const post = formatted.blog[i];
      const filename = `post-${String(i + 1).padStart(2, '0')}.md`;
      const content = formatBlogPost(post, i + 1);
      await fs.writeFile(path.join(blogDir, filename), content);
    }
    console.log(`   ✍️  ${formatted.blog.length} blog posts → blog/`);
  }

  // 8. Email sequences
  if (formatted.email?.emails?.length > 0) {
    const emailDir = path.join(outputDir, 'email', 'welcome-sequence');
    await fs.mkdir(emailDir, { recursive: true });

    for (const email of formatted.email.emails) {
      const filename = `email-${email.email_number}.md`;
      const content = formatEmailContent(email);
      await fs.writeFile(path.join(emailDir, filename), content);
    }
    console.log(`   📧 ${formatted.email.emails.length}-email sequence → email/welcome-sequence/`);
  }

  console.log(`\n   ✅ All output saved to ${outputDir}`);
  return outputDir;
}

// ─── Formatting helpers ──────────────────────────────────────

function formatTikTokScript(script, index) {
  return `# TikTok Script #${index}

## Hook (0-1.5s)
${script.hook || 'N/A'}

## Body (1.5-20s)
${script.body || 'N/A'}

## Close / CTA (last 3s)
${script.close || 'N/A'}

## Text Overlays
${(script.text_overlays || []).map(t => `- ${t}`).join('\n') || 'N/A'}

## Audio Note
${script.audio_note || 'N/A'}

## Caption
${script.caption || 'N/A'}

## Hashtags
${(script.hashtags || []).map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}

## Estimated Duration
${script.estimated_duration_seconds || 15}s
`;
}

function formatPinterestPin(pin, index) {
  return `Pin #${index}
${'='.repeat(40)}

Title: ${pin.title || 'N/A'}

Description:
${pin.description || 'N/A'}

Text Overlay: ${pin.text_overlay || 'N/A'}
Subtitle: ${pin.subtitle || 'N/A'}
CTA: ${pin.cta_text || 'N/A'}

Board Suggestions:
${(pin.board_suggestions || []).map(b => `  - ${b}`).join('\n')}

Keywords: ${(pin.keywords || []).join(', ')}
Color Scheme: ${pin.color_scheme || 'N/A'}
`;
}

function formatBlogPost(post, index) {
  let md = `---
title: "${post.title || `Blog Post #${index}`}"
meta_description: "${post.meta_description || ''}"
target_keywords: ${JSON.stringify(post.target_keywords || [])}
estimated_word_count: ${post.estimated_word_count || 1200}
---

# ${post.title || `Blog Post #${index}`}

${post.intro || ''}

`;

  if (post.body_sections) {
    for (const section of post.body_sections) {
      md += `## ${section.heading}\n\n${section.content}\n\n`;
    }
  }

  if (post.conclusion) {
    md += `## Conclusion\n\n${post.conclusion}\n\n`;
  }

  if (post.cta) {
    md += `---\n\n**${post.cta}**\n`;
  }

  return md;
}

function formatEmailContent(email) {
  let md = `---
email_number: ${email.email_number}
send_day: ${email.send_day}
subject_line: "${email.subject_line || ''}"
preview_text: "${email.preview_text || ''}"
purpose: ${email.purpose || 'value'}
---

# Email ${email.email_number}: ${email.subject_line || 'Untitled'}

`;

  if (email.body_sections) {
    for (const section of email.body_sections) {
      if (section.type === 'text') {
        md += `${section.content}\n\n`;
      } else if (section.type === 'quote_highlight') {
        md += `> "${section.content}"\n\n`;
      } else if (section.type === 'cta') {
        md += `**[${section.text}](${section.url_placeholder || '#'})**\n\n`;
      }
    }
  }

  return md;
}
