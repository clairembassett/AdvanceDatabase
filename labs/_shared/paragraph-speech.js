/* Read one paragraph on request using the browser's Web Speech API.
   Opt in with <main data-paragraph-speech>. No autoplay or external library. */
(function () {
  'use strict';

  // Short utterances avoid browser limits on long passages. Keep every word,
  // prefer sentence endings, and never split decimal numbers or identifiers.
  function speechChunks(text, limit = 260) {
    const words = text.trim().split(/\s+/).filter(Boolean);
    const chunks = [];
    let chunk = [];
    for (const word of words) {
      while (chunk.length && chunk.join(' ').length + word.length + 1 > limit) {
        let boundary = chunk.length;
        for (let i = chunk.length - 1; i >= Math.floor(chunk.length / 2); i--) {
          if (/[.!?][”"')]*$/.test(chunk[i])) { boundary = i + 1; break; }
        }
        chunks.push(chunk.splice(0, boundary).join(' '));
      }
      chunk.push(word);
    }
    if (chunk.length) chunks.push(chunk.join(' '));
    return chunks;
  }

  // Keep playback independent of the DOM so cancel/switch/error behavior can
  // be checked without relying on a machine's installed audio voices.
  function createReader({ synth, Utterance, onChange, onError }) {
    let session = null;
    function stop() {
      const previous = session;
      session = null; // Ignore delayed end/error callbacks from cancelled speech.
      if (previous) {
        clearTimeout(previous.startTimer);
        synth.cancel();
        onChange(null);
      }
    }
    function fail(current) {
      if (session !== current) return;
      stop();
      onError();
    }
    function speakChunk(current, index) {
      if (session !== current) return;
      if (index === current.chunks.length) {
        session = null;
        onChange(null);
        return;
      }
      try {
        const utterance = new Utterance(current.chunks[index]);
        current.utterance = utterance; // Retain it until its callbacks finish.
        utterance.lang = current.lang;
        const voices = synth.getVoices();
        const sameLanguage = voices.filter(voice => voice.lang.split('-')[0] === current.lang.split('-')[0]);
        const voice = sameLanguage.find(voice => voice.localService && voice.default) ||
          sameLanguage.find(voice => voice.localService) || sameLanguage.find(voice => voice.default);
        if (voice) utterance.voice = voice;
        utterance.onstart = () => clearTimeout(current.startTimer);
        utterance.onend = () => {
          clearTimeout(current.startTimer);
          if (session === current) speakChunk(current, index + 1);
        };
        utterance.onerror = () => fail(current);
        current.startTimer = setTimeout(() => fail(current), 10000);
        synth.speak(utterance);
      } catch (_) { fail(current); }
    }
    function read(key, text, lang = 'en-US') {
      const toggleOff = session && session.key === key;
      stop();
      if (toggleOff || !text.trim()) return;
      const current = { key, text, lang, chunks: speechChunks(text) };
      session = current;
      onChange(key);
      speakChunk(current, 0);
    }
    return { read, stop, get active() { return session; } };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { speechChunks, createReader };
  }
  if (typeof document === 'undefined') return;
  const root = document.querySelector('[data-paragraph-speech]');
  if (!root) return;

  const notice = document.createElement('div');
  notice.className = 'paragraph-speech-notice';
  notice.hidden = true;
  const message = document.createElement('span');
  message.setAttribute('role', 'status');
  const dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.textContent = 'Dismiss';
  dismiss.addEventListener('click', () => { notice.hidden = true; });
  notice.append(message, dismiss);
  document.body.append(notice);

  function showError(text) {
    notice.hidden = false;
    message.textContent = text;
  }
  function paragraphText(paragraph) {
    const copy = paragraph.cloneNode(true);
    copy.querySelectorAll('.paragraph-speech, [hidden], [aria-hidden="true"], script, style, sup.src').forEach(el => el.remove());
    copy.querySelectorAll('br').forEach(el => el.replaceWith(' '));
    return copy.textContent.replace(/\s+/g, ' ').trim();
  }
  function updateButton(button, text, reading) {
    const action = reading ? 'Stop reading' : 'Read paragraph aloud';
    button.setAttribute('aria-pressed', String(reading));
    button.setAttribute('aria-label', `${action}: ${text.slice(0, 90)}${text.length > 90 ? '…' : ''}`);
    button.title = reading ? 'Stop reading (Escape)' : 'Read this paragraph aloud';
  }
  let activeButton = null;
  let activeParagraph = null;
  function changeActive(button) {
    if (activeParagraph) {
      activeParagraph.classList.remove('is-reading-aloud');
      updateButton(activeButton, paragraphText(activeParagraph), false);
    }
    activeButton = button;
    activeParagraph = button ? button.parentElement : null;
    if (button) {
      activeParagraph.classList.add('is-reading-aloud');
      updateButton(button, paragraphText(activeParagraph), true);
    }
  }
  const reader = window.speechSynthesis && window.SpeechSynthesisUtterance ? createReader({
    synth: window.speechSynthesis,
    Utterance: window.SpeechSynthesisUtterance,
    onChange: changeActive,
    onError: () => showError('Read-aloud could not start. Check your browser’s speech and audio settings, then try again.')
  }) : null;

  function enhance() {
    // Some widgets replace paragraph text. Restore their controls and cancel
    // stale speech if the paragraph being read has changed or been removed.
    observer.disconnect();
    if (reader && reader.active) {
      const button = reader.active.key;
      if (!root.contains(button) || paragraphText(button.parentElement) !== reader.active.text) reader.stop();
    }
    root.querySelectorAll('p').forEach(paragraph => {
      if (paragraph.matches('[role="status"], [role="alert"]') ||
          paragraph.closest('pre, code, [contenteditable="true"], [data-no-speech]')) return;
      const text = paragraphText(paragraph);
      if (!text) return;
      let button = paragraph.querySelector('.paragraph-speech');
      if (!button) {
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'paragraph-speech';
        button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><g class="speech-speaker"><path d="M11 4 6 8H3v8h3l5 4Z"/><path d="M15 8a6 6 0 0 1 0 8M18 4a11 11 0 0 1 0 16"/></g><rect class="speech-stop" x="5" y="5" width="14" height="14" rx="2"/></svg>';
        paragraph.prepend(button);
      }
      updateButton(button, text, button === activeButton);
    });
    observer.observe(root, { childList: true, characterData: true, subtree: true });
  }
  const observer = new MutationObserver(enhance);
  enhance();

  root.addEventListener('click', event => {
    const button = event.target.closest('.paragraph-speech');
    if (!button || !root.contains(button)) return;
    if (!reader) {
      showError('Read-aloud is not available in this browser. Open the lab in a browser with speech synthesis support.');
      return;
    }
    notice.hidden = true;
    const paragraph = button.parentElement;
    const lang = paragraph.closest('[lang]')?.lang || 'en-US';
    reader.read(button, paragraphText(paragraph), lang);
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') reader?.stop(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) reader?.stop(); });
  window.addEventListener('pagehide', () => reader?.stop());
})();
