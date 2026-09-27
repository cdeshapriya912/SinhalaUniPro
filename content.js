/**
 * SinhalaUniPro - In-Page Live Typing (Phonetic IME) Content Script
 * Allows real-time Singlish to Sinhala Unicode typing in any input, textarea, or contenteditable.
 */

(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__SINHALA_UNI_PRO_INJECTED__) return;
  window.__SINHALA_UNI_PRO_INJECTED__ = true;

  let isEnabled = true; // Global extension enabled
  let isSinhalaMode = true; // Typing mode active (toggle with Alt+S, Option+S, or Ctrl+M)

  // Word buffer state
  let currentBuffer = '';
  let prevConvertedText = '';
  let inputWordStartIndex = -1;
  let activeElement = null;
  let activePrediction = null;
  let predictionPopupEl = null;

  // Grapheme cluster counter for Sinhala script
  const segmenter = (typeof Intl !== 'undefined' && Intl.Segmenter)
    ? new Intl.Segmenter('si', { granularity: 'grapheme' })
    : null;

  function countGraphemes(str) {
    if (!str) return 0;
    if (segmenter) {
      return [...segmenter.segment(str)].length;
    }
    // Fallback: Sinhala base letter followed by virama, ZWJ, and vowel signs counts as 1 cluster
    const matches = str.match(/[\u0D80-\u0DFF][\u0DCA\u200D\u0DCF-\u0DDF]*/g);
    return matches ? matches.length : str.length;
  }

  // Load preferences from storage
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(['inlineEnabled', 'isSinhalaMode'], (res) => {
      if (res.inlineEnabled !== undefined) isEnabled = res.inlineEnabled;
      if (res.isSinhalaMode !== undefined) isSinhalaMode = res.isSinhalaMode;
      updateBadgeUI();
    });
  }

  // OS detection for shortcut labeling
  const isMac = (typeof navigator !== 'undefined' && /Mac|iPhone|iPod|iPad/.test(navigator.platform || navigator.userAgent));
  const shortcutDisplay = isMac ? '⌥S (Option+S)' : 'Alt+S';

  // Floating Prediction Tooltip
  function createPredictionPopup() {
    if (predictionPopupEl) return;
    predictionPopupEl = document.createElement('div');
    predictionPopupEl.id = 'sinhala-uni-pro-prediction';
    predictionPopupEl.className = 'sup-pred-popup sup-pred-hidden';
    document.body.appendChild(predictionPopupEl);
  }

  function showPredictionUI(pred, target) {
    if (!pred || !pred.suggestions || pred.suggestions.length === 0 || !target) {
      hidePredictionUI();
      return;
    }
    if (!predictionPopupEl) createPredictionPopup();

    const itemsHtml = pred.suggestions.map((item, idx) => `
      <div class="sup-pred-item ${idx === 0 ? 'sup-pred-active' : ''}" data-idx="${idx}">
        <span class="sup-pred-num">${idx + 1}</span>
        <span class="sup-pred-word"><span class="sup-pred-prefix">${pred.prefix}</span><span class="sup-pred-suffix">${item.suffix}</span></span>
      </div>
    `).join('');

    predictionPopupEl.innerHTML = `
      <div class="sup-pred-header">
        <span class="sup-pred-title">Suggestions</span>
        <span class="sup-pred-tip">Press 1-4 or Tab</span>
      </div>
      <div class="sup-pred-list">
        ${itemsHtml}
      </div>
    `;

    // Click to complete
    predictionPopupEl.querySelectorAll('.sup-pred-item').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const idx = parseInt(el.getAttribute('data-idx'), 10);
        const isCE = target.isContentEditable || target.getAttribute('contenteditable') === 'true' || target.getAttribute('role') === 'textbox';
        applyActivePredictionByIndex(target, isCE, idx);
      });
    });

    try {
      const rect = target.getBoundingClientRect();
      const popupHeight = 36 + pred.suggestions.length * 28;
      let top = rect.bottom + window.scrollY + 6;
      let left = rect.left + window.scrollX;

      if (rect.bottom + popupHeight + 10 > window.innerHeight) {
        top = Math.max(0, rect.top + window.scrollY - popupHeight - 6);
      }
      if (left + 280 > window.innerWidth) {
        left = Math.max(10, window.innerWidth - 290);
      }

      predictionPopupEl.style.top = `${top}px`;
      predictionPopupEl.style.left = `${left}px`;
      predictionPopupEl.classList.remove('sup-pred-hidden');
    } catch (e) {
      predictionPopupEl.classList.add('sup-pred-hidden');
    }
  }

  function hidePredictionUI() {
    activePrediction = null;
    if (predictionPopupEl) {
      predictionPopupEl.classList.add('sup-pred-hidden');
    }
  }

  function applyActivePredictionByIndex(target, isCE, idx = 0) {
    if (!activePrediction || !activePrediction.suggestions || !activePrediction.suggestions[idx]) return;
    const item = activePrediction.suggestions[idx];
    const completion = item.word + ' ';
    if (isCE) {
      replaceTextInContentEditable(completion);
    } else {
      replaceTextInInput(target, completion);
    }
    resetBuffer();
    hidePredictionUI();
  }

  function resetBuffer() {
    currentBuffer = '';
    prevConvertedText = '';
    inputWordStartIndex = -1;
    hidePredictionUI();
  }
  let badgeEl = null;

  function createBadge() {
    if (badgeEl) return;
    badgeEl = document.createElement('div');
    badgeEl.id = 'sinhala-uni-pro-badge';
    badgeEl.className = 'sup-badge sup-badge-hidden';
    badgeEl.innerHTML = `
      <div class="sup-badge-content">
        <span class="sup-badge-icon" id="sup-mode-icon">සි</span>
        <span class="sup-badge-text" id="sup-mode-text">Sinhala</span>
        <span class="sup-badge-shortcut" title="Press ${shortcutDisplay} to toggle Sinhala/English">${shortcutDisplay}</span>
      </div>
    `;

    // Click to toggle
    badgeEl.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleSinhalaMode();
    });

    document.body.appendChild(badgeEl);
    updateBadgeUI();
  }

  let hideBadgeTimer = null;

  function showBadgeTemporarily() {
    if (!badgeEl) createBadge();
    if (!isEnabled) {
      badgeEl.classList.add('sup-badge-hidden');
      return;
    }
    badgeEl.classList.remove('sup-badge-hidden');
    clearTimeout(hideBadgeTimer);
    hideBadgeTimer = setTimeout(() => {
      badgeEl.classList.add('sup-badge-hidden');
    }, 2800);
  }

  function updateBadgeUI() {
    if (!badgeEl) return;
    const iconEl = badgeEl.querySelector('#sup-mode-icon');
    const textEl = badgeEl.querySelector('#sup-mode-text');

    if (!isEnabled) {
      badgeEl.classList.add('sup-badge-disabled');
      if (iconEl) iconEl.textContent = '✕';
      if (textEl) textEl.textContent = 'Disabled';
    } else if (isSinhalaMode) {
      badgeEl.classList.remove('sup-badge-disabled', 'sup-badge-en');
      badgeEl.classList.add('sup-badge-si');
      if (iconEl) iconEl.textContent = 'සි';
      if (textEl) textEl.textContent = 'Sinhala';
    } else {
      badgeEl.classList.remove('sup-badge-disabled', 'sup-badge-si');
      badgeEl.classList.add('sup-badge-en');
      if (iconEl) iconEl.textContent = 'EN';
      if (textEl) textEl.textContent = 'English';
    }
  }

  function toggleSinhalaMode() {
    if (!isEnabled) {
      isEnabled = true;
      isSinhalaMode = true;
    } else {
      isSinhalaMode = !isSinhalaMode;
    }
    resetBuffer();
    updateBadgeUI();
    showBadgeTemporarily();

    // Persist
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ isSinhalaMode, inlineEnabled: isEnabled });
    }
  }

  // Detect editable targets
  function isEditable(el) {
    if (!el) return false;
    if (el.tagName === 'INPUT') {
      const type = (el.type || 'text').toLowerCase();
      return ['text', 'search', 'url', 'email'].includes(type) && !el.readOnly && !el.disabled;
    }
    if (el.tagName === 'TEXTAREA') {
      return !el.readOnly && !el.disabled;
    }
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true' || el.getAttribute('role') === 'textbox') {
      return true;
    }
    return false;
  }

  // Handle Input element replacement with strict word start boundary
  function replaceTextInInput(input, replacement) {
    const currentPos = input.selectionEnd;
    const start = (inputWordStartIndex >= 0 && inputWordStartIndex <= currentPos)
      ? inputWordStartIndex
      : currentPos;

    input.setSelectionRange(start, currentPos);

    let success = false;
    try {
      success = document.execCommand('insertText', false, replacement);
    } catch (e) {
      success = false;
    }

    if (!success) {
      if (typeof input.setRangeText === 'function') {
        input.setRangeText(replacement, start, currentPos, 'end');
      } else {
        const val = input.value;
        input.value = val.substring(0, start) + replacement + val.substring(currentPos);
        input.selectionStart = input.selectionEnd = start + replacement.length;
      }
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }

    prevConvertedText = replacement;
  }

  // Handle contenteditable replacement using exact grapheme count
  function replaceTextInContentEditable(replacement) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const graphemesToRemove = countGraphemes(prevConvertedText);
    if (graphemesToRemove > 0 && typeof sel.modify === 'function') {
      for (let i = 0; i < graphemesToRemove; i++) {
        sel.modify('extend', 'backward', 'character');
      }
    } else if (graphemesToRemove > 0) {
      for (let i = 0; i < graphemesToRemove; i++) {
        document.execCommand('delete', false, null);
      }
    }

    document.execCommand('insertText', false, replacement);
    prevConvertedText = replacement;
  }

  // Check if character can be part of Singlish buffer
  function isSinglishKey(key) {
    if (!key || key.length !== 1) return false;
    // Letters a-z, A-Z, backslash \, forward slash /, or ) for vowel combinations
    return /[a-zA-Z\\/]/.test(key) || (key === ')' && currentBuffer.length > 0);
  }

  // Main Keydown Listener
  document.addEventListener('keydown', (e) => {
    // Check toggle shortcut: Alt+S, Option+S (which emits 'ß' on Mac), or Ctrl+M
    const isAltS = e.altKey && (e.code === 'KeyS' || e.key === 's' || e.key === 'S' || e.key === 'ß');
    const isCtrlM = e.ctrlKey && !e.altKey && !e.metaKey && (e.code === 'KeyM' || e.key === 'm' || e.key === 'M');

    if (isAltS || isCtrlM) {
      e.preventDefault();
      e.stopPropagation();
      toggleSinhalaMode();
      return;
    }

    const target = e.target;
    if (!isEditable(target)) {
      resetBuffer();
      return;
    }

    activeElement = target;

    // If inline typing is disabled or in English mode, pass through
    if (!isEnabled || !isSinhalaMode) {
      resetBuffer();
      return;
    }

    // Standalone modifier keys (Shift, CapsLock, Fn, Alt, Control, Meta, AltGraph) alone must NOT reset or clear buffer
    // This allows typing uppercase letters (e.g. Shift+A for 'wA' -> 'වැ', 'dhY' -> 'ධ්‍ය', 'Aa' -> 'ඈ') and symbols seamlessly
    if (['Shift', 'CapsLock', 'Fn', 'Alt', 'Control', 'Meta', 'AltGraph'].includes(e.key)) {
      return;
    }

    // Ignore modifier combinations (Ctrl+C, Cmd+V, Alt+Tab, etc.)
    if (e.ctrlKey || e.metaKey || (e.altKey && e.key !== 'Alt')) {
      resetBuffer();
      return;
    }

    const isCE = target.isContentEditable || target.getAttribute('contenteditable') === 'true' || target.getAttribute('role') === 'textbox';

    // Handle number selection 1-4 for suggestions
    if (activePrediction && activePrediction.suggestions && ['1', '2', '3', '4'].includes(e.key)) {
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < activePrediction.suggestions.length) {
        e.preventDefault();
        e.stopPropagation();
        applyActivePredictionByIndex(target, isCE, idx);
        return;
      }
    }

    // Handle Tab key (selects #1)
    if (e.key === 'Tab' && activePrediction) {
      e.preventDefault();
      e.stopPropagation();
      applyActivePredictionByIndex(target, isCE, 0);
      return;
    }

    // Handle Escape key to dismiss prediction
    if (e.key === 'Escape' && activePrediction) {
      e.preventDefault();
      hidePredictionUI();
      return;
    }

    // Handle Backspace
    if (e.key === 'Backspace') {
      if (currentBuffer.length > 0) {
        e.preventDefault();
        currentBuffer = currentBuffer.slice(0, -1);

        const newConverted = currentBuffer ? SinhalaConverter.convert(currentBuffer) : '';
        if (isCE) {
          replaceTextInContentEditable(newConverted);
        } else {
          replaceTextInInput(target, newConverted);
        }

        if (!currentBuffer) {
          resetBuffer();
        } else if (typeof SinhalaSpellChecker !== 'undefined' && SinhalaSpellChecker.predictWord) {
          activePrediction = SinhalaSpellChecker.predictWord(newConverted);
          if (activePrediction) {
            showPredictionUI(activePrediction, target);
          } else {
            hidePredictionUI();
          }
        }
        return;
      }
      resetBuffer();
      return;
    }

    // Handle non-Singlish keys (Space, Enter, punctuation, digits, etc.)
    // These keys commit the current word buffer so the next word starts completely fresh
    if (!isSinglishKey(e.key)) {
      resetBuffer();
      return;
    }

    // Handle Singlish character typing
    e.preventDefault();

    // If starting a brand new word in input/textarea, anchor its starting index
    if (!currentBuffer) {
      if (!isCE && target.selectionStart !== undefined) {
        inputWordStartIndex = target.selectionStart;
      }
      prevConvertedText = '';
    }

    currentBuffer += e.key;
    const newConverted = SinhalaConverter.convert(currentBuffer);

    if (isCE) {
      replaceTextInContentEditable(newConverted);
    } else {
      replaceTextInInput(target, newConverted);
    }

    // Trigger predictive word suggestion
    if (typeof SinhalaSpellChecker !== 'undefined' && SinhalaSpellChecker.predictWord && newConverted.length >= 1) {
      activePrediction = SinhalaSpellChecker.predictWord(newConverted);
      if (activePrediction) {
        showPredictionUI(activePrediction, target);
      } else {
        hidePredictionUI();
      }
    } else {
      hidePredictionUI();
    }

    showBadgeTemporarily();
  }, true);

  // Focus & Blur Listeners
  document.addEventListener('focusin', (e) => {
    if (isEditable(e.target)) {
      activeElement = e.target;
      resetBuffer();
      if (isEnabled) {
        showBadgeTemporarily();
      }
    }
  }, true);

  document.addEventListener('focusout', (e) => {
    resetBuffer();
  }, true);

  document.addEventListener('mousedown', (e) => {
    // If clicked inside input or moving cursor, reset buffer so previous words are untouched
    if (e.target !== badgeEl && !badgeEl?.contains(e.target)) {
      resetBuffer();
    }
  }, true);

  // Listen for messages from background/popup
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.action === 'toggle-sinhala-mode') {
        toggleSinhalaMode();
        sendResponse({ isSinhalaMode, isEnabled });
      } else if (msg.action === 'set-inline-state') {
        if (msg.enabled !== undefined) isEnabled = msg.enabled;
        if (msg.isSinhalaMode !== undefined) isSinhalaMode = msg.isSinhalaMode;
        resetBuffer();
        updateBadgeUI();
        showBadgeTemporarily();
        sendResponse({ success: true, isSinhalaMode, isEnabled });
      } else if (msg.action === 'get-inline-state') {
        sendResponse({ isSinhalaMode, isEnabled });
      }
    });
  }

  // Create badge once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBadge);
  } else {
    createBadge();
  }
})();
