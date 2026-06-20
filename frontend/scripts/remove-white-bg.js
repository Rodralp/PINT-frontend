import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

const BADGES_DIR = path.resolve('public/badges');
const THRESHOLD = 240;

function processPNG(filePath) {
  const data = fs.readFileSync(filePath);
  const png = PNG.sync.read(data);

  for (let i = 0; i < png.data.length; i += 4) {
    const r = png.data[i];
    const g = png.data[i + 1];
    const b = png.data[i + 2];

    if (r >= THRESHOLD && g >= THRESHOLD && b >= THRESHOLD) {
      png.data[i + 3] = 0;
    }
  }

  const buffer = PNG.sync.write(png);
  fs.writeFileSync(filePath, buffer);
  console.log(`Processed: ${path.basename(filePath)}`);
}

const files = fs.readdirSync(BADGES_DIR).filter(f => f.endsWith('.png'));
for (const file of files) {
  processPNG(path.join(BADGES_DIR, file));
}
console.log('Done!');
