/**
 * SinhalaUniPro - UCSC LTRL Singlish to Sinhala Unicode Converter Engine
 * Based on University of Colombo School of Computing (UCSC) Language Technology Research Laboratory (LTRL) algorithm
 */

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.SinhalaConverter = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Master definition arrays
  var vowels = [];
  var vowelsUni = [];
  var vowelModifiersUni = [];

  var specialConsonants = [];
  var specialConsonantsUni = [];

  var consonants = [];
  var consonantsUni = [];

  var specialChar = [];
  var specialCharUni = [];

  // Vowels and Vowel Modifiers
  // Long / Multi-character vowels first
  vowelsUni[0] = 'ඌ';    vowels[0] = 'oo';   vowelModifiersUni[0] = 'ූ';
  vowelsUni[1] = 'ඕ';    vowels[1] = 'o\\)'; vowelModifiersUni[1] = 'ෝ';
  vowelsUni[2] = 'ඕ';    vowels[2] = 'oe';   vowelModifiersUni[2] = 'ෝ';
  vowelsUni[3] = 'ආ';    vowels[3] = 'aa';   vowelModifiersUni[3] = 'ා';
  vowelsUni[4] = 'ආ';    vowels[4] = 'a\\)'; vowelModifiersUni[4] = 'ා';
  vowelsUni[5] = 'ඈ';    vowels[5] = 'Aa';   vowelModifiersUni[5] = 'ෑ';
  vowelsUni[6] = 'ඈ';    vowels[6] = 'A\\)'; vowelModifiersUni[6] = 'ෑ';
  vowelsUni[7] = 'ඈ';    vowels[7] = 'ae';   vowelModifiersUni[7] = 'ෑ';
  vowelsUni[8] = 'ඊ';    vowels[8] = 'ii';   vowelModifiersUni[8] = 'ී';
  vowelsUni[9] = 'ඊ';    vowels[9] = 'i\\)'; vowelModifiersUni[9] = 'ී';
  vowelsUni[10] = 'ඊ';   vowels[10] = 'ie';  vowelModifiersUni[10] = 'ී';
  vowelsUni[11] = 'ඊ';   vowels[11] = 'ee';  vowelModifiersUni[11] = 'ී';
  vowelsUni[12] = 'ඒ';   vowels[12] = 'ea';  vowelModifiersUni[12] = 'ේ';
  vowelsUni[13] = 'ඒ';   vowels[13] = 'e\\)'; vowelModifiersUni[13] = 'ේ';
  vowelsUni[14] = 'ඒ';   vowels[14] = 'ei';  vowelModifiersUni[14] = 'ේ';
  vowelsUni[15] = 'ඌ';   vowels[15] = 'uu';  vowelModifiersUni[15] = 'ූ';
  vowelsUni[16] = 'ඌ';   vowels[16] = 'u\\)'; vowelModifiersUni[16] = 'ූ';
  vowelsUni[17] = 'ඖ';   vowels[17] = 'au';  vowelModifiersUni[17] = 'ෞ';
  vowelsUni[18] = 'ඇ';   vowels[18] = '/\\a'; vowelModifiersUni[18] = 'ැ';

  // Short / Single-character vowels
  vowelsUni[19] = 'අ';   vowels[19] = 'a';   vowelModifiersUni[19] = '';
  vowelsUni[20] = 'ඇ';   vowels[20] = 'A';   vowelModifiersUni[20] = 'ැ';
  vowelsUni[21] = 'ඉ';   vowels[21] = 'i';   vowelModifiersUni[21] = 'ි';
  vowelsUni[22] = 'එ';   vowels[22] = 'e';   vowelModifiersUni[22] = 'ෙ';
  vowelsUni[23] = 'උ';   vowels[23] = 'u';   vowelModifiersUni[23] = 'ු';
  vowelsUni[24] = 'ඔ';   vowels[24] = 'o';   vowelModifiersUni[24] = 'ො';
  vowelsUni[25] = 'ඓ';   vowels[25] = 'I';   vowelModifiersUni[25] = 'ෛ';

  var nVowels = 26;

  // Special Consonants / Modifiers
  specialConsonantsUni[0] = 'ං'; specialConsonants[0] = /\\n/g;
  specialConsonantsUni[1] = 'ඃ'; specialConsonants[1] = /\\h/g;
  specialConsonantsUni[2] = 'ඞ'; specialConsonants[2] = /\\N/g;
  specialConsonantsUni[3] = 'ඍ'; specialConsonants[3] = /\\R/g;
  // Special character Repaya (ර් + ZWJ)
  specialConsonantsUni[4] = 'ර්\u200D'; specialConsonants[4] = /R/g;
  specialConsonantsUni[5] = 'ර්\u200D'; specialConsonants[5] = /\\r/g;

  // Consonants - Multi-letter first to match greedily
  consonantsUni[0] = 'ඬ'; consonants[0] = 'nnd';
  consonantsUni[1] = 'ඳ'; consonants[1] = 'nndh';
  consonantsUni[2] = 'ඟ'; consonants[2] = 'nng';
  consonantsUni[3] = 'ථ'; consonants[3] = 'Th';
  consonantsUni[4] = 'ධ'; consonants[4] = 'Dh';
  consonantsUni[5] = 'ඝ'; consonants[5] = 'gh';
  consonantsUni[6] = 'ඡ'; consonants[6] = 'Ch';
  consonantsUni[7] = 'ඵ'; consonants[7] = 'ph';
  consonantsUni[8] = 'භ'; consonants[8] = 'bh';
  consonantsUni[9] = 'ශ'; consonants[9] = 'sh';
  consonantsUni[10] = 'ෂ'; consonants[10] = 'Sh';
  consonantsUni[11] = 'ඥ'; consonants[11] = 'GN';
  consonantsUni[12] = 'ඤ'; consonants[12] = 'KN';
  consonantsUni[13] = 'ළු'; consonants[13] = 'Lu';
  consonantsUni[14] = 'ද'; consonants[14] = 'dh';
  consonantsUni[15] = 'ච'; consonants[15] = 'ch';
  consonantsUni[16] = 'ඛ'; consonants[16] = 'kh';
  consonantsUni[17] = 'ත'; consonants[17] = 'th';

  consonantsUni[18] = 'ට'; consonants[18] = 't';
  consonantsUni[19] = 'ක'; consonants[19] = 'k';
  consonantsUni[20] = 'ඩ'; consonants[20] = 'd';
  consonantsUni[21] = 'න'; consonants[21] = 'n';
  consonantsUni[22] = 'ප'; consonants[22] = 'p';
  consonantsUni[23] = 'බ'; consonants[23] = 'b';
  consonantsUni[24] = 'ම'; consonants[24] = 'm';
  // Yanshaya (\y or Y)
  consonantsUni[25] = '\u200Dය'; consonants[25] = '\\\\y';
  consonantsUni[26] = '\u200Dය'; consonants[26] = 'Y';
  consonantsUni[27] = 'ය'; consonants[27] = 'y';
  consonantsUni[28] = 'ජ'; consonants[28] = 'j';
  consonantsUni[29] = 'ල'; consonants[29] = 'l';
  consonantsUni[30] = 'ව'; consonants[30] = 'v';
  consonantsUni[31] = 'ව'; consonants[31] = 'w';
  consonantsUni[32] = 'ස'; consonants[32] = 's';
  consonantsUni[33] = 'හ'; consonants[33] = 'h';
  consonantsUni[34] = 'ණ'; consonants[34] = 'N';
  consonantsUni[35] = 'ළ'; consonants[35] = 'L';
  consonantsUni[36] = 'ඛ'; consonants[36] = 'K';
  consonantsUni[37] = 'ඝ'; consonants[37] = 'G';
  consonantsUni[38] = 'ඨ'; consonants[38] = 'T';
  consonantsUni[39] = 'ඪ'; consonants[39] = 'D';
  consonantsUni[40] = 'ඵ'; consonants[40] = 'P';
  consonantsUni[41] = 'ඹ'; consonants[41] = 'B';
  consonantsUni[42] = 'ෆ'; consonants[42] = 'f';
  consonantsUni[43] = 'ඣ'; consonants[43] = 'q';
  consonantsUni[44] = 'ග'; consonants[44] = 'g';
  // Last because we omit this in dealing with Rakaransha
  consonantsUni[45] = 'ර'; consonants[45] = 'r';

  // Special characters: Gayanukitta
  specialCharUni[0] = 'ෲ'; specialChar[0] = 'ruu';
  specialCharUni[1] = 'ෘ'; specialChar[1] = 'ru';

  /**
   * Pre-compile regexes for optimal real-time performance
   */
  var precompiledSpecialChar = [];
  for (var i = 0; i < specialCharUni.length; i++) {
    for (var j = 0; j < consonants.length; j++) {
      var s = consonants[j] + specialChar[i];
      var v = consonantsUni[j] + specialCharUni[i];
      precompiledSpecialChar.push({ regex: new RegExp(s, 'g'), rep: v });
    }
  }

  // Rakaransha + vowels (excluding 'r' consonant itself at index 45)
  var precompiledRakaransha = [];
  for (var j = 0; j < consonants.length - 1; j++) {
    for (var i = 0; i < vowels.length; i++) {
      var s = consonants[j] + 'r' + vowels[i];
      var v = consonantsUni[j] + '්‍ර' + vowelModifiersUni[i];
      precompiledRakaransha.push({ regex: new RegExp(s, 'g'), rep: v });
    }
    var s2 = consonants[j] + 'r';
    var v2 = consonantsUni[j] + '්‍ර';
    precompiledRakaransha.push({ regex: new RegExp(s2, 'g'), rep: v2 });
  }

  // Consonants + vowel modifiers
  var precompiledConsonantsVowels = [];
  for (var i = 0; i < consonants.length; i++) {
    for (var j = 0; j < nVowels; j++) {
      var s = consonants[i] + vowels[j];
      var v = consonantsUni[i] + vowelModifiersUni[j];
      precompiledConsonantsVowels.push({ regex: new RegExp(s, 'g'), rep: v });
    }
  }

  // Consonants + HAL (්)
  var precompiledHal = [];
  for (var i = 0; i < consonants.length; i++) {
    precompiledHal.push({
      regex: new RegExp(consonants[i], 'g'),
      rep: consonantsUni[i] + '්'
    });
  }

  // Standalone vowels
  var precompiledVowels = [];
  for (var i = 0; i < vowels.length; i++) {
    precompiledVowels.push({
      regex: new RegExp(vowels[i], 'g'),
      rep: vowelsUni[i]
    });
  }

  /**
   * Main conversion function
   * @param {string} input - Singlish input text
   * @returns {string} Sinhala Unicode text
   */
  function convert(input) {
    if (!input) return '';
    var text = input;

    // 1. Special consonants (\n -> ං, \h -> ඃ, \N -> ඞ, \R -> ඍ, R -> ර්‍, \r -> ර්‍)
    for (var i = 0; i < specialConsonants.length; i++) {
      text = text.replace(specialConsonants[i], specialConsonantsUni[i]);
    }

    // 2. Consonants + special characters (ru, ruu)
    for (var i = 0; i < precompiledSpecialChar.length; i++) {
      text = text.replace(precompiledSpecialChar[i].regex, precompiledSpecialChar[i].rep);
    }

    // 3. Consonants + Rakaransha + vowels
    for (var i = 0; i < precompiledRakaransha.length; i++) {
      text = text.replace(precompiledRakaransha[i].regex, precompiledRakaransha[i].rep);
    }

    // 4. Consonants + vowel modifiers
    for (var i = 0; i < precompiledConsonantsVowels.length; i++) {
      text = text.replace(precompiledConsonantsVowels[i].regex, precompiledConsonantsVowels[i].rep);
    }

    // 5. Remaining bare consonants + HAL (virama)
    for (var i = 0; i < precompiledHal.length; i++) {
      text = text.replace(precompiledHal[i].regex, precompiledHal[i].rep);
    }

    // 6. Remaining standalone vowels
    for (var i = 0; i < precompiledVowels.length; i++) {
      text = text.replace(precompiledVowels[i].regex, precompiledVowels[i].rep);
    }

    return text;
  }

  return {
    convert: convert,
    data: {
      vowels: vowels,
      vowelsUni: vowelsUni,
      vowelModifiersUni: vowelModifiersUni,
      consonants: consonants,
      consonantsUni: consonantsUni,
      specialConsonants: specialConsonants,
      specialConsonantsUni: specialConsonantsUni,
      specialChar: specialChar,
      specialCharUni: specialCharUni
    }
  };
}));
