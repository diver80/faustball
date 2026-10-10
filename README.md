# 🏐 Faustball World Tour 2026

> **The World's Fastest Grass Field Sport:** Can you master the legendary 1-bounce rule and dive like a champion to win the World Faustball Cup?

A fast, funny, retro-arcade 2v2 Faustball (Fistball) game built with 100% vanilla Web standards and zero external dependencies, inspired by the architecture of `teams-fogger-amsterdam`.

---

## 🎮 Play Online

Once deployed to GitHub Pages, the live game is available at:  
👉 **[https://diver80.github.io/faustball/](https://diver80.github.io/faustball/)**

---

## 📖 The Sport & Rules

Faustball (Fistball) is one of humanity's oldest team sports, played on manicured grass courts divided by a 2-meter ribbon tape ("Die Leine"):

- **The 1-Bounce Rule:** Unlike volleyball, the ball is permitted to bounce on the grass **once** between consecutive player touches! A second consecutive bounce without a hit awards a point to the opponent.
- **3 Touches Maximum:**
  - **Touch 1 (Abwehr / Dig):** Absorb blistering spikes with a forearm bump or grass dive ("Hechtbagger") to pop the ball high.
  - **Touch 2 (Zuspiel / Set):** Precision high loft near the center ribbon tape.
  - **Touch 3 (Angriff / Spike):** Aerial fist smash or tactical drive over the tape into the opponent court.
- **The Center Ribbon ("Die Leine"):** Suspended at 2.0 meters with red-and-white athletic hazard stripes. The ball must clear over the tape without touching it or passing underneath.
- **Scoring:** Official sets are played to **11 points** (must win by 2; deuce hard-capped at 15 points). Matches are Best-of-3 sets.

---

## 🕹️ Controls

| Platform | Controls |
| :--- | :--- |
| **Move Left / Right** | Arrow Keys <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> |
| **Jump** | <kbd>↑</kbd> or <kbd>W</kbd> |
| **Grass Dive ("Hechtbagger")** | <kbd>↓</kbd> or <kbd>S</kbd> |
| **Hit / Spike** | <kbd>Space</kbd> or <kbd>Enter</kbd> |
| **Special Ability** | <kbd>Shift</kbd> (when Special Meter is full) |
| **Pause / Resume** | <kbd>P</kbd> or <kbd>Escape</kbd> |
| **Mobile / Tablet** | On-screen Virtual D-Pad buttons + Action buttons (Jump, Dive, Hit, Special) |
| **Sound Toggle** | Sound button in the top HUD (Web Audio API procedural sound engine) |

---

## 🧑‍💼 Playable Star Archetypes

1. **The Cannon ("Der Hammer-Schläger") 💥**
   - *Role:* Power Attacker & Jump Spiker.
   - *Perk:* +25% Spike speed & higher jump apex.
   - *Special Ability:* **Hammer Smash** — Blazing flaming fist spike that rockets deep into the opponent court.

2. **The Iron Wall ("Die Abwehr-Legende") 🛡️**
   - *Role:* Defensive Grass Sweeper.
   - *Perk:* 50% faster grass-dive recovery & extended reach.
   - *Special Ability:* **Golden Hechtbagger** — Full-reach diving save that converts any impossible low ball into a high rainbow set.

3. **The Spin Master ("Der Zuspiel-Magier") 🌪️**
   - *Role:* Tactical Setter & Precision Spiker.
   - *Perk:* Enhanced directional control & delicate drop-shots right over the ribbon tape.
   - *Special Ability:* **Tornado Slice** — Aerodynamic mid-flight curveball swerving away from the opponent defender.

---

## 🍺 Biergarten Mode (The Inverted Left/Right Challenge)

Toggle **Biergarten Mode** via the top HUD button or Start screen:
- Inverts **Left ↔ Right** navigation (<kbd>←</kbd> runs right, <kbd>→</kbd> runs left; jump, dive, and hit remain standard).
- Awards a permanent **1.25x Score Multiplier** for brave athletes!
- Features wobbly stumble sway animations, floating foam bubbles, and a cheerful synthesized Bavarian brass oompah chiptune fanfare!

---

## 🌍 World Tour Tournament Ladder

Advance through 4 stages against the world's most formidable Faustball nations:
1. **Quarterfinal:** 🇨🇭 **Switzerland** (Basel Arena) — Steady baseline defense and patient rallies.
2. **Semifinal:** 🇦🇹 **Austria** (Vöcklabruck Stadium) — Surgical sets and tactical drop shots.
3. **Showdown:** 🇧🇷 **Brazil** (Novo Hamburgo Park) — High-flying diving saves and athletic spikes.
4. **World Cup Final:** 🇩🇪 **Germany** (Pfungstadt Stadium) — Heavyweight power smashes and frontline blocks.

---

## 🚀 Publishing to GitHub Pages (`diver80`)

This repository is configured with zero dependencies and a GitHub Actions workflow ready to publish in minutes.

### Step 1: Commit Your Changes
```bash
git add .
git commit -m "feat: complete Faustball game ready for GitHub Pages"
```

### Step 2: Push to GitHub
```bash
# If remote is already added:
git push -u origin main

# Or add your remote repository:
git remote add origin https://github.com/diver80/faustball.git
git push -u origin main
```

### Step 3: Enable GitHub Pages
1. Go to your repository on GitHub: `https://github.com/diver80/faustball`
2. Click **Settings** ➡️ **Pages** (under Code and automation in the left sidebar).
3. Under **Build and deployment** > **Source**:
   - Select **GitHub Actions** (the included `.github/workflows/deploy.yml` will automatically build and publish).
4. Within 1 minute, your game will be live at:
   `https://diver80.github.io/faustball/`!

---

## 🛠️ Tech Stack & Architecture

- **Zero External Client Dependencies:** 100% vanilla HTML5, CSS3, and JavaScript (ES6+).
- **Procedural Canvas 2D Engine (`js/sprites.js`):** High-DPI procedural rendering with animated players, lawnmower-striped grass, grandstand spectators, and red/white striped ribbon tape.
- **Web Audio API Sound Synthesizer (`js/audio.js`):** Procedural fist impacts, turf thuds, metallic tape pings, referee whistle trill, crowd cheers, and Bavarian brass fanfare with zero audio asset loading lag.
- **Faustball Physics & Rules (`js/physics.js`):** Deterministic 2D projectile physics with strict 1-bounce grass rule, 3-touch limit, and ribbon clearance validation.
- **Tactical 2v2 AI (`js/ai.js`):** Analytical trajectory prediction, teammate cooperation, and tiered opponent AI profiles.
- **Automated Test Suite (`tests/`):** Headless Node.js integration tests for physics, rules, audio, sprites, AI, and game state.
