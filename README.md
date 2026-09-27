# SinhalaUniPro - Real-Time Sinhala Unicode Converter Chrome Extension

<img width="548" height="353" alt="Unicode Sinhala" src="https://github.com/user-attachments/assets/3248415f-3991-4233-866e-f31182debe32" />

A fast, accurate, and modern Chrome Extension (Manifest V3) that converts **Singlish (phonetic English typing) into Sinhala Unicode** in real time, built strictly according to the **University of Colombo School of Computing (UCSC) Language Technology Research Laboratory (LTRL)** standard.

---

## ✨ Features

<img width="548" height="353" alt="Screenshot 2026-09-27 at 3 06 09 PM" src="https://github.com/user-attachments/assets/c990b669-de92-4010-a983-867b90ccf920" />

<img width="548" height="353" alt="Screenshot 2026-09-27 at 3 06 37 PM" src="https://github.com/user-attachments/assets/5962f556-7fc5-4ce8-bcc2-1a82a1af6f03" />

<img width="548" height="353" alt="Screenshot 2026-09-27 at 3 07 04 PM" src="https://github.com/user-attachments/assets/1c51fa83-3bb4-411d-8c86-c7af18a8b690" />


- **🌐 Direct In-Page Active Typing (IME)**: Type directly inside any website's `<input>`, `<textarea>`, or `contenteditable` (Facebook, WhatsApp Web, Gmail, YouTube, Google Docs, etc.) and it converts your Singlish to Sinhala Unicode live on the page!
- **🔄 Mixed Sinhala & English Typing**: Press **`Alt + S`** (or `Option + S` on Mac / `Ctrl + M`) at any time to instantly switch between Sinhala and English typing without losing focus.
- **🏷️ Floating Mode Badge**: Minimal status pill shows `[සි] Sinhala ⌥S` or `[EN] English ⌥S` and lets you click to toggle modes.
- **✨ Sinhala Spell Checker & Suggestions**: Integrated spell checker powered by `sinhala_words_dataset.json` (24,663 correct words, 28,623 known spelling errors, and 9,734 direct phonetic corrections).
  - Highlights misspelled words with wavy red underlines.
  - Generates real-time suggestions using Damerau-Levenshtein distance and Sinhala phonetic confusion pairs (`න/ණ`, `ල/ළ`, `ස/ශ/ෂ`, etc.).
  - Grammatical inflection & suffix awareness (handles case endings `-ට`, `-ගේ`, `-ෙන්`, `-වේ`, `-යේ`, verb forms `-නවා`, `-මින්`, `-න්න`, etc.).
  - 1-click word replacement and **"Fix All"** batch auto-corrector.
  - Personal dictionary (+ Add) to remember your custom terms.
- **🔮 Predictive Word Autocomplete & Ghost Suggestions**: As you type words, smart suggestions appear with predicted completions displayed in subtle gray text. Press **`Tab`** to instantly accept and complete the word across webpage inputs, the extension popup, and the Full Document Studio!
- **⚡ Instant Real-Time Conversion**: Types as fast as you can write with zero lag.
- **🎯 100% UCSC LTRL Standard**: Full fidelity transliteration algorithm preserving all Sinhala vowels, consonants, auxiliaries, Rakaranshaya (`kra` &rarr; `ක්‍ර`), Yanshaya (`dhY` / `dh\y` &rarr; `ධ්‍ය`), Repaya (`R` / `\r` &rarr; `ර්‍`), Gayanukitta (`kru` &rarr; `කෘ`, `kruu` &rarr; `කෲ`), and Anusvaraya (`si\nhala` &rarr; `සිංහල`).
- **📋 One-Click Copy**: Instant clipboard copy with visual feedback, toasts, and keyboard shortcut (`Ctrl+Enter` / `Cmd+Enter`).
- **📖 Interactive Scheme Reference Drawer**: Searchable cheat-sheet modal with categorized tabs (Vowels, Consonants, Auxiliaries). Click any character or combination to insert it immediately.
- **📝 Full Document Studio (`editor.html`)**: Distraction-free, side-by-side full page editor with integrated Spell Checker sidebar, predictive autocompletion, font sizing, draft auto-saving, line/word stats, and text export (`.txt`).
- **🕒 Conversion History**: Keeps recent translations in local storage for quick recall or copy.
- **🌓 Dark & Light Modes**: Beautiful modern themes designed for high contrast and readability.
- **🖱️ Webpage Context Menu**: Select any Singlish text on any webpage, right-click, and choose **"Convert Singlish to Sinhala"** to translate immediately.

---

## 🚀 How to Install in Google Chrome

