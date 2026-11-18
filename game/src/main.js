import { CONFIG } from './config.js';
import { World } from './world.js';
import { Input } from './input.js';
import { Renderer } from './render.js';
import { stageShot } from './shots.js';

// Sound Manager with Web Audio API (lazy initialization, robust guarding)
class SoundManager {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTick() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {}
  }

  playDing() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.08); // A5
      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch {}
  }

  playSlip() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(400, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch {}
  }

  playFanfare() {
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.12 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.12);
        osc.stop(this.ctx.currentTime + idx * 0.12 + 0.3);
      });
    } catch {}
  }

  playLoss() {
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {}
  }
}

function main() {
  const canvas = document.getElementById('game');
  if (!canvas) return;

  const world = new World();
  const input = new Input(canvas);
  const renderer = new Renderer(canvas);
  const sound = new SoundManager();

  // Parse URL query parameters
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  const seedParam = params.get('seed');
  const seed = seedParam ? parseInt(seedParam, 10) || 1 : 1;

  if (shot) {
    // Shot stage mode
    stageShot(shot, world, seed);
    renderer.render(world);
    return; // stop loop for screenshot capture
  }

  // Normal game loop with fixed-timestep accumulator
  let lastTime = performance.now();
  let accumulator = 0;
  let tickCounter = 0;

  function frame(now) {
    const dt = Math.min(1, (now - lastTime) / 1000);
    lastTime = now;
    accumulator += dt;

    const inputState = input.poll();

    // Trigger audio init on click or start
    if (inputState.click || inputState.start || inputState.climb) {
      sound.init();
    }

    let subStepCount = 0;
    while (accumulator >= CONFIG.STEP) {
      if (subStepCount > 0) {
        inputState.leftPole = false;
        inputState.rightPole = false;
        inputState.clickPole = null;
        inputState.start = false;
        inputState.click = false;
      }
      world.step(CONFIG.STEP, inputState);
      subStepCount++;

      // Handle sound triggers from world events
      if (world.events.tick) {
        tickCounter++;
        if (tickCounter % 3 === 0) {
          sound.playTick();
        }
      }
      if (world.events.prize) {
        sound.playDing();
      }
      if (world.events.slip) {
        sound.playSlip();
      }
      if (world.events.win) {
        sound.playFanfare();
      }
      if (world.events.loss) {
        sound.playLoss();
      }

      accumulator -= CONFIG.STEP;
    }

    renderer.render(world);
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

window.addEventListener('DOMContentLoaded', main);
