const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync('js/audio.js', 'utf8');
const ctx = { window: {}, setTimeout, clearTimeout, setInterval, clearInterval, console };
vm.createContext(ctx);
vm.runInContext(code, ctx);

const SoundEngine = ctx.window.SoundEngine || ctx.SoundEngine;
assert.ok(SoundEngine, 'SoundEngine must be defined');

const audio = new SoundEngine();
assert.strictEqual(typeof audio.playPunch, 'function', 'playPunch must be a function');
assert.strictEqual(typeof audio.playBounce, 'function', 'playBounce must be a function');
assert.strictEqual(typeof audio.playRibbonHit, 'function', 'playRibbonHit must be a function');
assert.strictEqual(typeof audio.playWhistle, 'function', 'playWhistle must be a function');
assert.strictEqual(typeof audio.playCheer, 'function', 'playCheer must be a function');
assert.strictEqual(typeof audio.playPointScored, 'function', 'playPointScored must be a function');
assert.strictEqual(typeof audio.playFanfare, 'function', 'playFanfare must be a function');
assert.strictEqual(typeof audio.playBiergartenOompah, 'function', 'playBiergartenOompah must be a function');
assert.strictEqual(typeof audio.toggleMute, 'function', 'toggleMute must be a function');

// Test toggle mute logic
assert.strictEqual(audio.muted, false, 'audio should start unmuted');
const mutedState = audio.toggleMute();
assert.strictEqual(mutedState, true, 'toggleMute should return true when muted');
assert.strictEqual(audio.muted, true);
audio.toggleMute();
assert.strictEqual(audio.muted, false);

// Calling audio methods without AudioContext should not crash
assert.doesNotThrow(() => {
  audio.playPunch();
  audio.playBounce();
  audio.playRibbonHit();
  audio.playWhistle();
  audio.playCheer();
  audio.playPointScored();
  audio.playFanfare();
  audio.playBiergartenOompah();
});

console.log('PASS: test-audio.js passed');
