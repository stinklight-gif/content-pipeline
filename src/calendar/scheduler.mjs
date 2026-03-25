/**
 * Content Calendar Scheduler
 *
 * Distributes formatted content across platforms and dates
 * following the cadence rules defined in the README:
 *
 * - TikTok:    1/day     (daily)
 * - Instagram: 4/week    (Mon, Wed, Fri, Sun)
 * - Pinterest:  3/week    (Tue, Thu, Sat)
 * - Facebook:  2/week    (Wed, Sat)
 * - Blog:      1/week    (Monday)
 *
 * Rule: Never post the same content atom on two platforms the same day.
 */

// Day mapping: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
const PLATFORM_DAYS = {
  tiktok: [0, 1, 2, 3, 4, 5, 6], // daily
  instagram: [1, 3, 5, 0],         // Mon, Wed, Fri, Sun
  pinterest: [2, 4, 6],            // Tue, Thu, Sat
  facebook: [3, 6],                // Wed, Sat
  blog: [1],                       // Mon
};

/**
 * Get the next occurrence of a specific day of the week from a given date.
 * @param {Date} fromDate
 * @param {number} targetDay — 0=Sun through 6=Sat
 * @returns {Date}
 */
function getNextDay(fromDate, targetDay) {
  const date = new Date(fromDate);
  const currentDay = date.getDay();
  const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
  date.setDate(date.getDate() + daysUntil);
  return date;
}

/**
 * Format a date as YYYY-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * Get the ISO week number of a date.
 * @param {Date} date
 * @returns {number}
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

/**
 * Generate a content calendar from formatted content.
 *
 * @param {object} formatted — Formatted content keyed by platform
 * @param {object} [options]
 * @param {Date}   [options.startDate]   — Calendar start date (default: next Monday)
 * @param {string} [options.bookTitle]   — Book title for metadata
 * @returns {object} Calendar data structure
 */
export function generateCalendar(formatted, options = {}) {
  console.log('\n📅 Stage 4: Calendar Generation');
  console.log('─'.repeat(40));

  const now = new Date();
  const startDate = options.startDate || getNextDay(now, 1); // Next Monday

  // Track which atom indices are used on each date to enforce the no-duplicate rule
  const dateAtomMap = new Map(); // date string → Set of atom_index values

  /**
   * Check if an atom is already scheduled on a given date.
   */
  function isAtomUsedOnDate(dateStr, atomIndex) {
    if (atomIndex === undefined || atomIndex === null) return false;
    const used = dateAtomMap.get(dateStr);
    return used ? used.has(atomIndex) : false;
  }

  /**
   * Mark an atom as used on a given date.
   */
  function markAtomUsed(dateStr, atomIndex) {
    if (atomIndex === undefined || atomIndex === null) return;
    if (!dateAtomMap.has(dateStr)) {
      dateAtomMap.set(dateStr, new Set());
    }
    dateAtomMap.get(dateStr).add(atomIndex);
  }

  const calendarEntries = [];

  // Schedule each platform
  for (const [platform, days] of Object.entries(PLATFORM_DAYS)) {
    let content;

    if (platform === 'blog') {
      content = formatted.blog || [];
    } else if (platform === 'email') {
      continue; // Email is a sequence, not calendar-based
    } else {
      content = formatted[platform] || [];
    }

    if (content.length === 0) continue;

    let contentIndex = 0;
    let dayIndex = 0;
    let weekOffset = 0;

    console.log(`   📅 Scheduling ${content.length} ${platform} posts...`);

    while (contentIndex < content.length) {
      const targetDay = days[dayIndex % days.length];

      // Calculate the actual date
      const date = new Date(startDate);
      date.setDate(date.getDate() + (weekOffset * 7));
      // Advance to the target day within this week
      const currentDayOfWeek = date.getDay();
      const diff = (targetDay - currentDayOfWeek + 7) % 7;
      date.setDate(date.getDate() + diff);

      const dateStr = formatDate(date);
      const item = content[contentIndex];
      const atomIndex = item.atom_index ?? item.atom_indices?.[0];

      // Check the no-duplicate rule
      if (!isAtomUsedOnDate(dateStr, atomIndex)) {
        markAtomUsed(dateStr, atomIndex);

        calendarEntries.push({
          id: `${platform}-${String(contentIndex + 1).padStart(3, '0')}`,
          platform,
          format: item.format || 'post',
          scheduled_date: dateStr,
          week_number: getWeekNumber(date),
          content: item,
          atom_index: atomIndex,
          status: 'draft',
        });

        contentIndex++;
      }

      // Move to next day slot
      dayIndex++;
      if (dayIndex % days.length === 0) {
        weekOffset++;
      }
    }
  }

  // Sort by date, then by platform
  calendarEntries.sort((a, b) => {
    const dateComp = a.scheduled_date.localeCompare(b.scheduled_date);
    if (dateComp !== 0) return dateComp;
    return a.platform.localeCompare(b.platform);
  });

  // Calculate calendar stats
  const dates = [...new Set(calendarEntries.map(e => e.scheduled_date))];
  const firstDate = dates[0];
  const lastDate = dates[dates.length - 1];
  const totalWeeks = Math.ceil(
    (new Date(lastDate) - new Date(firstDate)) / (7 * 24 * 60 * 60 * 1000)
  );

  const stats = {
    total_entries: calendarEntries.length,
    platforms: {},
    date_range: { start: firstDate, end: lastDate },
    total_weeks: totalWeeks,
    total_months: Math.ceil(totalWeeks / 4.33),
  };

  for (const entry of calendarEntries) {
    stats.platforms[entry.platform] = (stats.platforms[entry.platform] || 0) + 1;
  }

  console.log(`\n   📊 Calendar Summary:`);
  console.log(`   📆 Date range: ${firstDate} → ${lastDate} (${totalWeeks} weeks)`);
  for (const [platform, count] of Object.entries(stats.platforms)) {
    console.log(`   • ${platform}: ${count} posts`);
  }

  return {
    book_title: options.bookTitle || 'Unknown',
    generated_at: new Date().toISOString(),
    stats,
    entries: calendarEntries,
  };
}
