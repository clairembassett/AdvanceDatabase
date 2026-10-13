const assert = require('node:assert/strict');
const { speechChunks, createReader, chooseVoice, voiceKey, readingRate } = require('../labs/_shared/paragraph-speech.js');

const voice = (name, extras = {}) => ({ name, lang: 'en-US', voiceURI: name, localService: true, ...extras });
const basic = voice('Basic', { default: true });
const premium = voice('Ava (Premium)');
const online = voice('Online Natural', { localService: false });
assert.equal(chooseVoice([basic, premium, online], 'en-US'), premium);
assert.equal(chooseVoice([basic, premium, online], 'en-US', voiceKey(online)), online);
assert.equal(chooseVoice([basic, premium], 'en-US', 'removed voice'), premium);
assert.equal(chooseVoice([], 'en-US'), undefined);
const british = voice('Daniel (Enhanced)', { lang: 'en-GB' });
assert.equal(chooseVoice([british, premium], 'en_US'), premium);
assert.equal(chooseVoice([voice('Zarvox', { default: true }), basic], 'en-US'), basic);
assert.equal(chooseVoice([voice('French', { lang: 'fr-FR' })], 'en-US'), undefined);
assert.equal(readingRate('0.9'), 0.9);
assert.equal(readingRate('bad'), 1);
assert.equal(readingRate(5), 1);

const text = 'An Arrow batch keeps distance 3.0 paired with fare $20. ' +
  'Read the distance and fare columns together. '.repeat(25);
const chunks = speechChunks(text);
assert(chunks.length > 1);
assert.equal(chunks.join(' '), text.trim());
assert(chunks.every(chunk => chunk.length <= 260));
assert(chunks.some(chunk => chunk.includes('3.0')));
assert.deepEqual(speechChunks('  '), []);
const longWordText = 'word '.repeat(50) + 'x'.repeat(200);
assert(speechChunks(longWordText).every(chunk => chunk.length <= 260));
assert.equal(speechChunks(longWordText).join(' '), longWordText.trim());

const spoken = [], changed = [], errors = [];
let cancelled = 0;
const localVoice = { lang: 'en-US', localService: true, default: true };
const synth = {
  getVoices: () => [localVoice],
  cancel: () => { cancelled++; },
  speak: utterance => { spoken.push(utterance); utterance.onstart(); }
};
class Utterance { constructor(text) { this.text = text; } }
const reader = createReader({synth, Utterance, onChange: key => changed.push(key), onError: () => errors.push(true)});

reader.read('first', 'Read only this paragraph.');
assert.equal(spoken.at(-1).text, 'Read only this paragraph.');
assert.equal(spoken.at(-1).voice, localVoice);
assert.equal(reader.active.key, 'first');
const old = spoken.at(-1);
reader.read('second', 'Switch to the next paragraph.');
assert.equal(cancelled, 1);
old.onend();
old.onerror();
assert.equal(reader.active.key, 'second');
assert.equal(errors.length, 0);
assert.equal(spoken.length, 2);
reader.read('second', 'Switch to the next paragraph.');
assert.equal(reader.active, null);
assert.equal(cancelled, 2);
assert.equal(changed.at(-1), null);

reader.read('long', text);
const beginning = spoken.length - 1;
while (reader.active) spoken.at(-1).onend();
assert.equal(spoken.slice(beginning).map(utterance => utterance.text).join(' '), text.trim());
assert.equal(changed.at(-1), null);

reader.read('failed', 'Handle a voice failure.');
spoken.at(-1).onerror();
assert.equal(reader.active, null);
assert.equal(errors.length, 1);
reader.read('recover', 'Read after an error.');
spoken.at(-1).onend();
assert.equal(reader.active, null);

const badEngine = {...synth, speak: () => { throw new Error('No speech service'); }};
const failedReader = createReader({synth: badEngine, Utterance, onChange: () => {}, onError: () => errors.push(true)});
failedReader.read('throw', 'A missing speech service should clear the controls.');
assert.equal(failedReader.active, null);
assert.equal(errors.length, 2);
reader.read('empty', '   ');
assert.equal(reader.active, null);

let preferences = { voice: voiceKey(premium), rate: 0.9 };
const chosenReader = createReader({synth: { ...synth, getVoices: () => [basic, premium, online] }, Utterance,
  getPreferences: () => preferences, onChange: () => {}, onError: () => assert.fail('unexpected error')});
chosenReader.read('voice-test', text);
assert.equal(spoken.at(-1).voice, premium);
assert.equal(spoken.at(-1).rate, 0.9);
preferences = { voice: voiceKey(online), rate: 1.2 };
spoken.at(-1).onend();
assert.equal(spoken.at(-1).voice, premium, 'Do not change voices halfway through a paragraph');
assert.equal(spoken.at(-1).rate, 0.9);
chosenReader.read('next', 'The next paragraph uses the new settings.');
assert.equal(spoken.at(-1).voice, online);
assert.equal(spoken.at(-1).rate, 1.2);
chosenReader.stop();
console.log('Paragraph speech: voice selection, saved preferences, rate, full text, switch/stop, stale callbacks, errors, and recovery passed.');
