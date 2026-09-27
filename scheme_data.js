/**
 * SinhalaUniPro - UCSC Transliteration Scheme Reference Data
 */

const SCHEME_DATA = {
  vowels: [
    { type: 'short', char: 'අ', key: 'a', desc: 'Short vowel' },
    { type: 'long', char: 'ආ', key: 'aa / a)', desc: 'Long vowel' },
    { type: 'short', char: 'ඇ', key: 'A / \\a', desc: 'Aeda pilla' },
    { type: 'long', char: 'ඈ', key: 'Aa / A) / ae', desc: 'Diga aeda pilla' },
    { type: 'short', char: 'ඉ', key: 'i', desc: 'Ispilla' },
    { type: 'long', char: 'ඊ', key: 'ii / i) / ee / ie', desc: 'Diga ispilla' },
    { type: 'short', char: 'උ', key: 'u', desc: 'Papilla' },
    { type: 'long', char: 'ඌ', key: 'uu / u) / oo', desc: 'Diga papilla' },
    { type: 'short', char: 'එ', key: 'e', desc: 'Kombuva' },
    { type: 'long', char: 'ඒ', key: 'ea / e) / ei', desc: 'Diga kombuva' },
    { type: 'short', char: 'ඔ', key: 'o', desc: 'Kombuva + aela pilla' },
    { type: 'long', char: 'ඕ', key: 'oe / o)', desc: 'Diga kombuva + aela pilla' },
    { type: 'diphthong', char: 'ඓ', key: 'I', desc: 'Kombu deka' },
    { type: 'diphthong', char: 'ඖ', key: 'au', desc: 'Kombu gayanukitta' }
  ],
  consonants: [
    { group: 'Common', char: 'ක', key: 'k' },
    { group: 'Common', char: 'ග', key: 'g' },
    { group: 'Common', char: 'ච', key: 'ch' },
    { group: 'Common', char: 'ජ', key: 'j' },
    { group: 'Common', char: 'ට', key: 't' },
    { group: 'Common', char: 'ඩ', key: 'd' },
    { group: 'Common', char: 'ත', key: 'th' },
    { group: 'Common', char: 'ද', key: 'dh' },
    { group: 'Common', char: 'න', key: 'n' },
    { group: 'Common', char: 'ප', key: 'p' },
    { group: 'Common', char: 'බ', key: 'b' },
    { group: 'Common', char: 'ම', key: 'm' },
    { group: 'Common', char: 'ය', key: 'y' },
    { group: 'Common', char: 'ර', key: 'r' },
    { group: 'Common', char: 'ල', key: 'l' },
    { group: 'Common', char: 'ව', key: 'v / w' },
    { group: 'Common', char: 'ස', key: 's' },
    { group: 'Common', char: 'හ', key: 'h' },

    { group: 'Aspirated (මහාප්‍රාණ)', char: 'ඛ', key: 'kh / K' },
    { group: 'Aspirated (මහාප්‍රාණ)', char: 'ඝ', key: 'gh / G' },
    { group: 'Aspirated (මහාප්‍රාණ)', char: 'ඡ', key: 'Ch' },
    { group: 'Aspirated (මහාප්‍රාණ)', char: 'ඨ', key: 'T' },
    { group: 'Aspirated (මහාප්‍රාණ)', char: 'ඪ', key: 'D' },
    { group: 'Aspirated (මහාප්‍රාණ)', char: 'ථ', key: 'Th' },
    { group: 'Aspirated (මහාප්‍රාණ)', char: 'ධ', key: 'Dh' },
    { group: 'Aspirated (මහාප්‍රාණ)', char: 'ඵ', key: 'ph / P' },
    { group: 'Aspirated (මහාප්‍රාණ)', char: 'භ', key: 'bh' },
    { group: 'Aspirated (මහාප්‍රාණ)', char: 'ශ', key: 'sh' },
    { group: 'Aspirated (මහාප්‍රාණ)', char: 'ෂ', key: 'Sh' },

    { group: 'Nasal / Sannaka (සඤ්ඤක)', char: 'ඟ', key: 'nng' },
    { group: 'Nasal / Sannaka (සඤ්ඤක)', char: 'ඬ', key: 'nnd' },
    { group: 'Nasal / Sannaka (සඤ්ඤක)', char: 'ඳ', key: 'nndh' },
    { group: 'Nasal / Sannaka (සඤ්ඤක)', char: 'ඹ', key: 'B' },

    { group: 'Murdhaja / Other (මූර්ද්ධජ)', char: 'ණ', key: 'N' },
    { group: 'Murdhaja / Other (මූර්ද්ධජ)', char: 'ළ', key: 'L' },
    { group: 'Murdhaja / Other (මූර්ද්ධජ)', char: 'ළු', key: 'Lu' },
    { group: 'Murdhaja / Other (මූර්ද්ධජ)', char: 'ඥ', key: 'GN' },
    { group: 'Murdhaja / Other (මූර්ද්ධජ)', char: 'ඤ', key: 'KN' },
    { group: 'Murdhaja / Other (මූර්ද්ධජ)', char: 'ෆ', key: 'f' },
    { group: 'Murdhaja / Other (මූර්ද්ධජ)', char: 'ඣ', key: 'q' }
  ],
  specials: [
    { char: 'ර්‍', name: 'Repaya (රේඵය)', key: 'R / \\r', example: 'dhaRmaya / dha\\rmaya -> ධර්‍මය' },
    { char: '්‍ය', name: 'Yanshaya (යන්ශය)', key: 'Y / \\y', example: 'vidhYaalaya / vidh\\yaalaya -> විද්‍යාලය' },
    { char: '්‍ර', name: 'Rakaranshaya (රකmapping)', key: 'kr...', example: 'kra -> ක්‍ර, kri -> ක්‍රි, kru -> ක්‍රූ' },
    { char: 'ෘ', name: 'Gayanukitta (ගයනුකිත්ත)', key: 'ru', example: 'kru -> කෘ' },
    { char: 'ෲ', name: 'Diga Gayanukitta (දිග ගයනුකිත්ත)', key: 'ruu', example: 'kruu -> කෲ' },
    { char: 'ං', name: 'Anusvaraya (අනුස්වාරය / බිංදුව)', key: '\\n', example: 'si\\nhala -> සිංහල' },
    { char: 'ඃ', name: 'Visargaya (විසර්ගය)', key: '\\h', example: 'dhu\\hkha -> දුඃඛ' },
    { char: 'ඞ', name: 'Kanta-ja Nasal', key: '\\N', example: '\\N -> ඞ' },
    { char: 'ඍ', name: 'Iru-yanna', key: '\\R', example: '\\R -> ඍ' }
  ]
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SCHEME_DATA;
}
