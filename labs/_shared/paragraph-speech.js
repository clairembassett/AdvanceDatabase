/* Read one paragraph on request using the browser's Web Speech API.
   Opt in with <main data-paragraph-speech>. No autoplay or external library. */
(function () {
  'use strict';

  const voiceKey = voice => JSON.stringify([voice.voiceURI || voice.name, voice.lang]);
  const language = lang => (lang || '').toLowerCase().replace(/_/g, '-');
  function chooseVoice(voices, lang, preferred = '') {
    const selected = voices.find(voice => voiceKey(voice) === preferred);
    if (selected) return selected;
    const matching = voices.filter(voice => language(voice.lang).split('-')[0] === language(lang).split('-')[0]);
    // The API has no quality score. Names are a useful hint, with a chooser so
    // readers can audition voices instead of relying on this heuristic.
    const quality = voice => /premium|enhanced|natural|neural/i.test(voice.name || '');
    const novelty = voice => /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Trinoids|Whisper|Zarvox)(\b|$)/i.test(voice.name || '');
    const candidates = matching.filter(voice => !novelty(voice));
    const pool = candidates.length ? candidates : matching;
    const local = pool.filter(voice => voice.localService);
    const regional = list => list.find(voice => language(voice.lang) === language(lang)) || list[0];
    return regional(local.filter(quality)) || local.find(voice => voice.default) ||
      regional(local.filter(voice => /^(Samantha|Alex|Daniel|Karen|Moira|Tessa)(\b|$)/i.test(voice.name || ''))) ||
      regional(local) || regional(pool.filter(quality)) || pool.find(voice => voice.default) || regional(pool);
  }

  function readingRate(rate) {
    const value = Number(rate);
    return Number.isFinite(value) && value >= 0.7 && value <= 1.3 ? value : 1;
  }

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
  function createReader({ synth, Utterance, onChange, onError, getPreferences = () => ({}) }) {
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
        // Keep a paragraph on one voice even if voiceschanged fires mid-read.
        current.voice ||= chooseVoice(synth.getVoices(), current.lang, current.preferred);
        if (current.voice) {
          utterance.voice = current.voice;
          utterance.lang = current.voice.lang;
        }
        utterance.rate = current.rate;
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
      const preferences = getPreferences();
      const current = { key, text, lang, chunks: speechChunks(text),
        preferred: preferences.voice, rate: readingRate(preferences.rate) };
      session = current;
      onChange(key);
      speakChunk(current, 0);
    }
    return { read, stop, get active() { return session; } };
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { speechChunks, createReader, chooseVoice, voiceKey, readingRate };
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
  let previewButton = null;
  function changeActive(button) {
    if (activeParagraph) {
      activeParagraph.classList.remove('is-reading-aloud');
      updateButton(activeButton, paragraphText(activeParagraph), false);
    }
    if (previewButton) {
      previewButton.textContent = button === previewButton ? 'Stop preview' : 'Preview voice';
      previewButton.setAttribute('aria-pressed', String(button === previewButton));
    }
    activeButton = button;
    activeParagraph = button && button !== previewButton ? button.parentElement : null;
    if (activeParagraph) {
      activeParagraph.classList.add('is-reading-aloud');
      updateButton(button, paragraphText(activeParagraph), true);
    }
  }
  const preferenceKey = 'lab-paragraph-speech';
  let preferences = {};
  try { preferences = JSON.parse(localStorage.getItem(preferenceKey)) || {}; } catch (_) { /* Storage may be disabled. */ }
  preferences = { voice: typeof preferences.voice === 'string' ? preferences.voice : '', rate: readingRate(preferences.rate) };
  const reader = window.speechSynthesis && window.SpeechSynthesisUtterance ? createReader({
    synth: window.speechSynthesis,
    Utterance: window.SpeechSynthesisUtterance,
    getPreferences: () => preferences,
    onChange: changeActive,
    onError: () => showError('Read-aloud could not start. Check your browser’s speech and audio settings, then try again.')
  }) : null;

  if (reader) {
    const settings = document.createElement('details');
    settings.className = 'paragraph-speech-settings';
    settings.setAttribute('data-no-speech', '');
    settings.innerHTML = '<summary>Reading voice and speed</summary>' +
      '<div class="speech-options"><label>Voice<select class="speech-voice"></select></label>' +
      '<label>Speed<select class="speech-rate"><option value="0.8">0.8× · slower</option><option value="0.9">0.9× · relaxed</option><option value="1">1× · normal</option><option value="1.1">1.1× · faster</option><option value="1.2">1.2× · brisk</option></select></label>' +
      '<button type="button" class="speech-preview" aria-pressed="false">Preview voice</button></div>' +
      '<div class="speech-voice-status" role="status"></div>' +
      '<div class="speech-voice-help">Try a few voices and choose the one you prefer. Your choice is saved in this browser. For more voices on a Mac, open System Settings → Accessibility → Read &amp; Speak (Spoken Content on older versions). <a href="https://support.apple.com/guide/mac-help/change-the-voice-your-mac-uses-to-speak-text-mchlp2290/mac">Apple’s voice guide</a>.</div>';
    const help = root.querySelector('.paragraph-speech-help');
    if (help) help.after(settings); else root.prepend(settings);
    const voiceSelect = settings.querySelector('.speech-voice');
    const rateSelect = settings.querySelector('.speech-rate');
    previewButton = settings.querySelector('.speech-preview');
    const status = settings.querySelector('.speech-voice-status');
    const pageLang = root.closest('[lang]')?.lang || 'en-US';
    if (![...rateSelect.options].some(option => Number(option.value) === preferences.rate)) preferences.rate = 1;
    rateSelect.value = String(preferences.rate);
    function updateVoices() {
      const voices = window.speechSynthesis.getVoices();
      const matching = voices.filter(voice => language(voice.lang).split('-')[0] === language(pageLang).split('-')[0]);
      const available = matching.length ? matching : voices;
      const automatic = chooseVoice(voices, pageLang);
      voiceSelect.replaceChildren(new Option(`Automatic${automatic ? ': ' + automatic.name : ' (browser default)'}`, ''));
      available.sort((a, b) => a.name.localeCompare(b.name)).forEach(voice => {
        voiceSelect.add(new Option(`${voice.name} · ${voice.lang}${voice.localService ? '' : ' · online'}`, voiceKey(voice)));
      });
      const savedAvailable = [...voiceSelect.options].some(option => option.value === preferences.voice);
      voiceSelect.value = savedAvailable ? preferences.voice : '';
      status.textContent = !savedAvailable ? 'Your saved voice is unavailable here. Using the automatic choice.' :
        voices.length ? 'Available voices come from your browser and device.' : 'The browser has not listed its voices yet. You can still try the default voice.';
    }
    function savePreferences() {
      reader.stop();
      preferences = { voice: voiceSelect.value, rate: readingRate(rateSelect.value) };
      try { localStorage.setItem(preferenceKey, JSON.stringify(preferences)); } catch (_) { /* Session-only preferences still work. */ }
      updateVoices();
    }
    voiceSelect.addEventListener('change', savePreferences);
    rateSelect.addEventListener('change', savePreferences);
    previewButton.addEventListener('click', () => {
      notice.hidden = true;
      reader.read(previewButton, 'Let’s follow one batch of taxi rides. DuckDB selects the data, and the neural network predicts a fare for each ride.', pageLang);
    });
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    updateVoices();
  }

  function enhance() {
    // Some widgets replace paragraph text. Restore their controls and cancel
    // stale speech if the paragraph being read has changed or been removed.
    observer.disconnect();
    if (reader && reader.active) {
      const button = reader.active.key;
      if (!root.contains(button) || (button !== previewButton && paragraphText(button.parentElement) !== reader.active.text)) reader.stop();
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
