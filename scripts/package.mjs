import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { buildExtension, root } from './build.mjs';

// A deterministic ZIP writer (stored entries): no shell, platform tools, or
// machine-specific timestamps. The small extension needs no extra compressor.
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
async function walk(dir, relative = '') {
  const files = [];
  for (const entry of (await readdir(path.join(dir, relative), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const name = relative ? `${relative}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await walk(dir, name));
    else if (entry.isFile()) files.push(name);
  }
  return files;
}
export async function packageExtension({ dist, outputDir = path.join(root, 'release') } = {}) {
  dist ||= await buildExtension();
  const local = [];
  const central = [];
  let offset = 0;
  const files = await walk(dist);
  for (const name of files) {
    const filename = Buffer.from(name);
    const data = await readFile(path.join(dist, name));
    const crc = crc32(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(0x0800, 6);
    header.writeUInt16LE(33, 12); // 1980-01-01 (DOS date).
    header.writeUInt32LE(crc, 14);
    header.writeUInt32LE(data.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(filename.length, 26);
    const directory = Buffer.alloc(46);
    directory.writeUInt32LE(0x02014b50, 0);
    directory.writeUInt16LE(20, 4);
    directory.writeUInt16LE(20, 6);
    directory.writeUInt16LE(0x0800, 8);
    directory.writeUInt16LE(33, 14);
    directory.writeUInt32LE(crc, 16);
    directory.writeUInt32LE(data.length, 20);
    directory.writeUInt32LE(data.length, 24);
    directory.writeUInt16LE(filename.length, 28);
    directory.writeUInt32LE(offset, 42);
    local.push(header, filename, data);
    central.push(directory, filename);
    offset += header.length + filename.length + data.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);
  const zip = Buffer.concat([...local, directory, end]);
  const { version } = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  await mkdir(outputDir, { recursive: true });
  const filename = `openplainenglish-${version}.zip`;
  await writeFile(path.join(outputDir, filename), zip);
  const checksum = `${createHash('sha256').update(zip).digest('hex')}  ${filename}\n`;
  await writeFile(path.join(outputDir, `${filename}.sha256`), checksum);
  console.log(`Packaged release/${filename} (${files.length} files, ${zip.length} bytes)\n${checksum.trim()}`);
  return { zipPath: path.join(outputDir, filename), checksumPath: path.join(outputDir, `${filename}.sha256`), checksum, files };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await packageExtension();
