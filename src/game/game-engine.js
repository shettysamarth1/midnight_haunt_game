/**
 * Master Game Engine for Spooky Slicer: Crypt of the Wandering Souls.
 * Coordinates Canvas 2D render loop, entity physics, collision testing,
 * juicy particle bursts, floating score labels, audio cues, and Nightmare Mode progression.
 */
import { GameStates, GameStateMachine } from './game-state.js';
import { EntitySpawner } from './entity-spawner.js';
import { SwipeController } from './swipe-controller.js';
import { testSwipeAgainstEntity } from './collision.js';
import { ScoreSystem } from './scoring.js';
import { GameHUD } from '../ui/hud.js';

export class GameEngine {
  constructor(canvasElement, audioEngine, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.audio = audioEngine;
    this.isReducedMotion = options.isReducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Arena dimensions
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    // Nightmare Mode Timer
    this.roundDuration = 60.0; // 60s survival round
    this.timeRemaining = this.roundDuration;
    this.countdownTimer = 0;
    this.countdownNumber = 3;

    // Time Freeze State
    this.isTimeFrozen = false;
    this.timeFreezeRemaining = 0;

    // Juicy Feedback: floating text, particle bursts, screen shake
    this.floatingTexts = [];
    this.particles = [];
    this.screenShake = 0;

    // Subsystems
    this.stateMachine = new GameStateMachine(this.onStateChange.bind(this));
    this.spawner = new EntitySpawner(this.width, this.height);
    this.scoring = new ScoreSystem({
      onScore: (score, added, mult) => this.hud.updateScore(score),
      onLivesChange: (lives) => this.onLivesUpdate(lives),
      onComboChange: (combo, mult) => this.hud.updateCombo(combo, mult),
      onFrenzyStart: () => {
        this.hud.setFrenzy(true);
        this.audio.playFrenzyStart();
        this.addFloatingText(this.width * 0.5, this.height * 0.35, '⚡ FRENZY HARVEST! ⚡', '#FF5400', 28);
      },
      onFrenzyEnd: () => this.hud.setFrenzy(false)
    });

    this.hud = new GameHUD({
      onStart: () => this.startCountdown(),
      onResume: () => this.stateMachine.resume(),
      onRestart: () => this.startCountdown(),
      onPauseToggle: () => this.togglePause(),
      onMuteToggle: () => this.audio.toggleMute()
    });

    this.swipe = new SwipeController(this.canvas, this.onSwipeSegment.bind(this));

    this.hud.updateHighScore(this.scoring.highScore);
    this.hud.updateLives(this.scoring.lives);

    // Render loop
    this.lastTime = performance.now();
    this.loop = this.loop.bind(this);
    requestAnimationFrame(this.loop);
  }

  startCountdown() {
    this.scoring.reset();
    this.spawner.clear();
    this.particles = [];
    this.floatingTexts = [];
    this.timeRemaining = this.roundDuration;
    this.countdownNumber = 3;
    this.countdownTimer = 1.0;

    this.hud.updateTimer(this.timeRemaining);
    this.hud.updateScore(0);
    this.hud.updateLives(3);
    this.hud.hideAllOverlays();

    this.audio.initContext();
    this.audio.playCountdownTick(false);
    this.stateMachine.transitionTo(GameStates.COUNTDOWN);
  }

  togglePause() {
    if (this.stateMachine.is(GameStates.PAUSED)) {
      this.stateMachine.resume();
    } else {
      this.stateMachine.pause();
    }
  }

  onStateChange(nextState, prevState) {
    if (nextState === GameStates.PAUSED) {
      this.hud.showPauseScreen();
    } else if (prevState === GameStates.PAUSED && nextState === GameStates.PLAYING) {
      this.hud.hideAllOverlays();
    } else if (nextState === GameStates.GAME_OVER) {
      this.audio.playGameOver();
      this.hud.showGameOver(this.scoring.score, this.roundDuration - this.timeRemaining);
    } else if (nextState === GameStates.VICTORY) {
      this.audio.playVictory();
      this.hud.showVictory(this.scoring.score, this.scoring.maxComboReached);
    }
  }

  onLivesUpdate(lives) {
    this.hud.updateLives(lives);
    if (lives <= 0) {
      this.stateMachine.transitionTo(GameStates.GAME_OVER);
    }
  }

  onSwipeSegment(points) {
    if (!this.stateMachine.canAcceptGameplayInput()) return;

    this.audio.playSwipe();

    // Test swipe against all active, unsliced entities
    for (const entity of this.spawner.entities) {
      if (!entity.isSliced && !entity.isDead) {
        const test = testSwipeAgainstEntity(points, entity);
        if (test.hit) {
          this.sliceEntity(entity, test.angle);
        }
      }
    }
  }

