/**
 * arabicNumbers.js
 * Converts Arabic-Indic / Western digits found in free text into
 * their Modern Standard Arabic word form.
 *
 * Handles three categories, matched in this priority order so they
 * never collide with each other:
 *   1. Clock times   ( 9:30 -> "تسع ونص" )
 *   2. Decimal numbers ( 3.5 -> "ثلاثة فاصلة خمسة", with common
 *      fractions like .5/.25/.75 spelled naturally )
 *   3. Plain integers, including large numbers with thousands/millions
 *      ( 5000 -> "خمسة آلاف" )
 */

'use strict';

// ---------------------------------------------------------------------
// Basic word tables (masculine forms – used for money/quantities, the
// grammatically "default" form used when spelling out numbers in Arabic
// checks/invoices, e.g. "خمسة آلاف ريال").
// ---------------------------------------------------------------------
const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
const TEENS = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
const HUNDREDS = ['', 'مئة', 'مئتان', 'ثلاثمئة', 'أربعمئة', 'خمسمئة', 'ستمئة', 'سبعمئة', 'ثمانمئة', 'تسعمئة'];

// Group names: [singular, dual, plural(3-10), singular-used-for-11+]
const GROUPS = [
  null, // ones group has no name
  { singular: 'ألف', dual: 'ألفان', plural: 'آلاف', many: 'ألف' },
  { singular: 'مليون', dual: 'مليونان', plural: 'ملايين', many: 'مليون' },
  { singular: 'مليار', dual: 'مليار', plural: 'مليارات', many: 'مليار' },
  { singular: 'تريليون', dual: 'تريليونان', plural: 'تريليونات', many: 'تريليون' },
];

// Feminine cardinal forms used for clock hours ("الساعة تسع ونص")
const HOUR_WORDS = [
  '', 'واحدة', 'اثنتان', 'ثلاث', 'أربع', 'خمس', 'ست', 'سبع', 'ثماني', 'تسع', 'عشر', 'إحدى عشرة', 'اثنتا عشرة',
];

/** Converts a 0-999 integer chunk into Arabic words. */
function threeDigitsToWords(n) {
  if (n === 0) return '';
  const parts = [];
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;

  if (hundreds > 0) parts.push(HUNDREDS[hundreds]);

  if (rest > 0) {
    if (rest < 10) {
      parts.push(ONES[rest]);
    } else if (rest < 20) {
      parts.push(TEENS[rest - 10]);
    } else {
      const tens = Math.floor(rest / 10);
      const ones = rest % 10;
      if (ones > 0) {
        parts.push(`${ONES[ones]} و${TENS[tens]}`);
      } else {
        parts.push(TENS[tens]);
      }
    }
  }

  return parts.join(' و');
}

/** Picks the correct grammatical form of a group name (ألف/ألفان/آلاف...) for a given count. */
function groupName(count, group) {
  if (count === 1) return group.singular;
  if (count === 2) return group.dual;
  if (count >= 3 && count <= 10) return group.plural;
  return group.many; // 11+ uses the singular "tamyiz" form
}

/**
 * Converts a non-negative integer (as a JS number or BigInt-safe string)
 * into Arabic words.
 */
function integerToWords(value) {
  let n = typeof value === 'string' ? value.replace(/[,\s]/g, '') : String(value);
  n = n.replace(/^0+(?=\d)/, ''); // drop leading zeros
  if (n === '' || n === '0') return 'صفر';

  // Split into groups of 3 digits from the right.
  const digits = n.split('').reverse();
  const chunks = [];
  for (let i = 0; i < digits.length; i += 3) {
    chunks.push(digits.slice(i, i + 3).reverse().join(''));
  }
  chunks.reverse(); // now most-significant group first

  const totalGroups = chunks.length;
  const words = [];

  chunks.forEach((chunkStr, idx) => {
    const chunkVal = parseInt(chunkStr, 10);
    if (chunkVal === 0) return;

    const groupIndex = totalGroups - 1 - idx; // 0 = ones, 1 = thousand, 2 = million...
    const chunkWords = threeDigitsToWords(chunkVal);

    if (groupIndex === 0) {
      words.push(chunkWords);
    } else if (groupIndex - 1 < GROUPS.length - 1) {
      const group = GROUPS[groupIndex];
      if (chunkVal === 1) {
        words.push(group.singular);
      } else if (chunkVal === 2) {
        words.push(group.dual);
      } else {
        words.push(`${chunkWords} ${groupName(chunkVal, group)}`);
      }
    } else {
      // Beyond our named groups (extremely large); fall back gracefully.
      words.push(`${chunkWords} ${GROUPS[GROUPS.length - 1].many}`);
    }
  });

  return words.join(' و');
}

