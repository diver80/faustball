# Faustball Arcade Game Specification & Design Document

**Date:** 2026-10-08  
**Topic:** Retro-Arcade Faustball (Fistball) Web Game  
**Inspiration & Stack Reference:** `teams-fogger-amsterdam` (Zero-dependency vanilla HTML5, Canvas 2D, Web Audio API, GitHub Pages)

---

## 1. Executive Summary & Vision

Faustball (Fistball) is one of the world's oldest and fastest field sports, played on a grass court divided by a 2-meter ribbon tape ("Leine"). Unlike volleyball, **the ball is allowed to bounce once on the grass between each touch**, and players can perform legendary diving saves ("Hechtbagger") and supersonic fist smashes.

This project delivers a fast-paced, high-charm, retro-arcade 2v2 Faustball game for desktop and mobile browsers. It adheres strictly to the zero-dependency philosophy of `teams-fogger-amsterdam`, delivering crisp procedural Canvas 2D graphics, a 100% procedural Web Audio synthesizer, smart cooperative AI, a World Championship tour, and a hilarious post-match "Biergarten Mode" challenge.

---

## 2. Core Game Rules & Physics

### 2.1 The Pitch & Center Ribbon ("Die Leine")
- **Perspective**: Side-view 2D grass arena (with animated crowd, flags, and open sky).
- **Pitch Dimensions**: Scaled grass court with left court (Player Team) and right court (Opponent Team).
- **The Ribbon Tape**: Suspended in the exact horizontal center at 2.0m scaled height, styled with authentic alternating red-and-white stripes and vertical antenna poles.
- **Service Lines**: Marked at 3m from the center ribbon on each side.

### 2.2 Faustball Ballistics & State Engine
1. **The 1-Bounce Rule**:
   - The ball may bounce on the grass at most **once** before a player touches it.
   - If the ball bounces a second time on the same half-court without being touched, the rally ends immediately and a point is awarded to the opposing team.
2. **Maximum 3 Touches per Team**:
   - **Touch 1 (Abwehr / Dig)**: Forearm bump or grass dive absorbing ball velocity and popping it into a high arc.
   - **Touch 2 (Zuspiel / Set)**: Precision pass lofted high toward the center ribbon for the attacker.
   - **Touch 3 (Angriff / Spike)**: Aerial fist smash or placement drive over the ribbon into the opponent court.
   - If a 4th touch occurs on the same side, a fault is called and the opposing team scores.
3. **Ribbon & Boundary Faults**:
   - **Ribbon Fault**: Ball touches the ribbon tape or passes below the tape line.
   - **Out of Bounds**: Ball hits outside the pitch boundary lines.
   - **Line Fault**: Serving player must strike the ball from behind the 3m service line.
4. **Scoring Model**:
   - Sets are played to **11 points** (must win by 2 points; e.g. 11-9, 13-11, hard capped at 15).
   - Quick Match is Best-of-1 set. World Championship matches are Best-of-3 sets.

---

## 3. Player Controls & Archetypes

### 3.1 Controls
| Action | Keyboard (Desktop) | Mobile / Tablet |
| :--- | :--- | :--- |
| **Move Left / Right** | <kbd>←</kbd> <kbd>→</kbd> or <kbd>A</kbd> <kbd>D</kbd> | Virtual On-Screen Joystick / Left-Right buttons |
| **Jump** | <kbd>↑</kbd> or <kbd>W</kbd> | On-Screen <kbd>JUMP</kbd> Button |
| **Grass Dive ("Hechtbagger")** | <kbd>↓</kbd> or <kbd>S</kbd> | On-Screen <kbd>DIVE</kbd> Button |
| **Hit / Spike** | <kbd>Space</kbd> or <kbd>Enter</kbd> | On-Screen <kbd>HIT</kbd> Button |
| **Special Ability** | <kbd>Shift</kbd> | On-Screen <kbd>SPECIAL</kbd> Button |
| **Pause / Menu** | <kbd>Escape</kbd> or <kbd>P</kbd> | Top HUD Pause Button |

### 3.2 Playable Star Archetypes
Before starting a tournament, the player chooses their star character:

1. **The Cannon ("Der Hammer-Schläger") 💥**
   - *Role*: Power Attacker & Jump Spiker.
   - *Perk*: +25% Spike speed & increased vertical jump height.
   - *Special Ability — Hammer Smash*: Unleashes a blazing flaming fist spike with particle trails targeted deep at the opponent baseline.
2. **The Iron Wall ("Die Abwehr-Legende") 🛡️**
   - *Role*: Grass Sweeper & Defense Specialist.
   - *Perk*: 50% faster grass-dive recovery and wider pickup hitbox.
   - *Special Ability — Golden Hechtbagger*: Instantly lunges to any falling ball on the player's side, turning a difficult dig into a floating, high set.
3. **The Spin Master ("Der Zuspiel-Magier") 🌪️**
   - *Role*: Precision Setter & Tactical Spiker.
   - *Perk*: Sharper directional aiming on hits and delicate drop-shot placement right over the ribbon tape.
   - *Special Ability — Tornado Slice*: Curves the ball in mid-air to deceive the opponent defender.

