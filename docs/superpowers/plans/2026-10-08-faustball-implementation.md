# Faustball Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a fast, retro-arcade 2v2 Faustball (Fistball) browser game with zero external dependencies, procedural Canvas 2D graphics, Web Audio API sound synthesis, authentic 1-bounce / 3-touch rules, cooperative AI, World Championship tour, Biergarten mode, and automated GitHub Pages deployment.

**Architecture:** Modular vanilla JS architecture matching `teams-fogger-amsterdam` (separated into `physics.js`, `audio.js`, `sprites.js`, `ai.js`, `game.js`, with headless Node.js tests).

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript (ES6+), Canvas 2D API, Web Audio API, Node.js (for headless testing), GitHub Actions.

## Global Constraints
- Zero external client dependencies (no npm client bundles, no CDN frameworks, no external image/audio files).
- 100% synthesized procedural audio via Web Audio API.
- 100% procedural Canvas 2D rendering.
- 1-Bounce Rule strictly enforced (the ball can bounce at most once per touch on each half-court).
- 3 Touches per team strictly enforced.
- Responsive mobile & desktop support (Arrow/WASD keys + on-screen virtual controls).
- GitHub Pages auto-deploy via GitHub Actions.

---

### Task 1: Core Physics & Faustball Rule Engine (`js/physics.js` & tests)

**Files:**
- Create: `js/physics.js`
- Test: `tests/test-physics.js`
- Test: `tests/test-rules.js`

**Interfaces:**
- Produces:
  - `FaustballPhysics` class:
    - `constructor(courtConfig)`
    - `update(dt)`: updates ball velocity, gravity, bounces, and collisions
    - `hitBall(team, player, type, direction)`: applies impulse to ball, resets bounce counter on that side, increments team touch count
    - `checkFault()`: returns null or `{ faultType, scoringTeam, reason }`
    - `resetServe(servingTeam, serverX, serverY)`
  - State attributes: `ball { x, y, vx, vy, radius }`, `court { width, height, ribbonX, ribbonHeight, groundY }`, `rallyState { activeTeam, bouncesSinceTouch, touchesTeamLeft, touchesTeamRight, lastHitPlayer }`

- [ ] **Step 1: Write the failing tests for physics & rules**

Create `tests/test-rules.js` and `tests/test-physics.js`:
```javascript
// tests/test-rules.js
const assert = require('assert');
const { FaustballPhysics } = require('../js/physics.js');

const court = { width: 800, height: 450, groundY: 400, ribbonX: 400, ribbonHeight: 120 };
const physics = new FaustballPhysics(court);

// Test 1: Serve setup
physics.resetServe('left', 200, 360);
assert.strictEqual(physics.rallyState.activeTeam, 'left');
assert.strictEqual(physics.rallyState.bouncesSinceTouch, 0);

// Test 2: Ball bounces once on left side - valid
physics.ball.x = 250;
physics.ball.y = 400;
physics.ball.vy = 200;
physics.update(0.016);
assert.strictEqual(physics.rallyState.bouncesSinceTouch, 1);
assert.strictEqual(physics.checkFault(), null);

// Test 3: Ball bounces a SECOND time consecutively without touch - fault!
physics.ball.vy = 200;
physics.update(0.016);
const fault = physics.checkFault();
assert.ok(fault, 'Second consecutive bounce must trigger a fault');
assert.strictEqual(fault.scoringTeam, 'right');
assert.strictEqual(fault.faultType, 'DOUBLE_BOUNCE');

console.log('PASS: test-rules.js passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test-rules.js`  
Expected: FAIL with `Cannot find module '../js/physics.js'`

- [ ] **Step 3: Implement `js/physics.js`**

Implement deterministic Faustball physics:
- Gravity ($g \approx 780 \text{ px/s}^2$)
- Restitution on grass bounce ($e \approx 0.72$)
- Ribbon tape collision (top of ribbon tape at `ribbonHeight`, width `6px`, bounces back if striking the tape or under)
- Touch counting: increments team touches (max 3), switches active team when ball crosses `ribbonX`, resets consecutive bounce count upon valid player touch.
- Export for both Node.js (`module.exports`) and Browser (`window.FaustballPhysics`).

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test-rules.js` and `node tests/test-physics.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/physics.js tests/test-physics.js tests/test-rules.js
git commit -m "feat: core Faustball physics and 1-bounce/3-touch rules engine"
```

---

### Task 2: Procedural Web Audio Engine (`js/audio.js` & tests)

**Files:**
- Create: `js/audio.js`
- Test: `tests/test-audio.js`

**Interfaces:**
- Produces:
  - `SoundEngine` class (attached to `window.soundEngine` in browser):
    - `init()`: starts or resumes `AudioContext`
    - `toggleMute()`: returns boolean
    - `playPunch()`: fist impact sound (tight punch with transient noise)
    - `playBounce()`: grass ground thud sound
    - `playRibbonHit()`: metallic tape/post ping
    - `playWhistle()`: authentic referee double-trill whistle
    - `playCheer()`: crowd cheer noise sweep
    - `playPointScored()`: short uplifting jingle
    - `playFanfare()`: tournament victory fanfare
    - `playBiergartenOompah()`: Bavarian brass oompah chiptune riff

- [ ] **Step 1: Write the failing test for sound engine**

Create `tests/test-audio.js`:
```javascript
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync('js/audio.js', 'utf8');
const ctx = { window: {}, setTimeout, clearTimeout, setInterval, clearInterval };
vm.createContext(ctx);
vm.runInContext(code, ctx);