  sliceEntity(entity, angle) {
    entity.isSliced = true;
    entity.sliceAngle = angle;

    const result = this.scoring.registerHit(entity.type);

    if (result.skull) {
      // Cursed skull strike
      this.audio.playSkullHit();
      this.triggerScreenShake(14);
      this.createSlashBurst(entity.x, entity.y, '#FF1744', 30);
      this.addFloatingText(entity.x, entity.y, 'CURSED! -1 LIFE', '#FF1744', 22);
    } else {
      // Valid target hit
      if (entity.type === 'pumpkin') {
        this.audio.playPumpkinHit();
        this.createSlashBurst(entity.x, entity.y, '#FF5400', 20);
        this.addFloatingText(entity.x, entity.y, `+${result.points}`, '#39FF14', 20);
      } else if (entity.type === 'wisp') {
        this.audio.playWispHit();
        this.activateTimeFreeze(3.0);
        this.createSlashBurst(entity.x, entity.y, '#9D4EDD', 25);
        this.addFloatingText(entity.x, entity.y, `TIME FREEZE! +${result.points}`, '#C77DFF', 22);
      } else if (entity.type === 'candy') {
        this.audio.playCandyHit();
        this.createSlashBurst(entity.x, entity.y, '#FFB703', 18);
        this.addFloatingText(entity.x, entity.y, `+${result.points}`, '#FFB703', 20);
      }

      if (result.combo >= 3) {
        const announcement = result.combo >= 8 ? 'WICKED SLICE!' : 'HAUNTED x' + result.multiplier;
        this.addFloatingText(entity.x, entity.y - 30, announcement, '#39FF14', 18);
      }
    }
  }

  activateTimeFreeze(duration) {
    this.isTimeFrozen = true;
    this.timeFreezeRemaining = duration;
    this.hud.setTimeFrozen(true);
  }

  triggerScreenShake(intensity) {
    if (!this.isReducedMotion) {
      this.screenShake = intensity;
    }
  }

  createSlashBurst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 220;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        color,
        life: 0.4 + Math.random() * 0.4,
        maxLife: 0.8
      });
    }
  }

  addFloatingText(x, y, text, color, fontSize = 20) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      fontSize,
      life: 0.85,
      vy: -55
    });
  }

  loop(now) {
    const dt = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop);
  }

  update(dt) {
    // 1. Countdown Flow
    if (this.stateMachine.is(GameStates.COUNTDOWN)) {
      this.countdownTimer -= dt;
      if (this.countdownTimer <= 0) {
        this.countdownNumber -= 1;
        if (this.countdownNumber > 0) {
          this.countdownTimer = 1.0;
          this.audio.playCountdownTick(false);
        } else {
          this.audio.playCountdownTick(true);
          this.stateMachine.transitionTo(GameStates.PLAYING);
        }
      }
      return;
    }

    if (!this.stateMachine.canAcceptGameplayInput()) {
      return;
    }

    // 2. Active Nightmare Timer (60s -> 0s)
    this.timeRemaining = Math.max(0, this.timeRemaining - dt);
    this.hud.updateTimer(this.timeRemaining);

    if (this.timeRemaining <= 0) {
      // 60-second Survival Victory!
      this.stateMachine.transitionTo(GameStates.VICTORY);
      return;
    }

    // 3. Time Freeze Duration
    if (this.isTimeFrozen) {
      this.timeFreezeRemaining -= dt;
      if (this.timeFreezeRemaining <= 0) {
        this.isTimeFrozen = false;
        this.hud.setTimeFrozen(false);
      }
    }

    // 4. Subsystems
    this.scoring.update(dt);
    this.swipe.update(dt);
    this.spawner.update(dt, this.isTimeFrozen, this.scoring.isFrenzy);

    // 5. Particles and Floating Labels
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt; // light gravity
      p.life -= dt;
    }
    this.particles = this.particles.filter(p => p.life > 0);

    for (const t of this.floatingTexts) {
      t.y += t.vy * dt;
      t.life -= dt;
    }
    this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);

    // 6. Screen shake decay
    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - dt * 45);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen shake transform
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake;
      const sy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(sx, sy);
    }

    // Clear Arena
    ctx.clearRect(0, 0, this.width, this.height);

    // Render Time Freeze tint
    if (this.isTimeFrozen) {
      ctx.fillStyle = 'rgba(157, 78, 221, 0.12)';
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // Render Entities
    this.spawner.render(ctx);

    // Render Slash Particles
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Render Swipe Slash Trail
    this.swipe.render(ctx);

    // Render Floating Text Labels
    for (const t of this.floatingTexts) {
      ctx.save();
      ctx.font = `bold ${t.fontSize}px 'Space Grotesk', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 10;
      ctx.globalAlpha = Math.max(0, t.life / 0.85);
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    // Render Countdown (3.. 2.. 1.. SLICE!)
    if (this.stateMachine.is(GameStates.COUNTDOWN)) {
      ctx.save();
      ctx.font = `900 72px 'Cinzel Decorative', serif`;
      ctx.fillStyle = '#39FF14';
      ctx.shadowColor = '#39FF14';
      ctx.shadowBlur = 25;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const text = this.countdownNumber > 0 ? this.countdownNumber.toString() : 'SLICE!';
      ctx.fillText(text, this.width * 0.5, this.height * 0.45);
      ctx.restore();
    }

    ctx.restore();
  }
}
