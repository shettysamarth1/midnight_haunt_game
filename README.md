# ⛧ MIDNIGHT HAUNT
## Spooky Slicer: Crypt of the Wandering Souls
### Rive Halloween Challenge | Competition-Grade Interactive Horror Experience

> *“Every soul leaves a mark. Every cut awakens the dead.”*

**Midnight Haunt** is a competition-grade interactive horror experience and high-speed arcade mini-game built for the **Rive Halloween Challenge**. It marries modern Victorian Gothic horror with bioluminescent energy, combining the official **Rive CLI**, **GPU Canvas WGSL shaders**, **Luau scripting**, **Three.js procedural 3D environments**, and **Web Audio API procedural sound synthesis**.

---

## 🎮 Playable Experience: Spooky Slicer

Descend past the cemetery gates into the crypt and survive **60 seconds of Nightmare Mode**:

- **Wandering Pumpkins (+100 PTS):** Clean slices erupt into amber bursts and squelches.
- **Spectral Wisps (+250 PTS):** Ethereal chimes activate a **3-second Time Freeze**, halting all entity ballistic trajectories.
- **Witch’s Candy (+150 PTS):** Slicing 3 consecutive treats ignites **Frenzy Harvest**, doubling point gains with rapid entity cascades.
- **Cursed Skulls (DANGER):** Hitting a skull costs 1 of your 3 lives and shatters your combo streak. Zero lives ends your run.
- **Combo Multipliers:** Rapid consecutive cuts progress through **2x, 4x, and 8x** multiplier tiers.
- **Victory Condition:** Survive the entire 60 seconds with at least one life remaining.

---

## 🔮 Rive CLI & GPU Canvas Technical Deliverables

This project strictly adheres to non-negotiable Rive CLI and GPU Canvas requirements:

1. **Rive Markup Language (`scene.rml`):**
   - Declares the artboard, background fill, state machine, and `<ScriptedLayout>` component referencing `warden.luau`.
2. **Signature WGSL Shader (`spectral_veil.wgsl` & `shaders/spectral-veil.wgsl`):**
   - Organic multi-octave Fractal Brownian Motion (fBm) noise generating slow-moving mist tendrils.
   - Dual color ramps: Crypt Mist (`#170F24`), Ghostlight Violet (`#9D4EDD`), and high-energy Toxic Green (`#39FF14`).
   - Radial vignette and soft luminous energy falloff.
3. **Luau GPU Canvas Controller (`warden.luau`):**
   - Fetches the compiled WGSL shader via `context:shader('spectral_veil')`.
   - Allocates a Rive `GPUCanvas` via `context:gpuCanvas({ width = 500, height = 500 })`.
   - Constructs a `GPUPipeline` and executes render passes (`pass:draw(3, 1, 0)`).
   - Renders **The Hollow Warden** character with dynamic pointer tracking, levitation bobbing, and click flares.
4. **Compiled `.riv` Runtime Asset (`build/midnight-haunt.riv`):**
   - Fully compiled via `rive . --once` (55,182 bytes, 0 errors, 0 warnings).

---

## 🏗️ Layered Viewport Architecture

- **Layer 1 — Three.js WebGL Background:** Procedural low-poly cemetery with winding cracked path, crooked gravestones, Celtic crosses, twisted trees, glowing pumpkins with internal point lights, full moon, and 800 buffer particles.
- **Layer 2 — Narrative Content:** 4 cinematic story chapters driven by scroll:
  - *Chapter 1: The Cemetery Gates (0–25%)*
  - *Chapter 2: The Crypt Descent (26–55%)*
  - *Chapter 3: The Altar Entrance (56–80%)*
  - *Chapter 4: The Game Arena (81–100%)*
- **Layer 3 — Playable Game Arena:** High-performance Canvas 2D engine with deterministic ballistic physics and continuous segment-circle collision detection.
- **Layer 4 — HUD & Accessibility:** Soul score, timer, lives, combo badges, Frenzy/Freeze indicators, keyboard shortcuts, reduced-motion compliance, and high score persistence.

---

## 🔊 Procedural Web Audio Engine

No external sound files required! All audio is procedurally synthesized via the Web Audio API:
- Deep minor-chord organ drone (55Hz / 82.4Hz) with resonant lowpass filtering.
- Synthesized spectral wind through bandpass white noise.
- Exponential pitch-bend blade swooshes.
- Low-frequency pumpkin thud/squelch.
- Harmonic crystal chime chord for spectral wisps.
- Harsh discordant minor-second sting for cursed skulls.
- Ascending fanfare for Frenzy Harvest.
- Haptic feedback pulses via `navigator.vibrate`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)
- Rive CLI (v1.5+)

### Installation & Run

```bash
# Clone or navigate to the repository
cd midnight-haunt

# Install dependencies
npm install

# Verify Rive CLI compilation
npm run rive:verify
# or: rive . --verify

# Compile the Rive .riv binary
npm run rive:build
# or: rive . --once

# Run automated tests
npm test

# Start local web development preview
npm run dev

# Build production bundle
npm run build
```

---

## 🧪 Automated Test Suite

Run `npm test` to execute the automated verification suite:
- Ballistic trajectory integration & bounds checks.
- Time freeze motion suspension.
- Segment-versus-circle swipe collision math.
- Duplicate-hit prevention across animation frames.
- Combo multiplier scaling (2x, 4x, 8x).
- Candy streak & Frenzy Harvest activation.
- Cursed skull life loss and game over condition.
- State machine lifecycle transitions.
