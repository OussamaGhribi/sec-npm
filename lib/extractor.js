import * as tar from 'tar';
import fs from 'fs';

export async function extractTarball(tarPath, extractPath) {
  if (!fs.existsSync(extractPath)) {
    fs.mkdirSync(extractPath, { recursive: true });
  }
  await tar.x({
    file: tarPath,
    cwd: extractPath,
    strip: 1
  });
}