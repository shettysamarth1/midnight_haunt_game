/**
 * Heads-Up Display and Interface Controller for Spooky Slicer.
 * Updates DOM metrics, overlay panels, lives indicators, combo badges, and accessibility attributes.
 */

export class GameHUD {
  constructor(callbacks = {}) {
    this.callbacks = callbacks; // onStart, onResume, onRestart, onPause, onMuteToggle

    // DOM Elements
    this.scoreEl = document.getElementById('hud-score');
    this.timerEl = document.getElementById('hud-timer');
    this.livesContainer = document.getElementById('hud-lives');
    this.comboBadge = document.getElementById('hud-combo-badge');
    this.comboText = document.getElementById('hud-combo-text');
    this.frenzyBanner = document.getElementById('hud-frenzy-banner');
    this.freezeIndicator = document.getElementById('hud-freeze-indicator');
    this.highScoreEl = document.getElementById('display-high-score');

    // Overlays
    this.overlayStart = document.getElementById('overlay-start');
    this.overlayPause = document.getElementById('overlay-pause');
    this.overlayGameOver = document.getElementById('overlay-gameover');
    this.overlayVictory = document.getElementById('overlay-victory');

    // Score summaries
    this.gameoverScore = document.getElementById('gameover-final-score');
    this.gameoverTime = document.getElementById('gameover-survived-time');
    this.victoryScore = document.getElementById('victory-final-score');
    this.victoryCombo = document.getElementById('victory-max-combo');

    this.bindButtons();
    this.bindKeyboard();
  }

  bindButtons() {
    document.getElementById('btn-start-game')?.addEventListener('click', () => {
      if (this.callbacks.onStart) this.callbacks.onStart();
    });

    document.getElementById('btn-resume-game')?.addEventListener('click', () => {
      if (this.callbacks.onResume) this.callbacks.onResume();
    });

    document.getElementById('btn-restart-game')?.addEventListener('click', () => {
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });

    document.getElementById('btn-try-again')?.addEventListener('click', () => {
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });

    document.getElementById('btn-victory-replay')?.addEventListener('click', () => {
      if (this.callbacks.onRestart) this.callbacks.onRestart();
    });

    // Grimoire dialog
    const modal = document.getElementById('modal-instructions');
    document.getElementById('btn-how-to-play')?.addEventListener('click', () => modal?.showModal());
    document.getElementById('btn-info')?.addEventListener('click', () => modal?.showModal());
    document.getElementById('btn-close-modal')?.addEventListener('click', () => modal?.close());
    document.getElementById('btn-dialog-ack')?.addEventListener('click', () => modal?.close());
  }

  bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.callbacks.onPauseToggle) this.callbacks.onPauseToggle();
      } else if (e.code === 'Space' || e.code === 'Enter') {
        if (this.overlayStart && !this.overlayStart.classList.contains('hidden')) {
          e.preventDefault();
          if (this.callbacks.onStart) this.callbacks.onStart();
        } else if (this.overlayPause && !this.overlayPause.classList.contains('hidden')) {
          e.preventDefault();
          if (this.callbacks.onResume) this.callbacks.onResume();
        }
      } else if (e.code === 'KeyR') {
        if (this.callbacks.onRestart) this.callbacks.onRestart();
      } else if (e.code === 'KeyM') {
        if (this.callbacks.onMuteToggle) this.callbacks.onMuteToggle();
      }
    });
  }

  updateScore(score) {
    if (this.scoreEl) {
      this.scoreEl.textContent = score.toLocaleString();
    }
  }

  updateTimer(secondsRemaining) {
    if (this.timerEl) {
      const s = Math.max(0, Math.ceil(secondsRemaining));
      this.timerEl.textContent = `${s}s`;
    }
  }

  updateLives(lives) {
    if (!this.livesContainer) return;
    const flames = this.livesContainer.querySelectorAll('.life-flame');
    flames.forEach((flame, idx) => {
      if (idx < lives) {
        flame.classList.add('active');
      } else {
        flame.classList.remove('active');
      }
    });
    this.livesContainer.setAttribute('aria-label', `${lives} lives remaining`);
  }

  updateCombo(combo, multiplier) {
    if (!this.comboBadge) return;
    if (combo >= 2) {
      this.comboBadge.style.opacity = '1';
      this.comboText.textContent = `COMBO x${multiplier} (${combo})`;
      this.comboBadge.style.transform = 'scale(1.15)';
      setTimeout(() => {
        if (this.comboBadge) this.comboBadge.style.transform = 'scale(1)';
      }, 150);
    } else {
      this.comboBadge.style.opacity = '0';
    }
  }

  setFrenzy(active) {
    if (this.frenzyBanner) {
      this.frenzyBanner.style.display = active ? 'block' : 'none';
    }
  }

  setTimeFrozen(active) {
    if (this.freezeIndicator) {
      this.freezeIndicator.style.display = active ? 'block' : 'none';
    }
  }

  updateHighScore(highScore) {
    if (this.highScoreEl) {
      this.highScoreEl.textContent = highScore.toLocaleString();
    }
  }

  showStartScreen() {
    this.hideAllOverlays();
    this.overlayStart?.classList.remove('hidden');
  }

  showPauseScreen() {
    this.hideAllOverlays();
    this.overlayPause?.classList.remove('hidden');
  }

  showGameOver(score, survivedTime) {
    this.hideAllOverlays();
    if (this.gameoverScore) this.gameoverScore.textContent = score.toLocaleString();
    if (this.gameoverTime) this.gameoverTime.textContent = `${Math.floor(survivedTime)}s`;
    this.overlayGameOver?.classList.remove('hidden');
  }

  showVictory(score, maxCombo) {
    this.hideAllOverlays();
    if (this.victoryScore) this.victoryScore.textContent = score.toLocaleString();
    if (this.victoryCombo) this.victoryCombo.textContent = `${maxCombo}x`;
    this.overlayVictory?.classList.remove('hidden');
  }

  hideAllOverlays() {
    this.overlayStart?.classList.add('hidden');
    this.overlayPause?.classList.add('hidden');
    this.overlayGameOver?.classList.add('hidden');
    this.overlayVictory?.classList.add('hidden');
  }
}
