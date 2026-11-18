import { cpSync, mkdirSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// Hardening checks before writing dossier
const indexPath = resolve(__dirname, 'game', 'index.html');
if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
  throw new Error('Validation failed: game/index.html does not exist or is not a file.');
}

const screenshotsDir = resolve(__dirname, 'screenshots');
if (!existsSync(screenshotsDir) || !statSync(screenshotsDir).isDirectory()) {
  throw new Error('Validation failed: screenshots/ directory does not exist.');
}

const screenshotFiles = readdirSync(screenshotsDir)
  .filter(name => !name.startsWith('.'))
  .map(name => ({ name, path: join(screenshotsDir, name) }))
  .filter(f => statSync(f.path).isFile());

if (screenshotFiles.length < 3 || screenshotFiles.length > 4) {
  throw new Error(`Validation failed: screenshots/ holds ${screenshotFiles.length} image files (must be 3 or 4).`);
}

mkdirSync(outDir, { recursive: true });

cpSync(resolve(__dirname, 'game'), resolve(outDir, 'game'), { recursive: true });
cpSync(resolve(__dirname, 'screenshots'), resolve(outDir, 'screenshots'), { recursive: true });

const dossierBytes = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(resolve(outDir, 'dossier.json'), dossierBytes);
console.log(`Successfully generated dossier.json in ${outDir} (${dossierBytes.length} bytes)`);
