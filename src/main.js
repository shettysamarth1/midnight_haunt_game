/**
 * Application Entry Point for MIDNIGHT HAUNT.
 * Integrates Three.js 3D world, scroll chapter rig, Rive Hollow Warden,
 * Web Audio engine, and Spooky Slicer mini-game arena.
 */
import './styles.css';
import { CemeteryWorld } from './scene/cemetery.js';
import { ScrollController } from './scene/scroll-controller.js';
import { HollowWardenViewer } from './ui/rive-character.js';
import { AudioEngine } from './audio/audio-engine.js';
import { GameEngine } from './game/game-engine.js';

window.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Audio Engine
  const audio = new AudioEngine();

  // Audio Toggle Button in Nav
  const audioBtn = document.getElementById('btn-audio-toggle');
  const updateAudioBtn = (isMuted) => {
    if (audioBtn) {
      audioBtn.setAttribute('aria-pressed', (!isMuted).toString());
      audioBtn.querySelector('.btn-label').textContent = isMuted ? 'Sound OFF' : 'Sound ON';
      audioBtn.querySelector('.btn-icon').textContent = isMuted ? '🔇' : '🔊';
    }
  };
  updateAudioBtn(audio.isMuted);

  audioBtn?.addEventListener('click', () => {
    const isMuted = audio.toggleMute();
    updateAudioBtn(isMuted);
  });

  // 2. Initialize Layer 1: Three.js Cemetery World
  const cemeteryCanvas = document.getElementById('cemetery-canvas');
  let cemeteryWorld = null;
  if (cemeteryCanvas) {
    cemeteryWorld = new CemeteryWorld(cemeteryCanvas);
  }

  // 3. Initialize Layer 2: Narrative Scroll Controller
  const scrollController = new ScrollController((progress) => {
    if (cemeteryWorld) {
      cemeteryWorld.updateScroll(progress);
    }
  });

  // FX Quality Toggle Button
  let isLowFx = false;
  const fxBtn = document.getElementById('btn-fx-toggle');
  fxBtn?.addEventListener('click', () => {
    isLowFx = !isLowFx;
    fxBtn.setAttribute('aria-pressed', isLowFx.toString());
    fxBtn.querySelector('.btn-label').textContent = isLowFx ? 'FX Low' : 'FX High';
    if (cemeteryWorld && cemeteryWorld.particles) {
      cemeteryWorld.particles.setDensity(isLowFx);
    }
  });

  // Scroll to Top Button
  document.getElementById('btn-scroll-top')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // 4. Initialize Hollow Warden Rive / Spectral Viewer
  const wardenCanvas = document.getElementById('rive-character-canvas');
  const wardenBadge = document.getElementById('warden-state-indicator');
  if (wardenCanvas) {
    new HollowWardenViewer(wardenCanvas, wardenBadge);
  }

  // 5. Initialize Layer 3 & 4: Spooky Slicer Game Engine
  const gameCanvas = document.getElementById('game-canvas');
  if (gameCanvas) {
    new GameEngine(gameCanvas, audio, {
      isReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    });
  }

  console.log('⛧ MIDNIGHT HAUNT: Spooky Slicer initialized successfully.');
});