### 3.3 "Biergarten Mode" Modifier 🍺 (Tequila Mode Equivalent)
- Can be toggled on/off in the HUD or Start Menu.
- **Gameplay Effect**: Inverts Left ↔ Right controls (<kbd>←</kbd> runs Right, <kbd>→</kbd> runs Left). Jump, Dive, and Hit remain standard.
- **Visuals**: Players sway with a comical wobbly stumble; crowd holds beer steins with rising foam bubbles.
- **Audio**: Plays a cheerful Bavarian brass oompah chiptune fanfare.
- **Reward**: Grants a persistent **1.25x Tournament Score Multiplier**.

---

## 4. Artificial Intelligence (AI)

### 4.1 Teammate AI (2v2 Cooperation)
- The user controls whichever player is closest to the ball or active on reception.
- The teammate AI dynamically covers the complimentary role:
  - If the player executes Touch 1 (Reception), the AI automatically moves under the ball to execute Touch 2 (Set towards the ribbon).
  - If the AI executes Touch 1, it calls the ball and sets it for the player to jump and smash on Touch 3.
  - Position balance: AI never crowds the player; maintains optimal court spacing (Front Attacker vs. Back Defender).

### 4.2 Opponent AI (Tiered World Tour Teams)
- **Stage 1: Switzerland 🇨🇭 (Quarterfinal)**
  - Steady baseline defense, moderate jump height, patient placement.
- **Stage 2: Austria 🇦🇹 (Semifinal)**
  - High tactical variety, angled drop shots over the ribbon, quick recovery.
- **Stage 3: Brazil 🇧🇷 (Bronze / Showdown)**
  - Dynamic diving saves, athletic high jumps, fast baseline returns.
- **Stage 4: Germany 🇩🇪 (World Cup Final)**
  - Ruthless power smashes, impenetrable frontline blocks, minimal reaction delay.

---

## 5. Technical Architecture & File Layout

```text
faustball/
├── index.html                   # Shell, stadium wrapper, HUD, modals, touch controls
├── style.css                    # Retro stadium styling, responsive canvas layout
├── js/
│   ├── audio.js                 # Web Audio API procedural sound engine
│   ├── physics.js               # Ball kinematics, grass bounce, 1-bounce & 3-touch rules
│   ├── sprites.js               # Canvas 2D procedural rendering (grass, players, ribbon, crowd)
│   ├── ai.js                    # Teammate cooperation and tiered opponent AI logic
│   └── game.js                  # State machine, input management, match loop, tournament tracker
├── tests/
│   ├── test-physics.js          # Node tests for gravity, ball bounces, boundaries
│   ├── test-rules.js            # Node tests for 1-bounce rule and 3-touch fault logic
│   ├── test-audio.js            # Node tests for sound engine synthesis methods
│   └── test-ai.js               # Node tests for AI positioning and state transitions
├── .github/
│   └── workflows/
│       └── deploy.yml           # GitHub Pages automated deployment workflow
└── README.md                    # Lore, rules, gameplay controls, and deployment instructions
```

### 5.1 Zero-Dependency Procedural Rendering (`sprites.js`)
- 100% Canvas 2D drawing (no PNG or image asset requests, zero loading latency).
- High-DPI (`devicePixelRatio`) scaling for crisp rendering on Retina screens.
- Smooth animations:
  - Running leg strides with arm swing.
  - Jump-smash windup and punch impact frame.
  - Horizontal grass slide with kick-up turf particles.
  - Dynamic ball rotation and altitude shadow scaling.
  - Striped red-and-white ribbon tape with wind flutter.

### 5.2 Procedural Web Audio Synthesis (`audio.js`)
- **Fist Strike**: Low triangle wave oscillator (120Hz -> 45Hz) blended with a punchy noise burst.
- **Turf Bounce**: Sub-bass thud (80Hz with fast decay) and grass rustle.
- **Ribbon Ping**: High resonant bell/pluck (880Hz ringing).
- **Whistle**: Dual square/sine oscillator with fast trill modulation (3.0kHz / 3.2kHz).
- **Crowd Roar**: Modulated pink noise bandpassed to simulate roar of stadium fans.
- **Fanfares**: Retro chiptune victory theme + Biergarten brass fanfare.

---

## 6. Testing & Quality Assurance

- **Physics & Rules Tests (`tests/test-rules.js` & `tests/test-physics.js`)**:
  - Validates that a second consecutive bounce without a touch correctly increments the fault counter and awards points.
  - Validates that a 4th touch on one side triggers a 4-touch fault.
  - Validates ribbon collision detection (over vs. under vs. tape hit).
- **Audio Verification (`tests/test-audio.js`)**:
  - Verifies presence of all synthesized audio hooks.
- **AI Behavior Tests (`tests/test-ai.js`)**:
  - Confirms state transitions from idle -> approach -> pass/spike.

---

## 7. Deployment Plan (GitHub Pages)

- Project directory will be initialized with `git init`.
- Configured with `.github/workflows/deploy.yml` for automated GitHub Pages hosting.
- A comprehensive `README.md` will provide full instructions for playing and deploying to GitHub under any user repository (e.g., `diver80/faustball`).
