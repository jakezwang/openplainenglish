import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { root } from './build.mjs';
import { buildSDK } from './build-sdk.mjs';

export async function packageSDK({ directory, outputDir = path.join(root, 'release') } = {}) {
  directory ||= await buildSDK();
  await mkdir(outputDir, { recursive: true });
  const { stdout } = await promisify(execFile)('npm', ['pack', directory, '--pack-destination', outputDir, '--ignore-scripts', '--json']);
  const [{ filename, files }] = JSON.parse(stdout);
  const packagePath = path.join(outputDir, filename);
  const bytes = await readFile(packagePath);
  const checksum = `${createHash('sha256').update(bytes).digest('hex')}  ${filename}\n`;
  const checksumPath = path.join(outputDir, `${filename}.sha256`);
  await writeFile(checksumPath, checksum);
  console.log(`Packed ${filename}\n${checksum.trim()}`);
  return { packagePath, checksumPath, checksum, files: files.map(({ path: file }) => file) };
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await packageSDK();
