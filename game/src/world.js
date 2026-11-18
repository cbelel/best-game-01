import { CONFIG } from './config.js';
import { makeRng, randRange } from './random.js';

export class World {
  constructor() {
    this.seed = 1;
    this.rng = makeRng(1);
    this.screen = 'title'; // 'title', 'play', 'results'
    this.time = CONFIG.TOTAL_TIME;
    this.score = 0;
    this.bestScore = 0;
    this.win = false;
    this.prizesTakenCount = 0;

    this.climber = {
      pole: 1, // 0, 1, 2
      height: 0, // 0 to ~480
      grip: 100, // 0 to 100
      slipJoltTimer: 0
    };

    // Initialize poles and prizes
    this.polesData = CONFIG.POLES.map((x, poleIdx) => {
      return {
        x,
        prizes: CONFIG.PRIZES.map((p, pIdx) => ({
          ...p,
          id: `${poleIdx}-${pIdx}`,
          taken: false
        })),
        greasePatches: [
          { y1: 100, y2: 180 },
          { y1: 250, y2: 330 },
          { y1: 400, y2: 460 }
        ]
      };
    });

    this.slipCooldown = 3.0;
    this.floatingLabels = [];
    this.events = {
      tick: false,
      prize: false,
      slip: false,
      win: false,
      loss: false
    };
  }

  reset(seed = 1) {
    this.seed = seed;
    this.rng = makeRng(seed);
    this.screen = 'title';
    this.time = CONFIG.TOTAL_TIME;
    this.score = 0;
    this.win = false;
    this.prizesTakenCount = 0;

    this.climber = {
      pole: 1,
      height: 0,
      grip: 100,
      slipJoltTimer: 0
    };

    this.polesData.forEach((pole, poleIdx) => {
      pole.prizes.forEach((p, pIdx) => {
        p.taken = false;
      });
    });

    this.slipCooldown = 3.0;
    this.floatingLabels = [];
    this.clearEvents();
  }

  clearEvents() {
    this.events.tick = false;
    this.events.prize = false;
    this.events.slip = false;
    this.events.win = false;
    this.events.loss = false;
  }

  step(dt, input) {
    this.clearEvents();

    // Update floating labels
    for (let i = this.floatingLabels.length - 1; i >= 0; i--) {
      const lbl = this.floatingLabels[i];
      lbl.y -= 30 * dt;
      lbl.alpha -= dt;
      if (lbl.alpha <= 0) {
        this.floatingLabels.splice(i, 1);
      }
    }

    if (this.screen === 'title') {
      if (input.start || input.click) {
        this.reset(this.seed);
        this.screen = 'play';
      }
      return;
    }

    if (this.screen === 'results') {
      if (input.start || input.click) {
        this.reset(this.seed + 1);
        this.screen = 'play';
      }
      return;
    }

    if (this.screen === 'play') {
      // Timer countdown
      this.time -= dt;
      if (this.time <= 0) {
        this.time = 0;
        this.screen = 'results';
        this.win = false;
        this.events.loss = true;
        if (this.score > this.bestScore) this.bestScore = this.score;
        return;
      }

      // Pole switching via input
      if (input.leftPole) {
        this.climber.pole = Math.max(0, this.climber.pole - 1);
      }
      if (input.rightPole) {
        this.climber.pole = Math.min(2, this.climber.pole + 1);
      }
      if (input.clickPole !== null && input.clickPole >= 0 && input.clickPole <= 2) {
        this.climber.pole = input.clickPole;
      }

      const currentPole = this.polesData[this.climber.pole];
      const maxHeight = 475; // top bicycle height

      // Check if climber is currently in a grease patch
      let inGrease = false;
      for (const patch of currentPole.greasePatches) {
        if (this.climber.height >= patch.y1 && this.climber.height <= patch.y2) {
          inGrease = true;
          break;
        }
      }

      // Slip cooldown & bursts
      this.slipCooldown -= dt;
      if (this.slipCooldown <= 0) {
        this.slipCooldown = randRange(this.rng, 2.5, 4.5);
        if (inGrease || this.climber.height > 150) {
          // Grease burst slip!
          const slipAmount = randRange(this.rng, 20, 45);
          this.climber.height = Math.max(0, this.climber.height - slipAmount);
          this.climber.grip = Math.max(0, this.climber.grip - 15);
          this.climber.slipJoltTimer = 0.3;
          this.events.slip = true;
        }
      }

      if (this.climber.slipJoltTimer > 0) {
        this.climber.slipJoltTimer -= dt;
      }

      // Climbing vs Resting mechanics
      const gripFactor = 1 + (this.climber.height / maxHeight) * 1.5; // higher up drains faster
      if (input.climb && this.climber.grip > 0) {
        // Climbing up
        let climbRate = CONFIG.CLIMB_SPEED;
        if (inGrease) {
          climbRate *= 0.7; // slower in grease
          this.climber.grip -= CONFIG.GRIP_DRAIN * 1.6 * gripFactor * dt;
        } else {
          this.climber.grip -= CONFIG.GRIP_DRAIN * gripFactor * dt;
        }

        this.climber.height += climbRate * dt;
        this.events.tick = true;

        if (this.climber.grip < 0) this.climber.grip = 0;
      } else {
        // Resting (recovering grip)
        let refillRate = CONFIG.GRIP_REFILL;
        if (inGrease) {
          refillRate *= 0.5;
          // Slowly slide down in grease if resting without grip or sliding
          this.climber.height = Math.max(0, this.climber.height - CONFIG.SLIDE_SPEED * 0.5 * dt);
        }
        this.climber.grip += refillRate * dt;
        if (this.climber.grip > 100) this.climber.grip = 100;
      }

      // Clamp height
      if (this.climber.height < 0) this.climber.height = 0;
      if (this.climber.height > maxHeight) this.climber.height = maxHeight;

      // Check prize pickup
      for (const prize of currentPole.prizes) {
        if (!prize.taken && this.climber.height >= prize.yOffset) {
          prize.taken = true;
          this.prizesTakenCount++;
          this.score += prize.points;
          this.events.prize = true;

          this.floatingLabels.push({
            text: `+${prize.points}`,
            x: currentPole.x,
            y: CONFIG.POLE_BASE_Y - prize.yOffset - 30,
            alpha: 1.5
          });

          if (prize.isBicycle) {
            // WIN!
            this.win = true;
            this.screen = 'results';
            const timeBonus = Math.floor(this.time) * 10;
            this.score += timeBonus;
            if (this.score > this.bestScore) this.bestScore = this.score;
            this.events.win = true;
            return;
          }
        }
      }

      // Height score computation (1 pt per 10 pixels climbed - dynamic high score tracking)
      // We keep base score as prize points + height bonus
      let heightBonus = Math.floor(this.climber.height / 10);
      // Ensure score reflects prizes + height bonus smoothly
      let currentBaseScore = 0;
      this.polesData.forEach(p => {
        p.prizes.forEach(pr => {
          if (pr.taken) currentBaseScore += pr.points;
        });
      });
      this.score = currentBaseScore + heightBonus;
      if (this.score > this.bestScore) this.bestScore = this.score;
    }
  }
}
