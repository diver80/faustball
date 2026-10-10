# 🏐 Faustball World Tour 2026 (Retro-Arcade Fistball)

> **Experience the thrill of Europe's fastest grass sport!** Direct player control, authentic 1-bounce grass rules, diving saves ("Hechtbagger"), high-velocity power spikes, and cooperative teammate 2v2 action.

A high-performance, zero-dependency, retro-arcade Faustball game built with HTML5 Canvas 2D and the Web Audio API.

---

## 🎮 Play Online

Play immediately in your browser on GitHub Pages:
👉 **[https://diver80.github.io/faustball/](https://diver80.github.io/faustball/)**

---

## 📖 What is Faustball (Fistball)?

Faustball is one of the world's oldest and most dynamic athletic field sports, dating back to ancient Rome and standardized in Germany, Austria, and Switzerland:

- **Direct Player Control:** You are in direct control of your player! Look for the golden **▼ YOU** floating indicator and the pulsing grass aura under your feet. Press <kbd>Q</kbd> or <kbd>Tab</kbd> anytime to toggle control between your front attacker and back defender.
- **The 1-Bounce Rule:** Unlike volleyball, the ball is permitted to bounce on the grass **once** between consecutive player touches! A second consecutive bounce without a hit awards a point to the opponent.
- **3 Touches Maximum:**
  - **Touch 1 (Abwehr / Dig):** Absorb blistering spikes with a forearm bump or grass dive ("Hechtbagger") to pop the ball high.
  - **Touch 2 (Zuspiel / Set):** Precision high loft near the center ribbon tape.
  - **Touch 3 (Angriff / Spike):** Aerial fist smash or tactical drive over the tape into the opponent court.
- **The Center Ribbon ("Die Leine"):** Suspended at 2.0 meters with red-and-white athletic hazard stripes. The ball must clear over the tape without touching it or passing underneath.
- **Scoring:** Official sets are played to **11 points** (must win by 2; deuce hard-capped at 15 points). Matches are Best-of-3 sets.

---

## 🕹️ Controls

| Platform / Action | Controls |
| :--- | :--- |
| **Active Player Identity** | Golden **▼ YOU** badge overhead + glowing turf ring |
| **Move Left / Right** | Arrow Keys <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> |
| **Jump** | <kbd>↑</kbd> or <kbd>W</kbd> |
| **Grass Dive ("Hechtbagger")** | <kbd>↓</kbd> or <kbd>S</kbd> |
| **Serve & Power Spike** | <kbd>Space</kbd> or <kbd>Enter</kbd> (Auto-bump on body contact!) |
| **Switch Player** | <kbd>Q</kbd> or <kbd>Tab</kbd> (or HUD button 🔁) |
| **Special Ability** | <kbd>Shift</kbd> (when Special Meter is full) |
| **Pause / Resume** | <kbd>P</kbd> or <kbd>Escape</kbd> |
| **Mobile / Tablet** | Virtual D-Pad + Jump, Dive, Hit, Switch & Special buttons |
| **Sound Toggle** | Sound button in top HUD (Web Audio API procedural sound engine) |

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

## 🛠️ Tech Stack & Architecture

- **Zero External Client Dependencies:** 100% vanilla HTML5, CSS3, and JavaScript (ES6+).
- **Procedural Canvas 2D Engine (`js/sprites.js`):** High-DPI procedural rendering with animated players, lawnmower-striped grass, grandstand spectators, overhead YOU indicators, and red/white striped ribbon tape.
- **Web Audio API Sound Synthesizer (`js/audio.js`):** Procedural fist impacts, turf thuds, metallic tape pings, referee whistle trill, crowd cheers, and Bavarian brass fanfare with zero audio asset loading lag.
- **Faustball Physics & Rules (`js/physics.js`):** Deterministic 2D projectile physics with strict 1-bounce grass rule, 3-touch limit, and ribbon clearance validation.
- **Tactical 2v2 AI (`js/ai.js`):** Analytical trajectory prediction, teammate cooperation adapting dynamically to the active user player, and tiered opponent AI profiles.
- **Automated Test Suite (`tests/`):** Headless Node.js integration tests for physics, rules, audio, sprites, AI, and game state.
