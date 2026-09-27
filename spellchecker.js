/**
 * SinhalaUniPro - Advanced Sinhala Spell Checker Engine
 * Powered by sinhala_words_dataset.json (24,663 correct words, 28,623 misspellings, & 9,734 direct fixes)
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['./dictionary_data'], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./dictionary_data'));
  } else {
    root.SinhalaSpellChecker = factory(root.SinhalaDictionaryData);
  }
}(typeof self !== 'undefined' ? self : this, function (dictData) {
  'use strict';

  const correctArray = (dictData && dictData.correct) ? dictData.correct : [];
  const incorrectArray = (dictData && dictData.incorrect) ? dictData.incorrect : [];
  const directCorrections = (dictData && dictData.directCorrections) ? dictData.directCorrections : {};

  const correctSet = new Set(correctArray);
  const incorrectSet = new Set(incorrectArray);

  // Essential high-frequency Sinhala conversational words & verbs to prevent false positives
  const CORE_WORDS = [
    'මම', 'ඔබ', 'අපි', 'ඔහු', 'ඇය', 'ඔවුන්', 'තමන්', 'සහ', 'හා', 'හෝ',
    'නමුත්', 'එසේම', 'එමෙන්ම', 'නැත', 'නැතහොත්', 'දින', 'දවස', 'අද', 'හෙට', 'ඊයේ',
    'දැන්', 'පසු', 'පෙර', 'ගෙදර', 'යනවා', 'එනවා', 'කරනවා', 'කරමු', 'කරයි', 'කළේය',
    'කළා', 'කලා', 'සුබ', 'සුභ', 'ආයුබෝවන්', 'ආයුබොවන්', 'ස්තුතියි', 'ස්තූතියි', 'ලංකාව',
    'ලංකාවේ', 'ලංකාවට', 'ශ්‍රී', 'ශ්‍රී ලංකාව', 'රට', 'මිනිසා', 'මිනිසුන්', 'ලෝකය',
    'හොඳ', 'නරක', 'ලොකු', 'පොඩි', 'අලුත්', 'පරණ', 'වඩා', 'ඉතා', 'ගැන', 'පිළිබඳ',
    'පිළිබඳව', 'සඳහා', 'මගින්', 'තුළ', 'මත', 'යට', 'එක', 'දෙක', 'තුන', 'හතර', 'පහ',
    'හය', 'හත', 'අට', 'නවය', 'දහය', 'වෙනවා', 'වෙයි', 'වුණා', 'වුනා', 'වෙන්න', 'වන්නේ',
    'තියෙනවා', 'තියෙන්නේ', 'තියෙයි', 'තිබුණා', 'තිබුනා', 'ගන්නවා', 'ගත්තා', 'දෙනවා', 'දුන්නා',
    'බලනවා', 'බැලුවා', 'කනවා', 'කෑවා', 'බොනවා', 'බිව්වා', 'නිදාගන්නවා', 'ආවා', 'ගියා',
    'කියනවා', 'කිව්වා', 'හිතනවා', 'හිතුවා', 'දන්නවා', 'දැනගත්තා', 'ජීවත්', 'ජීවිතය',
    'සතුටු', 'සතුටින්', 'හොඳින්', 'ලස්සන', 'ආදරය', 'ආදරෙයි', 'මිත්‍රයා', 'යහළුවා', 'මිතුරන්',
    'පාසල', 'පාසැල', 'පාසලට', 'විද්‍යාලය', 'විශ්වවිද්‍යාලය', 'පොත', 'පොත්', 'ලියනවා', 'කියවනවා',
    'වැඩ', 'රැකියාව', 'මුදල්', 'වේලාව', 'කාලය', 'පැය', 'මිනිත්තු', 'තත්පර', 'හවස',
    'උදෑසන', 'උදේ', 'රෑ', 'රාත්‍රී', 'රාත්‍රිය', 'සුබපැතුම්', 'සුභපැතුම්'
  ];
  CORE_WORDS.forEach(w => {
    correctSet.add(w);
    incorrectSet.delete(w);
  });

  // User-added custom dictionary words
  const userCustomWords = new Set();
  try {
    const saved = localStorage.getItem('sinhala_user_custom_words');
    if (saved) {
      const list = JSON.parse(saved);
      list.forEach(w => userCustomWords.add(w));
    }
  } catch (e) {}

  // Common Sinhala orthographic / phonetic confusion pairs
  const PHONETIC_PAIRS = [
    ['න', 'ණ'],
    ['ල', 'ළ'],
    ['ස', 'ශ'],
    ['ස', 'ෂ'],
    ['ශ', 'ෂ'],
    ['ක', 'ඛ'],
    ['ග', 'ඝ'],
    ['ට', 'ඨ'],
    ['ඩ', 'ඪ'],
    ['ත', 'ථ'],
    ['ද', 'ධ'],
    ['ප', 'ඵ'],
    ['බ', 'භ'],
    ['ි', 'ී'],
    ['ු', 'ූ'],
    ['ෙ', 'ේ'],
    ['ො', 'ෝ'],
    ['ැ', 'ෑ']
  ];

  // Bucket words by length for fast candidate search
  const lengthBuckets = new Map();
  for (const word of correctSet) {
    const len = word.length;
    if (!lengthBuckets.has(len)) {
      lengthBuckets.set(len, []);
    }
    lengthBuckets.get(len).push(word);
  }

  // Indexed prefix map for sub-millisecond predictive word completion
  const prefixMap = new Map();
  const allPredictWords = [...CORE_WORDS];
  for (const w of userCustomWords) {
    if (!allPredictWords.includes(w)) allPredictWords.push(w);
  }
  for (const w of correctSet) {
    if (!CORE_WORDS.includes(w)) allPredictWords.push(w);
  }

  for (let i = 0; i < allPredictWords.length; i++) {
    const w = allPredictWords[i];
    if (!w) continue;
    const p1 = w.slice(0, 1);
    if (!prefixMap.has(p1)) prefixMap.set(p1, []);
    prefixMap.get(p1).push(w);

    if (w.length >= 2) {
      const p2 = w.slice(0, 2);
      if (!prefixMap.has(p2)) prefixMap.set(p2, []);
      prefixMap.get(p2).push(w);
    }
  }

  // Damerau-Levenshtein edit distance
  function editDistance(a, b, maxLimit) {
    const al = a.length;
    const bl = b.length;
    if (Math.abs(al - bl) > (maxLimit || 2)) return 99;

    const dp = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
    for (let i = 0; i <= al; i++) dp[i][0] = i;
    for (let j = 0; j <= bl; j++) dp[0][j] = j;

    for (let i = 1; i <= al; i++) {
      for (let j = 1; j <= bl; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,       // deletion
          dp[i][j - 1] + 1,       // insertion
          dp[i - 1][j - 1] + cost // substitution
        );
        // Transposition
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
        }
      }
    }
    return dp[al][bl];
  }

  /**
   * Check if word is known either directly or through common Sinhala grammatical inflections
   * @param {string} w
   * @returns {boolean}
   */
  function isKnownWord(w) {
    if (correctSet.has(w) || userCustomWords.has(w)) return true;

    // Check common Sinhala case endings and verb inflections
    const directSuffixes = ['ක්', 'යක්', 'යෙක්', 'ට', 'කට', 'ගෙන්', 'ගෙන්ද', 'ගෙන්වත්', 'ද', 'නම්', 'ලු', 'ය', 'ලා', 'වරු', 'වරුන්', 'වල්', 'මින්', 'මින්ම', 'න්න', 'න්නට', 'න්නද', 'මු', 'මුද', 'වා', 'වේවා'];
    for (let i = 0; i < directSuffixes.length; i++) {
      const suf = directSuffixes[i];
      if (w.endsWith(suf) && w.length > suf.length + 1) {
        const stem = w.slice(0, -suf.length);
        if (correctSet.has(stem) || userCustomWords.has(stem)) return true;
      }
    }

    // -වේ / -වේදී / -වෙන් (e.g. ලංකාව -> ලංකාවේ, ලංකාවෙන්)
    if (w.endsWith('වේදී') && w.length > 5) {
      const stem = w.slice(0, -4) + 'ව';
      if (correctSet.has(stem) || userCustomWords.has(stem)) return true;
    }
    if (w.endsWith('වෙන්') && w.length > 4) {
      const stem = w.slice(0, -3) + 'ව';
      if (correctSet.has(stem) || userCustomWords.has(stem)) return true;
    }
    if (w.endsWith('වේ') && w.length > 3) {
      const stem = w.slice(0, -2) + 'ව';
      if (correctSet.has(stem) || userCustomWords.has(stem)) return true;
    }

    // -යේ / -යේදී / -යෙන් (e.g. සමිතිය -> සමිතියේ)
    if (w.endsWith('යේදී') && w.length > 5) {
      const stem = w.slice(0, -4) + 'ය';
      if (correctSet.has(stem) || userCustomWords.has(stem)) return true;
    }
    if (w.endsWith('යෙන්') && w.length > 4) {
      const stem = w.slice(0, -3) + 'ය';
      if (correctSet.has(stem) || userCustomWords.has(stem)) return true;
    }
    if (w.endsWith('යේ') && w.length > 3) {
      const stem = w.slice(0, -2) + 'ය';
      if (correctSet.has(stem) || userCustomWords.has(stem)) return true;
    }

    // Locative -ේ (U+0DDA), e.g. පාසලේ -> පාසල
    if (w.endsWith('\u0DDA') && w.length > 2) {
      const stem = w.slice(0, -1);
      if (correctSet.has(stem) || userCustomWords.has(stem)) return true;
    }
    // Instrumental -ෙන්
    if (w.endsWith('ෙන්') && w.length > 3) {
      const stem = w.slice(0, -2);
      if (correctSet.has(stem) || userCustomWords.has(stem)) return true;
    }
    // Instrumental -ින්
    if (w.endsWith('ින්') && w.length > 3) {
      const stem = w.slice(0, -2);
      if (correctSet.has(stem) || userCustomWords.has(stem)) return true;
    }

    return false;
  }

  /**
   * Check single word
   * @param {string} word - The word to check
   * @returns {{ isCorrect: boolean, isKnownIncorrect: boolean, suggestions: string[] }}
   */
  function checkWord(word) {
    if (!word || typeof word !== 'string') {
      return { isCorrect: true, isKnownIncorrect: false, suggestions: [] };
    }

    const cleanWord = word.trim();
    if (!cleanWord) {
      return { isCorrect: true, isKnownIncorrect: false, suggestions: [] };
    }

    // Only validate Sinhala text
    const hasSinhala = /[\u0D80-\u0DFF]/.test(cleanWord);
    if (!hasSinhala) {
      return { isCorrect: true, isKnownIncorrect: false, suggestions: [] };
    }

    // 1. Direct match in dictionary, user dictionary, or valid grammatical inflection
    if (isKnownWord(cleanWord)) {
      return { isCorrect: true, isKnownIncorrect: false, suggestions: [] };
    }

    // 2. Known misspelling in dataset
    const isKnownIncorrect = incorrectSet.has(cleanWord);

    // 3. Find suggestions
    const suggestions = getSuggestions(cleanWord, 4);

    return {
      isCorrect: false,
      isKnownIncorrect: isKnownIncorrect,
      suggestions: suggestions
    };
  }

  /**
   * Generate suggestions for misspelled word
   * @param {string} word
   * @param {number} limit
   * @returns {string[]}
   */
  function getSuggestions(word, limit = 4) {
    if (!word) return [];
    const suggestions = [];
    const seen = new Set();

    // Priority 1: Direct precomputed correction from dataset
    if (directCorrections[word]) {
      const direct = directCorrections[word];
      suggestions.push({ word: direct, score: 0.1 });
      seen.add(direct);
    }

    // Priority 2: Direct phonetic substitution checks
    for (const [c1, c2] of PHONETIC_PAIRS) {
      if (word.includes(c1)) {
        const candidate = word.replace(new RegExp(c1, 'g'), c2);
        if (correctSet.has(candidate) && !seen.has(candidate)) {
          suggestions.push({ word: candidate, score: 0.5 });
          seen.add(candidate);
        }
      }
      if (word.includes(c2)) {
        const candidate = word.replace(new RegExp(c2, 'g'), c1);
        if (correctSet.has(candidate) && !seen.has(candidate)) {
          suggestions.push({ word: candidate, score: 0.5 });
          seen.add(candidate);
        }
      }
    }

    // Priority 3: Length-bucketed distance search
    const len = word.length;
    const candidateWords = [];
    for (let offset = -1; offset <= 1; offset++) {
      const bucket = lengthBuckets.get(len + offset);
      if (bucket) {
        for (let i = 0; i < bucket.length; i++) {
          candidateWords.push(bucket[i]);
        }
      }
    }

    for (const cand of candidateWords) {
      if (seen.has(cand)) continue;
      const dist = editDistance(word, cand, 2);
      if (dist <= 2) {
        suggestions.push({ word: cand, score: dist });
        seen.add(cand);
      }
    }

    // Sort by score (lowest distance first), then word length similarity
    suggestions.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      return Math.abs(a.word.length - word.length) - Math.abs(b.word.length - word.length);
    });

    return suggestions.slice(0, limit).map(s => s.word);
  }

  /**
   * Scan and spell-check an entire text passage
   * @param {string} text - The input text
   * @returns {{ totalWords: number, correctCount: number, errorCount: number, errors: Array }}
   */
  function checkText(text) {
    if (!text || typeof text !== 'string') {
      return { totalWords: 0, correctCount: 0, errorCount: 0, errors: [] };
    }

    // Match Sinhala words (sequences of Sinhala characters & combining marks)
    const wordRegex = /[\u0D80-\u0DFF]+/g;
    let match;
    const errors = [];
    let totalWords = 0;
    let correctCount = 0;

    while ((match = wordRegex.exec(text)) !== null) {
      totalWords++;
      const word = match[0];
      const index = match.index;
      const res = checkWord(word);

      if (res.isCorrect) {
        correctCount++;
      } else {
        errors.push({
          word: word,
          index: index,
          length: word.length,
          isKnownIncorrect: res.isKnownIncorrect,
          suggestions: res.suggestions
        });
      }
    }

    return {
      totalWords: totalWords,
      correctCount: correctCount,
      errorCount: errors.length,
      errors: errors
    };
  }

  /**
   * Predict word completions from partial prefix (up to 4 suggestions)
   * @param {string} prefix - The current partially typed Sinhala word
   * @param {number} limit - Maximum number of completions (default 4)
   * @returns {{ prefix: string, fullWord: string, suffix: string, suggestions: Array<{word: string, suffix: string}>, completions: string[] } | null}
   */
  function predictWord(prefix, limit = 4) {
    if (!prefix || typeof prefix !== 'string') return null;
    const clean = prefix.trim();
    if (clean.length < 1) return null;
    if (!/[\u0D80-\u0DFF]/.test(clean)) return null;

    // Search with clean prefix, or strip trailing hal-kirima if needed (e.g. 'ලංක්' -> 'ලංක')
    const candidatesToTry = [clean];
    if (clean.endsWith('්') && clean.length > 1) {
      candidatesToTry.push(clean.slice(0, -1));
    }

    let matches = [];
    const seen = new Set();

    for (const testPrefix of candidatesToTry) {
      const key = testPrefix.length >= 2 ? testPrefix.slice(0, 2) : testPrefix.slice(0, 1);
      const list = prefixMap.get(key) || [];

      for (let i = 0; i < list.length; i++) {
        const w = list[i];
        if (w.startsWith(testPrefix) && w !== clean && !seen.has(w)) {
          matches.push(w);
          seen.add(w);
          if (matches.length >= limit) break;
        }
      }
      if (matches.length >= limit) break;
    }

    if (matches.length === 0) return null;

    const suggestions = matches.slice(0, limit).map(w => {
      let suf = '';
      if (w.startsWith(clean)) {
        suf = w.slice(clean.length);
      } else if (clean.endsWith('්') && w.startsWith(clean.slice(0, -1))) {
        suf = w.slice(clean.length - 1);
      } else {
        suf = w.slice(clean.length);
      }
      return { word: w, suffix: suf };
    });

    return {
      prefix: clean,
      fullWord: suggestions[0].word,
      suffix: suggestions[0].suffix,
      suggestions: suggestions,
      completions: matches.slice(0, limit)
    };
  }

  /**
   * Add a word to user custom dictionary
   * @param {string} word
   */
  function addToDictionary(word) {
    if (!word || typeof word !== 'string') return;
    const clean = word.trim();
    if (clean) {
      userCustomWords.add(clean);
      correctSet.add(clean);
      incorrectSet.delete(clean);

      // Index into prefixMap
      const p1 = clean.slice(0, 1);
      if (!prefixMap.has(p1)) prefixMap.set(p1, []);
      prefixMap.get(p1).unshift(clean);
      if (clean.length >= 2) {
        const p2 = clean.slice(0, 2);
        if (!prefixMap.has(p2)) prefixMap.set(p2, []);
        prefixMap.get(p2).unshift(clean);
      }

      try {
        localStorage.setItem('sinhala_user_custom_words', JSON.stringify([...userCustomWords]));
      } catch (e) {}
    }
  }

  return {
    checkWord: checkWord,
    getSuggestions: getSuggestions,
    checkText: checkText,
    addToDictionary: addToDictionary,
    predictWord: predictWord,
    isLoaded: correctSet.size > 0,
    stats: {
      correctCount: correctSet.size,
      incorrectCount: incorrectSet.size,
      directCorrectionsCount: Object.keys(directCorrections).length,
      userCustomCount: userCustomWords.size
    }
  };
}));
