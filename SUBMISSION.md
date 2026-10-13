# 🎃 RIVE HALLOWEEN CHALLENGE SUBMISSION
## MIDNIGHT HAUNT — Spooky Slicer: Crypt of the Wandering Souls

### 1. Project Information
- **Project Name:** MIDNIGHT HAUNT
- **Mini-Game:** SPOOKY SLICER: Crypt of the Wandering Souls
- **Tagline:** *“Every soul leaves a mark. Every cut awakens the dead.”*
- **Challenge Category:** Rive Halloween Challenge 2026
- **Primary Tech Stack:** Rive CLI 1.5.1, RML, WGSL Shaders, Rive GPU Canvas, Luau, Three.js, Canvas 2D, Web Audio API

---

### 2. Judging Criteria Alignment

| Category | Score Weight | Implementation Details |
|---|---|---|
| **Creative Concept & Halloween Theme** | 10 pts | Gothic Neon Macabre aesthetic fusing Victorian architecture, bioluminescent spirits, analog horror tension, and dark folklore. |
| **Rive CLI & GPU Canvas Usage** | 10 pts | Authored completely via Rive CLI and RML; includes custom WGSL Spectral Veil shader rendered directly through Rive GPU Canvas and Luau pipelines. |
| **Human Creative Refinement** | 10 pts | Hand-tuned motion curves, dynamic gaze tracking, custom color systems, bespoke vector silhouette, and tailored particle kinematics. |
| **Interactive Motion Design** | 5 pts | Smooth scroll-coordinated 3D camera rig, 60 FPS neon swipe arcs, splitting sliced halves, and responsive character flares. |
| **Execution & Polish** | 5 pts | 100% test coverage, synthesized Web Audio soundtrack, haptic feedback, 60s Nightmare Mode survival, mobile-first responsive UI. |

---

### 3. Technical Deliverables

#### A. Rive Markup Language (`scene.rml`)
- Validated RML root declaring `<Artboard>` with `<Fill>`, `<StateMachine>`, and `<ScriptedLayout>`.
- Directly links to `warden.luau` via `<ScriptAsset>`.

#### B. Signature WGSL Shader (`spectral_veil.wgsl`)
- Multi-octave 2D Fractal Brownian Motion (fBm) procedural noise.
- Smoothly animated violet and toxic-green energy tendrils.
- Radial luminous falloff and soft edge blending.
- Fully verified and compiled via `rive . --verify`.

#### C. Luau GPU Canvas Controller (`warden.luau`)
- Implements `Layout<WardenState>` protocol.
- Fetches shader via `context:shader('spectral_veil')`.
- Creates `GPUCanvas` and `GPUPipeline` with WebGPU color targets.
- Issues GPU render passes and composites backing texture via `renderer:drawImage`.
- Animates **The Hollow Warden** character with pointer gaze tracking and click provocation reactions.

#### D. Compiled Binary Asset (`build/midnight-haunt.riv`)
- Built cleanly with `rive . --once` (55,182 bytes, 0 errors, 0 warnings).

---

### 4. Walkthrough Video Recording Guide (45 Seconds)

| Timestamp | Screen / Scene | Voiceover / Action |
|---|---|---|
| **0:00 - 0:08** | Cemetery Gates Opening | *“Welcome to Midnight Haunt. As you enter the cemetery gates, low-poly moonlight reveals crooked gravestones and drifting embers.”* |
| **0:08 - 0:18** | Crypt Descent & The Hollow Warden | *“Descending past the crypt, we meet The Hollow Warden—an ancient spirit built in Rive RML with our custom WGSL Spectral Veil shader running on Rive GPU Canvas. It actively tracks your cursor gaze and flares with toxic bile when clicked.”* |
| **0:18 - 0:35** | Spooky Slicer Gameplay | *“Reaching Chapter IV launches Spooky Slicer: Nightmare Mode. Players swipe to slice wandering pumpkins and candies for combos, use spectral wisps to freeze time, and dodge cursed skulls.”* |
| **0:35 - 0:45** | Rive CLI Verification & Code | *“Built cleanly with the official Rive CLI, Luau scripts, procedural Web Audio, and zero external textures. Every soul leaves a mark.”* |

---

### 5. Social Media Sharing Post

#### Post for X / Twitter & LinkedIn
```text
⛧ MIDNIGHT HAUNT: Spooky Slicer — Crypt of the Wandering Souls ⛧

Built for the #rivehalloweenchallenge using the official @rive_app CLI and GPU Canvas!

✨ Features:
• The Hollow Warden character authored in Rive RML & Luau
• "Spectral Veil" custom WGSL shader rendered on Rive GPU Canvas
• Procedural Three.js gothic cemetery & scroll-driven cinematic rig
• High-speed slice-and-dodge arcade mini-game with 60s Nightmare Mode
• 100% procedural Web Audio synthesizer (no external sound files)

Every soul leaves a mark. Every cut awakens the dead. 🎃💀

#rive #webgpu #wgsl #threejs #gamedev #creativecoding #horror #halloween
```
