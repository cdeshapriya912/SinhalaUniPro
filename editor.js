/**
 * SinhalaUniPro - Full Document Studio Controller
 */

document.addEventListener('DOMContentLoaded', () => {
  const editorInput = document.getElementById('editor-input');
  const editorOutput = document.getElementById('editor-output');
  const docStats = document.getElementById('doc-stats');
  const inputStatsDetail = document.getElementById('input-stats-detail');
  const outputStatsDetail = document.getElementById('output-stats-detail');
  const draftStatus = document.getElementById('draft-status');

  const copyAllBtn = document.getElementById('btn-copy-all');
  const copySelectionBtn = document.getElementById('btn-copy-selection');
  const copyAllText = document.getElementById('copy-all-text');
  const clearBtn = document.getElementById('btn-clear');
  const sampleBtn = document.getElementById('btn-load-sample');
  const downloadBtn = document.getElementById('btn-download');

  const fontDecBtn = document.getElementById('btn-font-dec');
  const fontIncBtn = document.getElementById('btn-font-inc');

  const themeToggleBtn = document.getElementById('btn-theme-toggle');
  const themeIconSun = document.getElementById('theme-icon-sun');
  const themeIconMoon = document.getElementById('theme-icon-moon');

  const schemeToggleBtn = document.getElementById('btn-scheme-toggle');
  const schemeSidebar = document.getElementById('scheme-sidebar');
  const closeSidebarBtn = document.getElementById('btn-close-sidebar');
  const schemeSearch = document.getElementById('scheme-search');
  const schemeTabs = document.querySelectorAll('.side-tab');
  const schemeContent = document.getElementById('scheme-content');

  const spellToggleBtn = document.getElementById('btn-spell-toggle');
  const editorSpellCount = document.getElementById('editor-spell-count');
  const spellSidebar = document.getElementById('spell-sidebar');
  const closeSpellSidebarBtn = document.getElementById('btn-close-spell-sidebar');
  const editorFixAllBtn = document.getElementById('btn-editor-fix-all');
  const editorSpellSummary = document.getElementById('editor-spell-summary');
  const editorSpellContent = document.getElementById('editor-spell-content');

  const editorPredictionBox = document.getElementById('editor-prediction-box');
  const editorPredItemsContainer = document.getElementById('editor-pred-items-container');
  let currentEditorPredictions = null;

  const toast = document.getElementById('toast');

  let currentFontSize = 16;
  let activeTab = 'all';
  let saveTimer = null;
  let lastEditorSpellResults = null;

  const escapeHtml = (str) => {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  };

  // Theme Init
  const initTheme = () => {
    const saved = localStorage.getItem('sinhala_uni_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
    if (saved === 'dark') {
      themeIconSun.classList.remove('hidden');
      themeIconMoon.classList.add('hidden');
    } else {
      themeIconSun.classList.add('hidden');
      themeIconMoon.classList.remove('hidden');
    }
  };

  themeToggleBtn.addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = cur === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sinhala_uni_theme', next);
    initTheme();
  });

  initTheme();

  // Load Saved Draft
  const savedDraft = localStorage.getItem('sinhala_editor_draft');
  if (savedDraft) {
    editorInput.value = savedDraft;
    editorOutput.value = SinhalaConverter.convert(savedDraft);
    updateStats();
    setTimeout(runLiveSpellCheck, 100);
  }

  // Live Conversion
  const handleInput = () => {
    const inputVal = editorInput.value;
    const converted = SinhalaConverter.convert(inputVal);
    editorOutput.value = converted;
    updateStats();
    runLiveSpellCheck();
    updateEditorPrediction(converted);

    // Auto save draft
    draftStatus.textContent = 'Saving...';
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem('sinhala_editor_draft', inputVal);
      draftStatus.textContent = 'Draft auto-saved';
    }, 600);
  };

  const updateEditorPrediction = (unicodeText) => {
    if (typeof SinhalaSpellChecker === 'undefined' || !SinhalaSpellChecker.predictWord || !unicodeText) {
      hideEditorPrediction();
      return;
    }

    if (/\s$/.test(unicodeText)) {
      hideEditorPrediction();
      return;
    }

    const words = unicodeText.trim().split(/\s+/);
    const lastWord = words.length > 0 ? words[words.length - 1] : '';
    if (!lastWord || lastWord.length < 1) {
      hideEditorPrediction();
      return;
    }

    const pred = SinhalaSpellChecker.predictWord(lastWord, 4);
    if (pred && pred.suggestions && pred.suggestions.length > 0) {
      currentEditorPredictions = pred;
      editorPredItemsContainer.innerHTML = pred.suggestions.map((item, idx) => `
        <div class="pred-item ${idx === 0 ? 'pred-active' : ''}" data-idx="${idx}" title="Press ${idx + 1} or click to insert">
          <span class="pred-num">${idx + 1}</span>
          <span class="pred-word"><span class="pred-prefix">${pred.prefix}</span><span class="pred-suffix">${item.suffix}</span></span>
        </div>
      `).join('');

      editorPredItemsContainer.querySelectorAll('.pred-item').forEach(el => {
        el.addEventListener('click', () => {
          const idx = parseInt(el.getAttribute('data-idx'), 10);
          acceptEditorPrediction(idx);
        });
      });

      editorPredictionBox.classList.remove('hidden');
    } else {
      hideEditorPrediction();
    }
  };

  const hideEditorPrediction = () => {
    currentEditorPredictions = null;
    if (editorPredictionBox) editorPredictionBox.classList.add('hidden');
  };

  const acceptEditorPrediction = (idx = 0) => {
    if (!currentEditorPredictions || !currentEditorPredictions.suggestions || !currentEditorPredictions.suggestions[idx]) return;
    const targetWord = currentEditorPredictions.suggestions[idx].word;

    // Update editorOutput
    const outVal = editorOutput.value;
    const words = outVal.trim().split(/\s+/);
    if (words.length > 0) {
      words[words.length - 1] = targetWord;
      editorOutput.value = words.join(' ') + ' ';
    }

    // Update editorInput
    const inVal = editorInput.value;
    const inWords = inVal.trim().split(/\s+/);
    if (inWords.length > 0) {
      inWords[inWords.length - 1] = targetWord;
      editorInput.value = inWords.join(' ') + ' ';
    }

    updateStats();
    runLiveSpellCheck();
    hideEditorPrediction();
    editorInput.focus();
  };

  const handleEditorKeydownPrediction = (e) => {
    if (currentEditorPredictions && currentEditorPredictions.suggestions) {
      // Check 1-4 selection
      if (['1', '2', '3', '4'].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        if (idx >= 0 && idx < currentEditorPredictions.suggestions.length) {
          e.preventDefault();
          acceptEditorPrediction(idx);
          return true;
        }
      }
      // Check Tab selection (item 1)
      if (e.key === 'Tab') {
        e.preventDefault();
        acceptEditorPrediction(0);
        return true;
      }
      // Check Escape to dismiss
      if (e.key === 'Escape') {
        hideEditorPrediction();
        return true;
      }
    }
    return false;
  };

  editorInput.addEventListener('keydown', handleEditorKeydownPrediction);
  editorOutput.addEventListener('keydown', handleEditorKeydownPrediction);

  editorInput.addEventListener('input', handleInput);
  editorInput.addEventListener('keyup', handleInput);
  editorInput.addEventListener('paste', () => setTimeout(handleInput, 10));
  editorOutput.addEventListener('input', () => {
    updateStats();
    runLiveSpellCheck();
    updateEditorPrediction(editorOutput.value);
  });

  function updateStats() {
    const inVal = editorInput.value;
    const outVal = editorOutput.value;

    const words = inVal.trim() ? inVal.trim().split(/\s+/).length : 0;
    const chars = inVal.length;
    const lines = inVal ? inVal.split('\n').length : 0;

    docStats.textContent = `${words} words • ${chars} chars`;
    inputStatsDetail.textContent = `${chars} characters • ${lines} lines`;
    outputStatsDetail.textContent = `${outVal.length} Sinhala Unicode characters`;
  }

  // Toast
  const showToast = (msg) => {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    setTimeout(() => toast.classList.add('hidden'), 2200);
  };

  // Copy All
  copyAllBtn.addEventListener('click', async () => {
    const text = editorOutput.value;
    if (!text) {
      showToast('No text to copy!');
      return;
    }
    await navigator.clipboard.writeText(text);
    copyAllText.textContent = 'Copied!';
    showToast('Copied entire Sinhala text to clipboard!');
    setTimeout(() => {
      copyAllText.textContent = 'Copy Sinhala';
    }, 1600);
  });

  // Copy Selection
  copySelectionBtn.addEventListener('click', async () => {
    const start = editorOutput.selectionStart;
    const end = editorOutput.selectionEnd;
    const selected = editorOutput.value.substring(start, end);
    if (!selected) {
      showToast('Select text in output to copy, or use Copy Sinhala');
      return;
    }
    await navigator.clipboard.writeText(selected);
    showToast('Copied selected Sinhala text!');
  });

  // Clear
  clearBtn.addEventListener('click', () => {
    if (editorInput.value && confirm('Are you sure you want to clear your document?')) {
      editorInput.value = '';
      editorOutput.value = '';
      localStorage.removeItem('sinhala_editor_draft');
      updateStats();
      editorInput.focus();
    }
  });

  // Load Sample
  sampleBtn.addEventListener('click', () => {
    const sampleArticle = 
`aayubowan shrii lankaava!

shrii lankaava indhiyaanu saagarayehi pihiti sundhara dhuupathaki. ehi paramparaava, sanskRuthiya haa prakRuthiya bohoo vishishtaya.

sinhala bhaashaava apey mulika bhaashaava vana athara, eya vishishta lipeeyak sahitha baeviri saahithyayak athi bhaashaavaki.

subha nava vasarak haa samRudhdhimath anaagathayak veevaa!`;
    
    editorInput.value = sampleArticle;
    handleInput();
    editorInput.focus();
  });

  // Font Size
  fontIncBtn.addEventListener('click', () => {
    if (currentFontSize < 28) {
      currentFontSize += 2;
      document.documentElement.style.setProperty('--editor-font-size', `${currentFontSize}px`);
    }
  });

  fontDecBtn.addEventListener('click', () => {
    if (currentFontSize > 12) {
      currentFontSize -= 2;
      document.documentElement.style.setProperty('--editor-font-size', `${currentFontSize}px`);
    }
  });

  // Download
  downloadBtn.addEventListener('click', () => {
    const content = editorOutput.value;
    if (!content) {
      showToast('Nothing to export!');
      return;
    }
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sinhala-document-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Document downloaded successfully!');
  });

  // Spell Check Engine Integration
  const runLiveSpellCheck = () => {
    if (typeof SinhalaSpellChecker === 'undefined') return;
    const text = editorOutput.value;
    if (!text || !text.trim()) {
      editorSpellCount.textContent = '0';
      spellToggleBtn.style.color = '';
      lastEditorSpellResults = null;
      if (!spellSidebar.classList.contains('collapsed')) {
        renderSpellSidebar();
      }
      return;
    }

    const res = SinhalaSpellChecker.checkText(text);
    lastEditorSpellResults = res;
    editorSpellCount.textContent = res.errorCount;
    if (res.errorCount > 0) {
      spellToggleBtn.style.color = '#f87171';
    } else {
      spellToggleBtn.style.color = '';
    }

    if (!spellSidebar.classList.contains('collapsed')) {
      renderSpellSidebar();
    }
  };

  const renderSpellSidebar = () => {
    const text = editorOutput.value;
    if (!text || !text.trim()) {
      editorSpellSummary.textContent = 'Enter text to check spelling.';
      editorSpellContent.innerHTML = '<div class="empty-state" style="padding: 30px 10px; text-align: center; color: var(--text-muted); font-size: 13px;">No text in editor yet. Type some Singlish on the left!</div>';
      return;
    }

    if (!lastEditorSpellResults) {
      lastEditorSpellResults = SinhalaSpellChecker.checkText(text);
    }
    const res = lastEditorSpellResults;

    editorSpellSummary.textContent = `Scanned ${res.totalWords} words • ${res.errorCount} spelling issue${res.errorCount === 1 ? '' : 's'} identified`;

    if (res.errorCount === 0) {
      editorSpellContent.innerHTML = `
        <div class="spell-clean-state">
          <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <div>All words are correctly spelled!</div>
          <div style="font-size: 11px; font-weight: normal; color: var(--text-muted); margin-top: 4px;">Verified against official Sinhala dictionary</div>
        </div>
      `;
      return;
    }

    editorSpellContent.innerHTML = `
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
                : '<span style="font-size: 11px; color: var(--text-muted);">No suggestions</span>'
              }
              <button class="text-btn btn-add-dict" data-word="${escapeHtml(err.word)}" title="Add to your personal dictionary">+ Add</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Click chip to replace
    editorSpellContent.querySelectorAll('.suggestion-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const orig = btn.getAttribute('data-orig');
        const repl = btn.getAttribute('data-repl');
        replaceWordInOutput(orig, repl);
        showToast(`Replaced "${orig}" with "${repl}"`);
      });
    });

    // Add to dictionary
    editorSpellContent.querySelectorAll('.btn-add-dict').forEach(btn => {
      btn.addEventListener('click', () => {
        const word = btn.getAttribute('data-word');
        SinhalaSpellChecker.addToDictionary(word);
        runLiveSpellCheck();
        renderSpellSidebar();
        showToast(`Added "${word}" to dictionary`);
      });
    });
  };

  const replaceWordInOutput = (orig, repl) => {
    const val = editorOutput.value;
    const regex = new RegExp(orig, 'g');
    editorOutput.value = val.replace(regex, repl);
    updateStats();
    runLiveSpellCheck();
  };

  editorFixAllBtn.addEventListener('click', () => {
    if (!lastEditorSpellResults || lastEditorSpellResults.errorCount === 0) {
      showToast('No errors to fix!');
      return;
    }
    let fixed = 0;
    let currentVal = editorOutput.value;
    lastEditorSpellResults.errors.forEach(err => {
      if (err.suggestions && err.suggestions.length > 0) {
        const top = err.suggestions[0];
        currentVal = currentVal.replace(new RegExp(err.word, 'g'), top);
        fixed++;
      }
    });
    editorOutput.value = currentVal;
    updateStats();
    runLiveSpellCheck();
    showToast(`Fixed ${fixed} word${fixed === 1 ? '' : 's'}!`);
  });

  // Spell Sidebar Toggle
  spellToggleBtn.addEventListener('click', () => {
    schemeSidebar.classList.add('collapsed');
    spellSidebar.classList.toggle('collapsed');
    if (!spellSidebar.classList.contains('collapsed')) {
      renderSpellSidebar();
    }
  });

  closeSpellSidebarBtn.addEventListener('click', () => {
    spellSidebar.classList.add('collapsed');
  });

  // Scheme Sidebar Toggle
  schemeToggleBtn.addEventListener('click', () => {
    spellSidebar.classList.add('collapsed');
    schemeSidebar.classList.toggle('collapsed');
    if (!schemeSidebar.classList.contains('collapsed')) {
      schemeSearch.focus();
      renderScheme();
    }
  });

  closeSidebarBtn.addEventListener('click', () => {
    schemeSidebar.classList.add('collapsed');
  });

  schemeTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      schemeTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.getAttribute('data-tab');
      renderScheme();
    });
  });

  schemeSearch.addEventListener('input', () => renderScheme());

  const renderScheme = () => {
    const q = schemeSearch.value.toLowerCase().trim();
    let items = [];

    if (activeTab === 'all' || activeTab === 'vowels') {
      items = items.concat(SCHEME_DATA.vowels);
    }
    if (activeTab === 'all' || activeTab === 'consonants') {
      items = items.concat(SCHEME_DATA.consonants);
    }
    if (activeTab === 'all' || activeTab === 'specials') {
      items = items.concat(SCHEME_DATA.specials);
    }

    if (q) {
      items = items.filter(it => 
        (it.char && it.char.includes(q)) ||
        (it.key && it.key.toLowerCase().includes(q)) ||
        (it.desc && it.desc.toLowerCase().includes(q)) ||
        (it.name && it.name.toLowerCase().includes(q))
      );
    }

    schemeContent.innerHTML = items.map(it => `
      <div class="scheme-tile" data-key="${it.key.split('/')[0].trim().replace(/\\/g, '\\\\')}">
        <div class="scheme-char">${it.char}</div>
        <div class="scheme-key">${it.key}</div>
        <div class="scheme-desc">${it.name || it.desc || ''}</div>
      </div>
    `).join('');

    schemeContent.querySelectorAll('.scheme-tile').forEach(tile => {
      tile.addEventListener('click', () => {
        const k = tile.getAttribute('data-key');
        const start = editorInput.selectionStart;
        const end = editorInput.selectionEnd;
        const val = editorInput.value;
        editorInput.value = val.substring(0, start) + k + val.substring(end);
        editorInput.selectionStart = editorInput.selectionEnd = start + k.length;
        handleInput();
        editorInput.focus();
      });
    });
  };

  // Keyboard shortcut Ctrl+Enter to copy
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      copyAllBtn.click();
    }
  });

  editorInput.focus();
});
