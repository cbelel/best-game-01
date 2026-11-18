import { CONFIG } from './config.js';

export function stageShot(name, world, seed = 1) {
  world.reset(seed);

  if (name === 'start') {
    // Title screen state
    world.screen = 'title';
  } else if (name === 'play') {
    // Play state mid-game
    world.screen = 'play';
    // Run autopilot for ~90 steps (1.5 seconds) to climb a bit and grab first few prizes
    for (let i = 0; i < 90; i++) {
      let climb = world.climber.grip > 25;
      if (world.climber.grip < 20) climb = false;
      world.step(CONFIG.STEP, { climb, leftPole: false, rightPole: false, clickPole: null, start: false, click: false });
    }
  } else if (name === 'end') {
    // End state (WIN)
    world.screen = 'play';
    // Run autopilot until winning (climb middle pole all the way to top bicycle)
    world.climber.pole = 1;
    for (let i = 0; i < 350; i++) {
      let climb = world.climber.grip > 15;
      if (world.climber.grip < 30) climb = false;
      world.step(CONFIG.STEP, { climb, leftPole: false, rightPole: false, clickPole: null, start: false, click: false });
      if (world.screen === 'results') break;
    }
    // If not quite won, force grab bicycle
    if (world.screen !== 'results') {
      world.climber.height = 475;
      world.step(CONFIG.STEP, { climb: true, leftPole: false, rightPole: false, clickPole: null, start: false, click: false });
    }
  }
}