1. Open Google Chrome.
2. In the address bar, type `chrome://extensions` and press **Enter**.
3. Toggle on **"Developer mode"** in the top-right corner.
4. Click the **"Load unpacked"** button in the top-left corner.
5. Select this folder:
   ```
   ~/Documents/SinhalaUniPro
   ```
6. **SinhalaUniPro** is now installed! Pin it to your Chrome toolbar for 1-click access.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| **`1`**, **`2`**, **`3`**, **`4`** | **Select suggestion 1, 2, 3, or 4 directly by number** |
| **`Tab`** | **Accept and auto-complete top suggestion (#1)** |
| **`Option + S`** (`⌥ + S`) on **Mac**<br>**`Alt + S`** on **Windows/Linux**<br>*(or **`Ctrl + M`** on either)* | **Toggle between Sinhala & English direct typing on any webpage** |
| `Cmd + Shift + S` *(Mac)* / `Ctrl + Shift + S` *(Windows)* | Open SinhalaUniPro Popup |
| `Ctrl + Enter` / `Cmd + Enter` | Copy Sinhala Unicode to clipboard |
| `Ctrl + /` / `Cmd + /` | Toggle Transliteration Scheme drawer |
| `Esc` | Close active drawer or dismiss suggestions |

---

## 📑 UCSC Singlish Quick Reference

### Vowels (ස්වර)
| Sound | Sinhala | Singlish Keystroke |
|---|---|---|
| a | අ | `a` |
| aa | ආ | `aa` or `a)` |
| ae | ඇ | `A` or `\a` |
| aae | ඈ | `Aa`, `A)`, or `ae` |
| i | ඉ | `i` |
| ii | ඊ | `ii`, `i)`, `ee`, or `ie` |
| u | උ | `u` |
| uu | ඌ | `uu`, `u)`, or `oo` |
| e | එ | `e` |
| ee | ඒ | `ea`, `e)`, or `ei` |
| o | ඔ | `o` |
| oo | ඕ | `oe` or `o)` |
| I | ඓ | `I` |
| au | ඖ | `au` |

### Special Auxiliaries & Modifiers (විශේෂ/පිල්ලම්)
| Feature | Sinhala | Keystroke Example |
|---|---|---|
| **Repaya (රේඵය)** | ර්‍ | `R<letter>` or `\r<letter>` (e.g. `dhaRmaya` &rarr; ධර්‍මය) |
| **Yanshaya (යන්ශය)** | ්‍ය | `<letter>Y` or `<letter>\y` (e.g. `vidhYaalaya` &rarr; විද්‍යාලය) |
| **Rakaranshaya (රකmapping)** | ්‍ර | `kr...` (e.g. `kra` &rarr; ක්‍ර, `kri` &rarr; ක්‍රි, `kru` &rarr; ක්‍රූ) |
| **Gayanukitta (ගයනුකිත්ත)** | ෘ | `<letter>ru` (e.g. `kru` &rarr; කෘ) |
| **Diga Gayanukitta** | ෲ | `<letter>ruu` (e.g. `kruu` &rarr; කෲ) |
| **Anusvaraya (බිංදුව)** | ං | `\n` (e.g. `si\nhala` &rarr; සිංහල) |
| **Visargaya (විසර්ගය)** | ඃ | `\h` (e.g. `dhu\hkha` &rarr; දුඃඛ) |
| **Sannaka / Nasal (සඤ්ඤක)** | ඟ, ඬ, ඳ, ඹ | `nng`, `nnd`, `nndh`, `B` |

---

## 🛠️ File Structure

```
SinhalaUniPro/
├── manifest.json       # Chrome Extension Manifest V3 configuration
├── background.js       # Background service worker (context menus & clipboard)
├── content.js          # Direct in-page active typing & IME shortcut listener
├── content.css         # Floating mode badge & styles for active typing
├── converter.js        # High-performance modular UCSC LTRL converter engine
├── scheme_data.js      # Structured UCSC transliteration dataset & lookup
├── dictionary_data.js  # Compiled Sinhala word dictionary & known misspellings dataset
├── spellchecker.js     # Sinhala spell checking engine with phonetic suggestions & inflections
├── popup.html          # Popup interface
├── popup.css           # Modern dark/light glassmorphic UI stylesheet
├── popup.js            # Popup logic, auto-convert, copy, history, spell check drawer
├── editor.html         # Full Document Studio tab for writing articles & long texts
├── editor.css          # Studio styling & split-pane layout
├── editor.js           # Studio controller with integrated Spell Checker sidebar
└── icons/              # Extension icons (master SinhalaUniPro.png, 16px, 32px, 48px, 128px)
```

---

## 📜 Credits & License

Based on the original transliteration scheme developed by the **Language Technology Research Laboratory (LTRL), University of Colombo School of Computing (UCSC)**.
