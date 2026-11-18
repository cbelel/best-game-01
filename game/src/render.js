import { CONFIG } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const aspect = CONFIG.WIDTH / CONFIG.HEIGHT;

    let cssW = w;
    let cssH = w / aspect;
    if (cssH > h) {
      cssH = h;
      cssW = h * aspect;
    }

    this.canvas.width = CONFIG.WIDTH;
    this.canvas.height = CONFIG.HEIGHT;
    this.canvas.style.width = `${cssW}px`;
    this.canvas.style.height = `${cssH}px`;
  }

  render(world) {
    const ctx = this.ctx;
    const W = CONFIG.WIDTH;
    const H = CONFIG.HEIGHT;

    ctx.clearRect(0, 0, W, H);

    // 1. Sunset Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
    skyGrad.addColorStop(0, CONFIG.COLORS.skyTop);
    skyGrad.addColorStop(0.5, CONFIG.COLORS.skyMid);
    skyGrad.addColorStop(1, CONFIG.COLORS.skyBottom);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // Sun
    ctx.fillStyle = CONFIG.COLORS.sun;
    ctx.beginPath();
    ctx.arc(W / 2, 280, 80, 0, Math.PI * 2);
    ctx.fill();

    // Clouds
    ctx.fillStyle = CONFIG.COLORS.cloud;
    ctx.beginPath();
    ctx.arc(200, 150, 40, 0, Math.PI * 2);
    ctx.arc(240, 140, 50, 0, Math.PI * 2);
    ctx.arc(280, 155, 35, 0, Math.PI * 2);
    ctx.arc(950, 180, 55, 0, Math.PI * 2);
    ctx.arc(1010, 170, 65, 0, Math.PI * 2);
    ctx.fill();

    // 2. Red & White Flags string across top
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.quadraticCurveTo(W / 2, 90, W, 40);
    ctx.stroke();

    for (let x = 40; x < W; x += 60) {
      ctx.fillStyle = (Math.floor(x / 60) % 2 === 0) ? CONFIG.COLORS.flagRed : CONFIG.COLORS.flagWhite;
      ctx.beginPath();
      ctx.moveTo(x, 55 + Math.sin(x) * 10);
      ctx.lineTo(x + 25, 95 + Math.sin(x) * 10);
      ctx.lineTo(x - 5, 95 + Math.sin(x) * 10);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Bamboo Poles & Prizes
    world.polesData.forEach((pole, poleIdx) => {
      const px = pole.x;
      const baseY = CONFIG.POLE_BASE_Y;
      const topY = CONFIG.POLE_TOP_Y;
      const poleWidth = 28;

      // Pole shadow/glow if highlighted
      if (world.screen === 'play' && world.climber.pole === poleIdx) {
        ctx.strokeStyle = CONFIG.COLORS.accentYellow;
        ctx.lineWidth = 6;
        ctx.strokeRect(px - poleWidth / 2 - 4, topY - 10, poleWidth + 8, (baseY - topY) + 20);
      }

      // Pole Body
      ctx.fillStyle = CONFIG.COLORS.poleWood;
      ctx.fillRect(px - poleWidth / 2, topY, poleWidth, baseY - topY);

      // Pole wood grain / highlight
      ctx.fillStyle = CONFIG.COLORS.poleHighlight;
      ctx.fillRect(px - poleWidth / 2 + 4, topY, poleWidth / 3, baseY - topY);

      // Nodes (rings on bamboo)
      ctx.fillStyle = CONFIG.COLORS.poleNode;
      for (let ny = topY + 30; ny < baseY; ny += 45) {
        ctx.fillRect(px - poleWidth / 2 - 4, ny, poleWidth + 8, 6);
      }

      // Grease patches (shiny sections)
      ctx.fillStyle = CONFIG.COLORS.grease;
      pole.greasePatches.forEach(patch => {
        const py1 = baseY - patch.y2;
        const py2 = baseY - patch.y1;
        ctx.fillRect(px - poleWidth / 2, py1, poleWidth, py2 - py1);
        // Glossy shimmer line
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 4, py1, 8, py2 - py1);
        ctx.fillStyle = CONFIG.COLORS.grease;
      });

      // Prizes hanging on pole
      pole.prizes.forEach(prize => {
        const py = baseY - prize.yOffset;
        if (!prize.taken) {
          ctx.save();
          ctx.translate(px + 35, py);
          if (prize.isBicycle) {
            // Draw Bicycle icon / badge at top
            ctx.fillStyle = CONFIG.COLORS.accentYellow;
            ctx.beginPath();
            ctx.arc(-15, 0, 12, 0, Math.PI * 2);
            ctx.arc(15, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillRect(-15, -18, 30, 6);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText('🚲 BICYCLE (500)', 30, 5);
          } else {
            // General prize badge
            ctx.fillStyle = CONFIG.COLORS.accentYellow;
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = CONFIG.COLORS.flagRed;
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#111';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(prize.points, 0, 4);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px sans-serif';
            ctx.fillText(`${prize.name} (+${prize.points})`, 24, 5);
          }
          ctx.restore();
        }
      });
    });

    // 4. Climber (Red Shirt)
    if (world.screen === 'play' || world.screen === 'results') {
      const activePole = world.polesData[world.climber.pole];
      const cx = activePole.x;
      const cy = CONFIG.POLE_BASE_Y - world.climber.height + (world.climber.slipJoltTimer > 0 ? 15 : 0);

      // Climber body
      ctx.fillStyle = CONFIG.COLORS.climberPants;
      ctx.fillRect(cx - 12, cy, 10, 25);
      ctx.fillRect(cx + 2, cy, 10, 25);

      ctx.fillStyle = CONFIG.COLORS.climberShirt;
      ctx.fillRect(cx - 16, cy - 35, 32, 35);

      // Head & skin
      ctx.fillStyle = CONFIG.COLORS.climberSkin;
      ctx.beginPath();
      ctx.arc(cx, cy - 45, 12, 0, Math.PI * 2);
      ctx.fill();

      // Red headband (Indonesian style)
      ctx.fillStyle = CONFIG.COLORS.flagRed;
      ctx.fillRect(cx - 13, cy - 52, 26, 6);
    }

    // Floating score labels
    world.floatingLabels.forEach(lbl => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, lbl.alpha);
      ctx.fillStyle = CONFIG.COLORS.accentYellow;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lbl.text, lbl.x, lbl.y);
      ctx.restore();
    });

    // 5. Crowd Silhouettes along bottom
    ctx.fillStyle = CONFIG.COLORS.crowd;
    ctx.beginPath();
    ctx.moveTo(0, H);
    let crowdSeed = 0;
    for (let x = 0; x <= W; x += 25) {
      const h = 70 + Math.sin(x * 0.1) * 20 + Math.cos(x * 0.05) * 15;
      ctx.lineTo(x, H - h);
      // Raised arms
      if (Math.floor(x / 25) % 3 === 0) {
        ctx.lineTo(x + 10, H - h - 35);
        ctx.lineTo(x + 20, H - h);
      }
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();

    // 6. HUD (Big & High-Contrast)
    if (world.screen === 'play') {
      // Top HUD Bar background
      ctx.fillStyle = CONFIG.COLORS.hudBg;
      ctx.fillRect(20, 20, W - 40, 75);
      ctx.strokeStyle = CONFIG.COLORS.accentYellow;
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, W - 40, 75);

      // Score (Top-Left)
      ctx.fillStyle = CONFIG.COLORS.hudText;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${world.score}`, 45, 68);

      // Timer (Top-Centre)
      ctx.textAlign = 'center';
      const timeSec = Math.ceil(world.time);
      ctx.fillStyle = timeSec <= 10 ? CONFIG.COLORS.barRed : CONFIG.COLORS.hudText;
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`⏳ ${timeSec}s`, W / 2, 70);

      // Grip Bar (Top-Right)
      ctx.textAlign = 'right';
      ctx.fillStyle = CONFIG.COLORS.hudText;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('GRIP', W - 230, 65);

      const barX = W - 210;
      const barY = 48;
      const barW = 160;
      const barH = 26;

      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);

      const gripRatio = Math.max(0, Math.min(100, world.climber.grip)) / 100;
      ctx.fillStyle = gripRatio > 0.3 ? CONFIG.COLORS.barGreen : CONFIG.COLORS.barRed;
      ctx.fillRect(barX, barY, barW * gripRatio, barH);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(world.climber.grip)}%`, barX + barW / 2, barY + 18);

      // Height Marker along side of current pole
      const activePole = world.polesData[world.climber.pole];
      const markerY = CONFIG.POLE_BASE_Y - world.climber.height;
      ctx.fillStyle = CONFIG.COLORS.accentYellow;
      ctx.beginPath();
      ctx.moveTo(activePole.x - 30, markerY);
      ctx.lineTo(activePole.x - 18, markerY - 8);
      ctx.lineTo(activePole.x - 18, markerY + 8);
      ctx.closePath();
      ctx.fill();
    }

    // 7. Screens: TITLE or RESULTS
    if (world.screen === 'title') {
      ctx.fillStyle = 'rgba(18, 8, 0, 0.85)';
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = 'center';
      ctx.fillStyle = CONFIG.COLORS.accentYellow;
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText('PANJAT PINANG', W / 2, 220);

      ctx.fillStyle = '#ffffff';
      ctx.font = '26px sans-serif';
      ctx.fillText('Panjat bambu licin, rebut hadiahnya!', W / 2, 280);

      // Controls box
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.fillRect(W / 2 - 380, 330, 760, 200);
      ctx.strokeStyle = CONFIG.COLORS.accentYellow;
      ctx.lineWidth = 2;
      ctx.strokeRect(W / 2 - 380, 330, 760, 200);

      ctx.fillStyle = CONFIG.COLORS.accentYellow;
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText('CONTROLS:', W / 2, 370);

      ctx.fillStyle = '#ffffff';
      ctx.font = '18px sans-serif';
      ctx.fillText('• HOLD Space, Mouse, or Touch to CLIMB (Release to REST & recover grip)', W / 2, 410);
      ctx.fillText('• LEFT / RIGHT arrows or A/D keys (or click poles) to SWITCH POLES', W / 2, 450);
      ctx.fillText('• Grab the BICYCLE at the top before time runs out to WIN!', W / 2, 490);

      // Start prompt
      ctx.fillStyle = CONFIG.COLORS.accentYellow;
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('▶ PRESS ENTER OR CLICK TO START ◀', W / 2, 600);
    } else if (world.screen === 'results') {
      ctx.fillStyle = 'rgba(18, 8, 0, 0.9)';
      ctx.fillRect(0, 0, W, H);

      ctx.textAlign = 'center';
      ctx.fillStyle = world.win ? CONFIG.COLORS.barGreen : CONFIG.COLORS.barRed;
      ctx.font = 'bold 64px sans-serif';
      ctx.fillText(world.win ? '🎉 YOU WIN! 🎉' : '⏰ TIME UP! ⏰', W / 2, 180);

      ctx.fillStyle = CONFIG.COLORS.accentYellow;
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(`FINAL SCORE: ${world.score}`, W / 2, 260);

      ctx.fillStyle = '#ffffff';
      ctx.font = '22px sans-serif';
      ctx.fillText(`Prizes Grabbed: ${world.prizesTakenCount} / 15`, W / 2, 320);
      ctx.fillText(`Best Score: ${world.bestScore}`, W / 2, 370);

      // Restart prompt
      ctx.fillStyle = CONFIG.COLORS.accentYellow;
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('▶ PRESS ENTER OR CLICK TO RESTART ◀', W / 2, 540);
    }
  }
}
