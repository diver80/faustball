const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync('js/sprites.js', 'utf8');
const ctx = { window: {}, setTimeout, clearTimeout, setInterval, clearInterval, console };
vm.createContext(ctx);
vm.runInContext(code, ctx);

const SpriteRenderer = ctx.window.SpriteRenderer || ctx.SpriteRenderer;
assert.ok(SpriteRenderer, 'SpriteRenderer must be defined');

const renderer = new SpriteRenderer();
assert.strictEqual(typeof renderer.update, 'function');
assert.strictEqual(typeof renderer.drawPitch, 'function');
assert.strictEqual(typeof renderer.drawPlayer, 'function');
assert.strictEqual(typeof renderer.drawBall, 'function');
assert.strictEqual(typeof renderer.drawParticles, 'function');
assert.strictEqual(typeof renderer.drawServingPrompt, 'function');
assert.strictEqual(typeof renderer.spawnTurfKick, 'function');
assert.strictEqual(typeof renderer.spawnFlameTrail, 'function');

// Test particle spawning and lifecycle
assert.strictEqual(renderer.particles.length, 0);
renderer.spawnTurfKick(200, 400, 6);
assert.strictEqual(renderer.particles.length, 6, 'Should spawn 6 turf particles');

// Update particles over time
renderer.update(0.1);
assert.ok(renderer.animTime > 0, 'animTime should advance');
assert.ok(renderer.particles[0].life < 1.0, 'Particle life should decrease');

// After enough time, particles should expire
renderer.update(2.0);
assert.strictEqual(renderer.particles.length, 0, 'Expired particles should be cleaned up');

// Test flame trail spawning
renderer.spawnFlameTrail(400, 250);
assert.ok(renderer.particles.length >= 2, 'Should spawn flame particles');
renderer.update(2.0);
assert.strictEqual(renderer.particles.length, 0);

// Test mock canvas drawing calls do not crash
const mockCtx = {
  save: () => {},
  restore: () => {},
  beginPath: () => {},
  closePath: () => {},
  moveTo: () => {},
  lineTo: () => {},
  arc: () => {},
  rect: () => {},
  roundRect: () => {},
  fill: () => {},
  stroke: () => {},
  fillRect: () => {},
  strokeRect: () => {},
  fillText: () => {},
  translate: () => {},
  rotate: () => {},
  scale: () => {},
  clip: () => {},
  ellipse: () => {},
  createRadialGradient: () => ({ addColorStop: () => {} }),
  setLineDash: () => {},
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 1,
  font: '',
  textAlign: '',
  textBaseline: ''
};

const court = { width: 800, height: 450, groundY: 400, ribbonX: 400, ribbonHeight: 120 };
assert.doesNotThrow(() => {
  renderer.drawPitch(mockCtx, court, 800, 450);
  renderer.drawBall(mockCtx, { x: 300, y: 250, vx: 50, vy: -50, radius: 8 }, 400);
  renderer.drawPlayer(mockCtx, { x: 250, y: 360, vx: 10, vy: 0, state: 'idle', facing: 'right', isUser: true }, 'cannon', { primary: '#fff', secondary: '#000' }, false);
  renderer.drawPlayer(mockCtx, { x: 250, y: 360, vx: 10, vy: 0, state: 'diving', facing: 'right', isUser: false }, 'iron_wall', { primary: '#c00', secondary: '#fff' }, true);
  renderer.drawServingPrompt(mockCtx, 'left', 800, 450);
  renderer.drawServingPrompt(mockCtx, 'right', 800, 450);
  renderer.drawParticles(mockCtx);
});

console.log('PASS: test-sprites.js passed');
