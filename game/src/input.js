import { CONFIG } from './config.js';

export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.climb = false;
    this.leftPole = false;
    this.rightPole = false;
    this.clickPole = null;
    this.start = false;
    this.click = false;

    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.climb = true;
        e.preventDefault();
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.leftPole = true;
        e.preventDefault();
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.rightPole = true;
        e.preventDefault();
      }
      if (e.code === 'Enter') {
        this.start = true;
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.climb = false;
      }
    });

    // Mouse & Touch input
    const getCanvasPos = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CONFIG.WIDTH / rect.width;
      const scaleY = CONFIG.HEIGHT / rect.height;
      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
      };
    };

    window.addEventListener('mousedown', (e) => {
      if (e.target === this.canvas) {
        this.climb = true;
        this.click = true;
        const pos = getCanvasPos(e.clientX, e.clientY);
        this.checkPoleClick(pos.x);
        e.preventDefault();
      }
    });

    window.addEventListener('mouseup', () => {
      this.climb = false;
    });

    window.addEventListener('touchstart', (e) => {
      if (e.target === this.canvas && e.touches.length > 0) {
        this.climb = true;
        this.click = true;
        const touch = e.touches[0];
        const pos = getCanvasPos(touch.clientX, touch.clientY);
        this.checkPoleClick(pos.x);
        e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      this.climb = false;
    });
  }

  checkPoleClick(x) {
    // Find closest pole
    let closestIdx = 0;
    let minDist = Infinity;
    CONFIG.POLES.forEach((px, idx) => {
      const dist = Math.abs(px - x);
      if (dist < minDist) {
        minDist = dist;
        closestIdx = idx;
      }
    });
    if (minDist < 180) {
      this.clickPole = closestIdx;
    }
  }

  poll() {
    const state = {
      climb: this.climb,
      leftPole: this.leftPole,
      rightPole: this.rightPole,
      clickPole: this.clickPole,
      start: this.start,
      click: this.click
    };

    // Clear edge-triggered flags
    this.leftPole = false;
    this.rightPole = false;
    this.clickPole = null;
    this.start = false;
    this.click = false;

    return state;
  }
}
