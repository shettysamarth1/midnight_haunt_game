/**
 * Scoring and progression system for Spooky Slicer.
 * Handles points, combo tiers (2x, 4x, 8x), Candy streaks, Frenzy Harvest,
 * and high-score persistence with localStorage validation and fallback.
 */

export class ScoreSystem {
  constructor(callbacks = {}) {
    this.score = 0;
    this.lives = 3;
    this.maxLives = 3;
    this.combo = 0;
    this.multiplier = 1;
    this.maxComboReached = 0;
    this.candyStreak = 0;
    this.isFrenzy = false;
    this.frenzyTimer = 0;
    this.frenzyDuration = 8.0; // 8 seconds frenzy duration
    this.comboTimeout = 1.6; // seconds before combo multiplier resets
    this.comboTimer = 0;

    this.callbacks = callbacks; // onScore, onLivesChange, onComboChange, onFrenzyStart, onFrenzyEnd
    this.highScore = this.loadHighScore();
  }

  loadHighScore() {
    try {
      const stored = localStorage.getItem('midnight_haunt_high_score');
      if (stored !== null) {
        const val = parseInt(stored, 10);
        return isNaN(val) ? 0 : val;
      }
    } catch (e) {
      console.warn('[Storage] localStorage unavailable, using memory:', e);
    }
    return 0;
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      try {
        localStorage.setItem('midnight_haunt_high_score', this.highScore.toString());
      } catch (e) {
        // Safe fallback
      }
    }
    return this.highScore;
  }

  update(dt) {
    // Handle combo timeout
    if (this.combo > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.resetCombo();
      }
    }

    // Handle Frenzy Harvest duration
    if (this.isFrenzy) {
      this.frenzyTimer -= dt;
      if (this.frenzyTimer <= 0) {
        this.endFrenzy();
      }
    }
  }

  registerHit(type) {
    if (type === 'skull') {
      // Cursed Skull hit: lose 1 life and break combo
      this.lives = Math.max(0, this.lives - 1);
      this.resetCombo();
      this.candyStreak = 0;
      if (this.callbacks.onLivesChange) {
        this.callbacks.onLivesChange(this.lives);
      }
      return { points: 0, skull: true, livesRemaining: this.lives };
    }

    // Valid target hit: increment combo
    this.combo += 1;
    this.comboTimer = this.comboTimeout;
    if (this.combo > this.maxComboReached) {
      this.maxComboReached = this.combo;
    }

    // Update multiplier tiers: 3 hits -> 2x, 6 hits -> 4x, 10 hits -> 8x
    if (this.combo >= 10) this.multiplier = 8;
    else if (this.combo >= 6) this.multiplier = 4;
    else if (this.combo >= 3) this.multiplier = 2;
    else this.multiplier = 1;

    let basePoints = 0;
    if (type === 'pumpkin') {
      basePoints = 100;
      this.candyStreak = 0;
    } else if (type === 'wisp') {
      basePoints = 250;
      this.candyStreak = 0;
    } else if (type === 'candy') {
      basePoints = 150;
      this.candyStreak += 1;
      if (this.candyStreak >= 3 && !this.isFrenzy) {
        this.startFrenzy();
      }
    }

    // Frenzy Harvest doubles all point gains
    const effectiveMultiplier = this.isFrenzy ? this.multiplier * 2 : this.multiplier;
    const addedPoints = basePoints * effectiveMultiplier;
    this.score += addedPoints;
    this.saveHighScore();

    if (this.callbacks.onScore) {
      this.callbacks.onScore(this.score, addedPoints, effectiveMultiplier);
    }
    if (this.callbacks.onComboChange) {
      this.callbacks.onComboChange(this.combo, this.multiplier);
    }

    return {
      points: addedPoints,
      multiplier: effectiveMultiplier,
      combo: this.combo,
      skull: false
    };
  }

  resetCombo() {
    this.combo = 0;
    this.multiplier = 1;
    this.comboTimer = 0;
    if (this.callbacks.onComboChange) {
      this.callbacks.onComboChange(0, 1);
    }
  }

  startFrenzy() {
    this.isFrenzy = true;
    this.frenzyTimer = this.frenzyDuration;
    this.candyStreak = 0;
    if (this.callbacks.onFrenzyStart) {
      this.callbacks.onFrenzyStart(this.frenzyDuration);
    }
  }

  endFrenzy() {
    this.isFrenzy = false;
    this.frenzyTimer = 0;
    if (this.callbacks.onFrenzyEnd) {
      this.callbacks.onFrenzyEnd();
    }
  }

  reset() {
    this.score = 0;
    this.lives = this.maxLives;
    this.combo = 0;
    this.multiplier = 1;
    this.maxComboReached = 0;
    this.candyStreak = 0;
    this.isFrenzy = false;
    this.frenzyTimer = 0;
    this.comboTimer = 0;

    if (this.callbacks.onScore) this.callbacks.onScore(0, 0, 1);
    if (this.callbacks.onLivesChange) this.callbacks.onLivesChange(this.lives);
    if (this.callbacks.onComboChange) this.callbacks.onComboChange(0, 1);
  }
}
