/**
 * Scroll and chapter interaction controller for Midnight Haunt.
 * Converts document scroll progress into smooth 0-1 values,
 * coordinates chapter markers, and feeds camera rig interpolation.
 */
export class ScrollController {
  constructor(onProgressCallback) {
    this.onProgress = onProgressCallback;
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.ticking = false;
    this.isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.chapters = [
      { id: 'chapter-1', range: [0, 0.25], name: 'The Cemetery Gates' },
      { id: 'chapter-2', range: [0.26, 0.55], name: 'The Crypt Descent' },
      { id: 'chapter-3', range: [0.56, 0.80], name: 'The Altar Entrance' },
      { id: 'chapter-4', range: [0.81, 1.0], name: 'The Game Arena' }
    ];

    this.onScroll = this.onScroll.bind(this);
    this.update = this.update.bind(this);
    this.handleResize = this.handleResize.bind(this);

    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.handleResize, { passive: true });

    // Initial calculation
    this.calculateProgress();
    this.currentProgress = this.targetProgress;
    if (this.onProgress) {
      this.onProgress(this.currentProgress);
    }

    requestAnimationFrame(this.update);
  }

  calculateProgress() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) {
      this.targetProgress = 0;
      return;
    }
    const scrolled = window.scrollY;
    this.targetProgress = Math.min(1, Math.max(0, scrolled / docHeight));
  }

  onScroll() {
    this.calculateProgress();
  }

  handleResize() {
    this.calculateProgress();
  }

  update() {
    // Smooth lerp toward target progress
    const factor = this.isReducedMotion ? 1.0 : 0.08;
    const diff = this.targetProgress - this.currentProgress;

    if (Math.abs(diff) > 0.0001) {
      this.currentProgress += diff * factor;
      if (this.onProgress) {
        this.onProgress(this.currentProgress);
      }
    }

    requestAnimationFrame(this.update);
  }

  getCurrentChapter() {
    for (let i = 0; i < this.chapters.length; i++) {
      const ch = this.chapters[i];
      if (this.currentProgress >= ch.range[0] && this.currentProgress <= ch.range[1]) {
        return { index: i + 1, ...ch };
      }
    }
    return { index: 4, ...this.chapters[3] };
  }

  scrollToChapter(chapterIndex) {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const target = this.chapters[chapterIndex - 1];
    if (target && docHeight > 0) {
      const scrollPos = target.range[0] * docHeight;
      window.scrollTo({
        top: scrollPos,
        behavior: this.isReducedMotion ? 'auto' : 'smooth'
      });
    }
  }

  dispose() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.handleResize);
  }
}
