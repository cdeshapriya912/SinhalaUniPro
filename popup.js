/**
 * SinhalaUniPro - Popup Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Elements
  const singlishInput = document.getElementById('singlish-input');
  const sinhalaOutput = document.getElementById('sinhala-output');
  const inputStats = document.getElementById('input-stats');
  const outputStats = document.getElementById('output-stats');
  const copyBtn = document.getElementById('btn-copy');
  const copyBtnText = document.getElementById('copy-btn-text');
  const clearBtn = document.getElementById('btn-clear');
  const sampleBtn = document.getElementById('btn-sample');
  const downloadBtn = document.getElementById('btn-download');
  const openEditorBtn = document.getElementById('btn-open-editor');
  
  // Theme elements
  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  const themeIconSun = document.getElementById('theme-icon-sun');
  const themeIconMoon = document.getElementById('theme-icon-moon');
  
  // Drawers
  const schemeToggleBtn = document.getElementById('btn-scheme-toggle');
  const schemeDrawer = document.getElementById('scheme-drawer');
  const closeSchemeBtn = document.getElementById('btn-close-scheme');
  const schemeSearch = document.getElementById('scheme-search');
  const schemeTabs = document.querySelectorAll('.tab-btn');
  const schemeContent = document.getElementById('scheme-content');

  const historyToggleBtn = document.getElementById('btn-history-toggle');
  const historyDrawer = document.getElementById('history-drawer');
  const closeHistoryBtn = document.getElementById('btn-close-history');
  const clearHistoryBtn = document.getElementById('btn-clear-history');
  const historyContent = document.getElementById('history-content');

  // Spell Check Elements
  const spellToggleBtn = document.getElementById('btn-spell-toggle');
  const headerSpellLabel = document.getElementById('header-spell-label');
  const spellStatusBar = document.getElementById('spell-status-bar');
  const spellStatusText = document.getElementById('spell-status-text');
  const spellViewBtn = document.getElementById('btn-spell-view');
  const spellDrawer = document.getElementById('spell-drawer');
  const closeSpellBtn = document.getElementById('btn-close-spell');
  const autoFixAllBtn = document.getElementById('btn-auto-fix-all');
  const spellStatsSummary = document.getElementById('spell-stats-summary');
  const spellContent = document.getElementById('spell-content');

  const predictionBox = document.getElementById('prediction-box');
  const predItemsContainer = document.getElementById('pred-items-container');
  let currentPredictions = null;
  
  const toast = document.getElementById('toast');

  let activeTab = 'all';
  let historyDebounceTimer = null;
  let lastSpellResults = null;

  // Initialize theme from storage
  const initTheme = () => {
    const savedTheme = localStorage.getItem('sinhala_uni_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
  };

  const updateThemeIcon = (theme) => {
    if (theme === 'dark') {
      themeIconSun.classList.remove('hidden');
      themeIconMoon.classList.add('hidden');
    } else {
      themeIconSun.classList.add('hidden');
      themeIconMoon.classList.remove('hidden');
    }
  };

  themeToggleBtn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sinhala_uni_theme', next);
    updateThemeIcon(next);
  });

  initTheme();

  // Storage helper for Chrome Extension & standard browser fallback
  const getStorage = async (key) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const res = await chrome.storage.local.get(key);
      return res[key];
    }
    const val = localStorage.getItem(key);
    try { return JSON.parse(val); } catch { return val; }
  };

  const setStorage = async (key, val) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      await chrome.storage.local.set({ [key]: val });
    } else {
      localStorage.setItem(key, JSON.stringify(val));
    }
  };

  // Inline typing mode controls
  const toggleInlineCheckbox = document.getElementById('toggle-inline-typing');
  const inlineDot = document.getElementById('inline-dot');
  const inlineStatusText = document.getElementById('inline-status-text');

  const isMac = (typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform || navigator.userAgent));
  const shortcutHint = isMac ? '⌥S (Option+S)' : 'Alt+S';

  const updateInlineUI = (enabled, isSinhala) => {
    if (toggleInlineCheckbox) toggleInlineCheckbox.checked = enabled;
    if (!enabled) {
      inlineDot.classList.remove('active');
      inlineStatusText.textContent = `Disabled (${shortcutHint} to enable)`;
      inlineStatusText.style.color = 'var(--text-muted)';
    } else if (isSinhala) {
      inlineDot.classList.add('active');
      inlineStatusText.textContent = `Sinhala Mode (${shortcutHint})`;
      inlineStatusText.style.color = '#38bdf8';
    } else {
      inlineDot.classList.remove('active');
      inlineStatusText.textContent = `English Mode (${shortcutHint})`;
      inlineStatusText.style.color = '#f59e0b';
    }
  };

  // Load initial inline state
  const inlineEnabled = (await getStorage('inlineEnabled')) !== false;
  const isSinhalaMode = (await getStorage('isSinhalaMode')) !== false;
  updateInlineUI(inlineEnabled, isSinhalaMode);

  if (toggleInlineCheckbox) {
    toggleInlineCheckbox.addEventListener('change', async () => {
      const enabled = toggleInlineCheckbox.checked;
      await setStorage('inlineEnabled', enabled);
      await setStorage('isSinhalaMode', enabled);
      updateInlineUI(enabled, enabled);

      // Notify active tab
      if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0] && tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {
              action: 'set-inline-state',
              enabled: enabled,
              isSinhalaMode: enabled
            }).catch(() => {});
          }
        });
      }
    });
  }

  // Check if there was selected text converted from context menu
  const lastSelection = await getStorage('lastSelectionConverted');
  if (lastSelection && (Date.now() - lastSelection.timestamp < 15000)) {
    singlishInput.value = lastSelection.original;
    sinhalaOutput.value = lastSelection.converted;
    updateStats();
  }

  // Live Conversion
  const doConvert = () => {
    const raw = singlishInput.value;
    const unicode = SinhalaConverter.convert(raw);
    sinhalaOutput.value = unicode;
    updateStats();

    // Word Prediction Autocomplete
    updatePrediction(unicode);

    // Live Spell Check
    runLiveSpellCheck(unicode);

    // Debounced history save
    clearTimeout(historyDebounceTimer);
    if (raw.trim().length > 3) {
      historyDebounceTimer = setTimeout(() => {
        saveToHistory(raw.trim(), unicode.trim());
      }, 1500);
    }
  };

  const updatePrediction = (unicodeText) => {
    if (typeof SinhalaSpellChecker === 'undefined' || !SinhalaSpellChecker.predictWord || !unicodeText) {
      hidePrediction();
      return;
    }

    // Do not show prediction if trailing whitespace
    if (/\s$/.test(unicodeText)) {
      hidePrediction();
      return;
    }

    const words = unicodeText.trim().split(/\s+/);
    const lastWord = words.length > 0 ? words[words.length - 1] : '';
    if (!lastWord || lastWord.length < 1) {
      hidePrediction();
      return;
    }

    const pred = SinhalaSpellChecker.predictWord(lastWord, 4);
    if (pred && pred.suggestions && pred.suggestions.length > 0) {
      currentPredictions = pred;
      predItemsContainer.innerHTML = pred.suggestions.map((item, idx) => `
        <div class="pred-item ${idx === 0 ? 'pred-active' : ''}" data-idx="${idx}" title="Press ${idx + 1} or click to insert">
          <span class="pred-num">${idx + 1}</span>
          <span class="pred-word"><span class="pred-prefix">${pred.prefix}</span><span class="pred-suffix">${item.suffix}</span></span>
        </div>
      `).join('');

      predItemsContainer.querySelectorAll('.pred-item').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-idx'), 10);
          acceptPrediction(idx);
        });
      });

      predictionBox.classList.remove('hidden');
    } else {
      hidePrediction();
    }
  };

  const hidePrediction = () => {
    currentPredictions = null;
    if (predictionBox) predictionBox.classList.add('hidden');
  };

  const acceptPrediction = (idx = 0) => {
    if (!currentPredictions || !currentPredictions.suggestions || !currentPredictions.suggestions[idx]) return;
    const targetWord = currentPredictions.suggestions[idx].word;

    // Update Sinhala Output
    const outVal = sinhalaOutput.value;
    const words = outVal.trim().split(/\s+/);
    if (words.length > 0) {
      words[words.length - 1] = targetWord;
      sinhalaOutput.value = words.join(' ') + ' ';
    }

    // Update Singlish Input
    const inVal = singlishInput.value;
    const inWords = inVal.trim().split(/\s+/);
    if (inWords.length > 0) {
      inWords[inWords.length - 1] = targetWord;
      singlishInput.value = inWords.join(' ') + ' ';
    }

    updateStats();
    runLiveSpellCheck(sinhalaOutput.value);
    hidePrediction();
    singlishInput.focus();
  };

  const handleKeydownPrediction = (e) => {
    if (currentPredictions && currentPredictions.suggestions) {
      // Check 1-4 selection
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < currentPredictions.suggestions.length) {
          e.preventDefault();
          acceptPrediction(idx);
          return true;
        }
      }
      // Check Tab selection (item 1)
      if (e.key === 'Tab') {
        e.preventDefault();
        acceptPrediction(0);
        return true;
      }
      // Check Escape to dismiss
      if (e.key === 'Escape') {
        hidePrediction();
        return true;
      }
    }
    return false;
  };

  singlishInput.addEventListener('keydown', handleKeydownPrediction);
  sinhalaOutput.addEventListener('keydown', handleKeydownPrediction);

  const runLiveSpellCheck = (text) => {
    if (typeof SinhalaSpellChecker === 'undefined' || !text || !text.trim()) {
      if (spellStatusBar) spellStatusBar.classList.add('hidden');
      if (headerSpellLabel) {
        headerSpellLabel.textContent = 'Spell Check';
        headerSpellLabel.style.color = '';
      }
      lastSpellResults = null;
      return;
    }

    const res = SinhalaSpellChecker.checkText(text);
    lastSpellResults = res;

    if (res.errorCount > 0) {
      spellStatusBar.classList.remove('hidden');
      spellStatusText.textContent = `${res.errorCount} spelling suggestion${res.errorCount > 1 ? 's' : ''} available`;
      headerSpellLabel.textContent = `Spell (${res.errorCount})`;
      headerSpellLabel.style.color = '#f87171';
    } else {
      spellStatusBar.classList.add('hidden');
      headerSpellLabel.textContent = 'Spell Check';
      headerSpellLabel.style.color = '';
    }
  };

  const updateStats = () => {
    const inVal = singlishInput.value;
    const outVal = sinhalaOutput.value;
    
    const inChars = inVal.length;
    const inWords = inVal.trim() ? inVal.trim().split(/\s+/).length : 0;
    inputStats.textContent = `${inChars} chars • ${inWords} words`;

    const outChars = outVal.length;
    outputStats.textContent = `${outChars} Sinhala characters`;
  };

  singlishInput.addEventListener('input', doConvert);
  singlishInput.addEventListener('keyup', doConvert);
  singlishInput.addEventListener('paste', () => setTimeout(doConvert, 10));

  // Copy with animation
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 2200);
  };

  const copyUnicode = async () => {
    const text = sinhalaOutput.value;
    if (!text) {
      showToast('Nothing to copy!');
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      copyBtnText.textContent = 'Copied!';
      copyBtn.style.background = 'var(--success)';
      showToast('Copied Sinhala text to clipboard!');
      setTimeout(() => {
        copyBtnText.textContent = 'Copy Unicode';
        copyBtn.style.background = '';
      }, 1600);
    } catch (err) {
      // Fallback
      sinhalaOutput.select();
      document.execCommand('copy');
      showToast('Copied to clipboard!');
    }
  };

  copyBtn.addEventListener('click', copyUnicode);

  // Clear
  clearBtn.addEventListener('click', () => {
    singlishInput.value = '';
    sinhalaOutput.value = '';
    updateStats();
    singlishInput.focus();
  });

  // Sample texts
  const samples = [
    'aayubowan! oba sathutin sitinavaa kiyala hithanavaa.',
    'shrii lankaava apey maathrubhuumiya vee.',
    'subha nava vasarak veevaa!',
    'mama heta udheeta colombo yanavaa.'
  ];
  let sampleIndex = 0;
  sampleBtn.addEventListener('click', () => {
    singlishInput.value = samples[sampleIndex % samples.length];
    sampleIndex++;
    doConvert();
    singlishInput.focus();
  });

  // Quick keystroke hints
  document.querySelectorAll('.hint-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const ins = tag.getAttribute('data-insert');
      insertAtCursor(singlishInput, (singlishInput.value ? ' ' : '') + ins);
      doConvert();
      singlishInput.focus();
    });
  });

  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    textarea.value = val.substring(0, start) + text + val.substring(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
  }

  // Download .txt
  downloadBtn.addEventListener('click', () => {
    const content = sinhalaOutput.value;
    if (!content) {
      showToast('Nothing to download!');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sinhala-unipro-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('File downloaded!');
  });

  // Open Full Editor
  openEditorBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('editor.html') });
    } else {
      window.open('editor.html', '_blank');
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Ctrl+Enter or Cmd+Enter to copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      copyUnicode();
    }
    // Ctrl+/ or Cmd+/ to toggle scheme
    if ((e.ctrlKey || e.metaKey) && e.key === '/') {
      e.preventDefault();
      toggleSchemeDrawer();
    }
    // Escape to close drawers
    if (e.key === 'Escape') {
      if (!schemeDrawer.classList.contains('hidden')) {
        schemeDrawer.classList.add('hidden');
      } else if (!historyDrawer.classList.contains('hidden')) {
        historyDrawer.classList.add('hidden');
      } else if (!spellDrawer.classList.contains('hidden')) {
        spellDrawer.classList.add('hidden');
      }
    }
  });

  // Spell Check Drawer Logic
  const toggleSpellDrawer = () => {
    historyDrawer.classList.add('hidden');
    schemeDrawer.classList.add('hidden');
    spellDrawer.classList.toggle('hidden');
    if (!spellDrawer.classList.contains('hidden')) {
      renderSpellCheck();
    }
  };

  spellToggleBtn.addEventListener('click', toggleSpellDrawer);
  spellViewBtn.addEventListener('click', toggleSpellDrawer);
  closeSpellBtn.addEventListener('click', () => spellDrawer.classList.add('hidden'));

  const renderSpellCheck = () => {
    const text = sinhalaOutput.value;
    if (typeof SinhalaSpellChecker === 'undefined') {
      spellStatsSummary.textContent = 'Spell checker loading...';
      return;
    }

    const res = SinhalaSpellChecker.checkText(text);
    lastSpellResults = res;

    if (!text.trim()) {
      spellStatsSummary.textContent = 'Enter text to check spelling.';
      spellContent.innerHTML = '<div class="empty-state">No text to spell check yet. Type some Singlish above!</div>';
      return;
    }

    spellStatsSummary.textContent = `Scanned ${res.totalWords} words • ${res.errorCount} spelling issue${res.errorCount === 1 ? '' : 's'} identified`;

    if (res.errorCount === 0) {
      spellContent.innerHTML = `
        <div class="spell-clean-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div>All words are correctly spelled!</div>
        </div>
      `;
      return;
    }

    spellContent.innerHTML = `
      <div class="spell-list">
        ${res.errors.map((err, idx) => `
          <div class="spell-item" data-idx="${idx}">
            <div class="spell-item-header">
              <span class="spell-error-word">${escapeHtml(err.word)}</span>
              ${err.isKnownIncorrect ? '<span class="spell-badge-known">Known Error</span>' : ''}
            </div>
            <div class="spell-suggestions">
              <span style="font-size: 11px; color: var(--text-muted);">Suggestions:</span>
              ${err.suggestions.length > 0
                ? err.suggestions.map(s => `<button class="suggestion-chip" data-orig="${escapeHtml(err.word)}" data-repl="${escapeHtml(s)}">${escapeHtml(s)}</button>`).join('')
                : '<span style="font-size: 11px; color: var(--text-muted);">No automatic suggestions</span>'
              }
              <button class="text-btn btn-add-dict" data-word="${escapeHtml(err.word)}" title="Add to your personal dictionary">+ Add</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Click chip to replace
    spellContent.querySelectorAll('.suggestion-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const orig = btn.getAttribute('data-orig');
        const repl = btn.getAttribute('data-repl');
        replaceWordInOutput(orig, repl);
        renderSpellCheck();
        showToast(`Replaced "${orig}" with "${repl}"`);
      });
    });

    // Add to dictionary
    spellContent.querySelectorAll('.btn-add-dict').forEach(btn => {
      btn.addEventListener('click', () => {
        const word = btn.getAttribute('data-word');
        SinhalaSpellChecker.addToDictionary(word);
        renderSpellCheck();
        showToast(`Added "${word}" to dictionary`);
      });
    });
  };

  const replaceWordInOutput = (orig, repl) => {
    const val = sinhalaOutput.value;
    const regex = new RegExp(orig, 'g');
    sinhalaOutput.value = val.replace(regex, repl);
    updateStats();
    runLiveSpellCheck(sinhalaOutput.value);
  };

  autoFixAllBtn.addEventListener('click', () => {
    if (!lastSpellResults || lastSpellResults.errorCount === 0) {
      showToast('No errors to fix!');
      return;
    }
    let fixed = 0;
    let currentVal = sinhalaOutput.value;
    lastSpellResults.errors.forEach(err => {
      if (err.suggestions && err.suggestions.length > 0) {
        const top = err.suggestions[0];
        currentVal = currentVal.replace(new RegExp(err.word, 'g'), top);
        fixed++;
      }
    });
    sinhalaOutput.value = currentVal;
    updateStats();
    renderSpellCheck();
    showToast(`Fixed ${fixed} word${fixed === 1 ? '' : 's'}!`);
  });

  // Scheme Drawer Logic
  const toggleSchemeDrawer = () => {
    historyDrawer.classList.add('hidden');
    spellDrawer.classList.add('hidden');
    schemeDrawer.classList.toggle('hidden');
    if (!schemeDrawer.classList.contains('hidden')) {
      schemeSearch.focus();
      renderScheme();
    }
  };

  schemeToggleBtn.addEventListener('click', toggleSchemeDrawer);
  closeSchemeBtn.addEventListener('click', () => schemeDrawer.classList.add('hidden'));

  schemeTabs.forEach(btn => {
    btn.addEventListener('click', () => {
      schemeTabs.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTab = btn.getAttribute('data-tab');
      renderScheme();
    });
  });

  schemeSearch.addEventListener('input', () => renderScheme());

  const renderScheme = () => {
    const query = schemeSearch.value.toLowerCase().trim();
    let items = [];

    if (activeTab === 'all' || activeTab === 'vowels') {
      items = items.concat(SCHEME_DATA.vowels.map(v => ({ ...v, cat: 'Vowels' })));
    }
    if (activeTab === 'all' || activeTab === 'consonants') {
      items = items.concat(SCHEME_DATA.consonants.map(c => ({ ...c, cat: c.group })));
    }
    if (activeTab === 'all' || activeTab === 'specials') {
      items = items.concat(SCHEME_DATA.specials.map(s => ({ ...s, cat: 'Auxiliaries' })));
    }

    if (query) {
      items = items.filter(item => 
        (item.char && item.char.toLowerCase().includes(query)) ||
        (item.key && item.key.toLowerCase().includes(query)) ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.desc && item.desc.toLowerCase().includes(query))
      );
    }

    if (items.length === 0) {
      schemeContent.innerHTML = '<div class="empty-state">No matching characters found</div>';
      return;
    }

    schemeContent.innerHTML = `
      <div class="scheme-grid">
        ${items.map(item => `
          <div class="scheme-card" data-key="${item.key.split('/')[0].trim().replace(/\\/g, '\\\\')}">
            <div class="scheme-char">${item.char}</div>
            <div class="scheme-key">${item.key}</div>
            <div class="scheme-desc">${item.name || item.desc || item.cat || ''}</div>
          </div>
        `).join('')}
      </div>
    `;

    // Click to insert
    schemeContent.querySelectorAll('.scheme-card').forEach(card => {
      card.addEventListener('click', () => {
        const key = card.getAttribute('data-key');
        insertAtCursor(singlishInput, key);
        doConvert();
        schemeDrawer.classList.add('hidden');
        singlishInput.focus();
      });
    });
  };

  // History Drawer Logic
  const toggleHistoryDrawer = async () => {
    schemeDrawer.classList.add('hidden');
    historyDrawer.classList.toggle('hidden');
    if (!historyDrawer.classList.contains('hidden')) {
      await renderHistory();
    }
  };

  historyToggleBtn.addEventListener('click', toggleHistoryDrawer);
  closeHistoryBtn.addEventListener('click', () => historyDrawer.classList.add('hidden'));

  const saveToHistory = async (singlish, sinhala) => {
    let history = (await getStorage('conversion_history')) || [];
    // Deduplicate identical top item
    if (history.length > 0 && history[0].singlish === singlish) return;
    
    history.unshift({
      singlish,
      sinhala,
      timestamp: Date.now()
    });
    // Keep max 20 items
    if (history.length > 20) history = history.slice(0, 20);
    await setStorage('conversion_history', history);
  };

  const renderHistory = async () => {
    const history = (await getStorage('conversion_history')) || [];
    if (history.length === 0) {
      historyContent.innerHTML = '<div class="empty-state">No recent conversions yet. Start typing!</div>';
      return;
    }

    historyContent.innerHTML = `
      <div class="history-list">
        ${history.map((item, idx) => `
          <div class="history-item" data-idx="${idx}">
            <div class="history-text">
              <span class="history-sinhala">${escapeHtml(item.sinhala)}</span>
              <span class="history-singlish">${escapeHtml(item.singlish)}</span>
            </div>
            <button class="text-btn btn-history-copy" title="Copy">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
            </button>
          </div>
        `).join('')}
      </div>
    `;

    historyContent.querySelectorAll('.history-item').forEach(el => {
      const idx = parseInt(el.getAttribute('data-idx'));
      const item = history[idx];
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-history-copy')) {
          navigator.clipboard.writeText(item.sinhala);
          showToast('Copied from history!');
          return;
        }
        singlishInput.value = item.singlish;
        sinhalaOutput.value = item.sinhala;
        updateStats();
        historyDrawer.classList.add('hidden');
        singlishInput.focus();
      });
    });
  };

  clearHistoryBtn.addEventListener('click', async () => {
    await setStorage('conversion_history', []);
    renderHistory();
    showToast('History cleared');
  });

  const escapeHtml = (str) => {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  };

  // Auto focus input
  singlishInput.focus();
});