// ---------------------------------------------------------------------
// Clock time handling
// ---------------------------------------------------------------------
function minutesToWords(minute, hourWordForNext) {
  if (minute === 0) return '';
  if (minute === 30) return ' ونص';
  if (minute === 15) return ' وربع';
  if (minute === 45) return ` إلا ربع`; // caller substitutes the *next* hour
  if (minute === 20) return ' وثلث';
  if (minute === 40) return ' إلا ثلث';

  // Generic minute count: "و<رقم> دقيقة/دقيقتين/دقائق"
  if (minute === 1) return ' ودقيقة واحدة';
  if (minute === 2) return ' ودقيقتين';
  const word = integerToWords(minute);
  if (minute >= 3 && minute <= 10) return ` و${word} دقائق`;
  return ` و${word} دقيقة`;
}

function timeToWords(hourRaw, minuteRaw) {
  let hour = parseInt(hourRaw, 10);
  const minute = parseInt(minuteRaw, 10);

  // Normalize 24h -> 12h clock for spoken form.
  hour = hour % 12;
  if (hour === 0) hour = 12;

  if (minute === 45) {
    // "9:45" -> "عشرة إلا ربع" (next hour minus a quarter)
    const nextHour = (hour % 12) + 1;
    return `${HOUR_WORDS[nextHour]} إلا ربع`;
  }
  if (minute === 40) {
    const nextHour = (hour % 12) + 1;
    return `${HOUR_WORDS[nextHour]} إلا ثلث`;
  }

  return `${HOUR_WORDS[hour]}${minutesToWords(minute)}`;
}

// ---------------------------------------------------------------------
// Decimal handling
// ---------------------------------------------------------------------
function digitToWord(d) {
  return d === '0' ? 'صفر' : ONES[parseInt(d, 10)];
}

function decimalToWords(intPart, fracPart) {
  const intWords = integerToWords(intPart || '0');

  if (fracPart === '5') return `${intWords} ونصف`;
  if (fracPart === '25') return `${intWords} وربع`;
  if (fracPart === '75') return `${intWords} وثلاثة أرباع`;
  if (fracPart === '50') return `${intWords} ونصف`;

  // Read the fractional part as a whole number (e.g. ".99" -> "تسعة وتسعون",
  // ".998" -> "تسعمئة وثمانية وتسعون"), which is how people naturally read
  // prices and measurements out loud.
  const fracWords = integerToWords(fracPart);
  return `${intWords} فاصلة ${fracWords}`;
}

// ---------------------------------------------------------------------
// Public entry point: find & replace every number-like token in a string
// ---------------------------------------------------------------------
function convertTextNumbers(text) {
  // Order matters: time (H:MM) before decimals before plain integers,
  // so a pattern like "9:30" is never partially re-matched as "9" + "30".
  const combinedPattern = /(\b([01]?\d|2[0-3]):([0-5]\d)\b)|(\b\d+\.\d+\b)|(\b\d{1,3}(?:,\d{3})+\b)|(\b\d+\b)/g;

  return text.replace(combinedPattern, (match, timeFull, hh, mm, decimalMatch) => {
    if (timeFull) {
      return timeToWords(hh, mm);
    }
    if (decimalMatch) {
      const [intPart, fracPart] = decimalMatch.split('.');
      return decimalToWords(intPart, fracPart);
    }
    // Plain integer (with or without thousands separators)
    return integerToWords(match);
  });
}

module.exports = {
  convertTextNumbers,
  integerToWords,
  timeToWords,
};
