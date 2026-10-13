const assert = require('node:assert/strict');
const { speechChunks, createReader } = require('../labs/_shared/paragraph-speech.js');

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
console.log('Paragraph speech: full text retained, switch/stop, stale callbacks, completion, errors, and recovery passed.');