const SoundEngine = ctx.window.SoundEngine || ctx.SoundEngine;
assert.ok(SoundEngine, 'SoundEngine must be defined');

const audio = new SoundEngine();
assert.strictEqual(typeof audio.playPunch, 'function');
assert.strictEqual(typeof audio.playBounce, 'function');
assert.strictEqual(typeof audio.playWhistle, 'function');
assert.strictEqual(typeof audio.playBiergartenOompah, 'function');

console.log('PASS: test-audio.js passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/test-audio.js`  
Expected: FAIL (`js/audio.js` does not exist)

- [ ] **Step 3: Implement `js/audio.js`**

Implement `SoundEngine` utilizing Web Audio API oscillators, biquad filters, and gain nodes. Support mock environment when `AudioContext` is absent (so tests pass in Node.js). Include Bavarian brass oompah melody using synthesized trumpet/tuba waveforms.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/test-audio.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/audio.js tests/test-audio.js
git commit -m "feat: procedural Web Audio engine with fist hits, whistle, and Biergarten brass"
```

---

### Task 3: Procedural Canvas 2D Renderer (`js/sprites.js`)

**Files:**
- Create: `js/sprites.js`
- Test: `tests/test-sprites.js`

**Interfaces:**
- Produces:
  - `SpriteRenderer` class:
    - `update(dt)`: updates animation frame timers, grass particles, and ball spin
    - `drawPitch(ctx, court, width, height)`: renders lush grass stripes, chalk lines, 3m service lines, crowd stadium, and center ribbon tape with red/white stripes
    - `drawPlayer(ctx, player, archetype, jerseyColor, isBiergarten)`: draws running, jumping, fist-cocking, and diving athlete sprites with team colors and stumble sway
    - `drawBall(ctx, ball, groundY)`: draws rotating ball with realistic altitude drop-shadow
    - `drawParticles(ctx)`: draws turf grass clumps and special flame trails
    - `spawnTurfKick(x, y)`: spawns grass particles on dive or hard plant
    - `spawnFlameTrail(x, y)`: spawns particles for The Cannon special smash

- [ ] **Step 1: Write test for `SpriteRenderer`**

Create `tests/test-sprites.js` checking sprite rendering instantiation, particle lifecycle, and color lookup tables.

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-sprites.js`  
Expected: FAIL

- [ ] **Step 3: Implement `js/sprites.js`**

Implement full Canvas 2D procedural graphics:
- Stadium grandstand background with spectators and flags.
- Striped grass turf (alternating green shades).
- Center ribbon tape with red/white diagonal hazard/athletic stripes, tension wires, and red antennas.
- Dynamic athlete models: body torso, head/hairband, arm with closed fist, leg running cycle, dive sliding pose ("Hechtbagger").
- Ball with seam rotation and ground shadow shrinking/expanding based on altitude.
- Particle manager for turf debris, impact bursts, and flaming smash trails.

- [ ] **Step 4: Run test to verify passes**

Run: `node tests/test-sprites.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/sprites.js tests/test-sprites.js
git commit -m "feat: high-DPI procedural Canvas 2D renderer for arena, players, and ribbon"
```

---

### Task 4: AI & Teammate Cooperation Engine (`js/ai.js` & tests)

**Files:**
- Create: `js/ai.js`
- Test: `tests/test-ai.js`

**Interfaces:**
- Produces:
  - `FaustballAI` class:
    - `update(dt, ball, teamLeftPlayers, teamRightPlayers, physics)`
    - Teammate AI:
      - Automatically assists player (if player is back defender, teammate moves into front setter position to loft ball; if player dug ball on touch 1, teammate sets on touch 2 for player's spike on touch 3).
    - Opponent AI:
      - 4 difficulty presets: `switzerland` (tier 1), `austria` (tier 2), `brazil` (tier 3), `germany` (tier 4).
      - Tactical decision making: prediction of ball bounce point, diving saves for low balls, jumping spikes near the ribbon, aimed drop shots over the ribbon tape.

- [ ] **Step 1: Write tests for AI decision making**

Create `tests/test-ai.js`:
- Test teammate positioning when player has possession.
- Test opponent reaction time and trajectory prediction.

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-ai.js`  
Expected: FAIL

- [ ] **Step 3: Implement `js/ai.js`**

Implement `FaustballAI`:
- Ball landing prediction calculation using current $vx, vy, g$.
- Dynamic role assignment (Defender vs. Attacker).
- Dive threshold: when ball is landing too far for a run, trigger dive ("Hechtbagger").
- Tiered reaction delays and accuracy based on country archetype.

- [ ] **Step 4: Run test to verify passes**

Run: `node tests/test-ai.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add js/ai.js tests/test-ai.js
git commit -m "feat: cooperative teammate AI and tiered international opponent AI"
```

---

### Task 5: Game Loop, Controls & Tournament State Machine (`js/game.js`, `index.html`, `style.css`)

**Files:**
- Create: `index.html`
- Create: `style.css`
- Create: `js/game.js`
- Test: `tests/test-game.js`

**Interfaces:**
- Consumes: `FaustballPhysics`, `SoundEngine`, `SpriteRenderer`, `FaustballAI`
- Produces:
  - Responsive arcade web application.
  - HUD: Score (11-pt sets), Sets Won, Touches (1/2/3), Bounce Indicator, Special Meter, Sound & Biergarten buttons.
  - Modals: Character Selection (The Cannon, The Iron Wall, The Spin Master), Tournament Ladder (Switzerland -> Austria -> Brazil -> Germany), Match Won / Lost, Trophy Celebration.
  - Input Handling: Keyboard (<kbd>←</kbd><kbd>→</kbd> or <kbd>A</kbd><kbd>D</kbd>, <kbd>W</kbd>/<kbd>↑</kbd> Jump, <kbd>S</kbd>/<kbd>↓</kbd> Dive, <kbd>Space</kbd> Hit, <kbd>Shift</kbd> Special), Mobile on-screen Virtual D-pad + action buttons.
  - Biergarten Mode toggle: inverts left/right movement, triggers wobbly stumble sway, activates brass fanfare, adds 1.25x score multiplier.

- [ ] **Step 1: Write integration tests for game state machine**

Create `tests/test-game.js`:
- Test set scoring to 11 with deuce (must win by 2).
- Test tournament progression through 4 stages.
- Test Biergarten mode control reversal flag.

- [ ] **Step 2: Run test to verify failure**

Run: `node tests/test-game.js`  
Expected: FAIL

- [ ] **Step 3: Implement `index.html`, `style.css`, and `js/game.js`**

- Build clean, responsive HTML structure matching `teams-fogger-amsterdam` quality.
- Add retro neon-green stadium styling with crisp typography and mobile action overlays.
- Wire up game loop (`requestAnimationFrame`), delta-time stepping, touch controls, keyboard listeners, archetype perks, and special ability activation.

- [ ] **Step 4: Run test to verify passes**

Run: `node tests/test-game.js`  
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add index.html style.css js/game.js tests/test-game.js
git commit -m "feat: complete Faustball game loop, UI HUD, controls, and tournament mode"
```

---

### Task 6: GitHub Pages Deployment, Verification & Documentation (`.github/workflows/deploy.yml`, `README.md`)

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `README.md`
- Create: `.nojekyll`

**Interfaces:**
- Automated GitHub Actions workflow to deploy the root directory to GitHub Pages upon push to `main`.
- Detailed README with instructions for playing, controls, archetypes, and deployment steps.

- [ ] **Step 1: Create `.github/workflows/deploy.yml` and `.nojekyll`**

Configure standard GitHub Pages deployment using `actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4`.

- [ ] **Step 2: Create comprehensive `README.md`**

Document Faustball rules (1-bounce, 3-touch, ribbon tape), player archetypes, Biergarten mode, controls, and step-by-step instructions to push to GitHub and host live on GitHub Pages.

- [ ] **Step 3: Run all automated tests**

Run:
```bash
node tests/test-physics.js
node tests/test-rules.js
node tests/test-audio.js
node tests/test-sprites.js
node tests/test-ai.js
node tests/test-game.js
```
Expected: All tests PASS!

- [ ] **Step 4: Commit all files**

```bash
git add .
git commit -m "feat: add GitHub Pages deployment workflow, documentation, and verify test suite"
```

- [ ] **Step 5: Configure and push to GitHub remote**

Configure git remote if provided (or guide the user to push to `diver80/faustball`).
