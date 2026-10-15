import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(root, '../portfolio-hub/dist');
const target = path.join(root, 'HTML', 'portfolio-current');
const legacy = path.join(root, 'HTML');
const files = ['index.html', 'styles.css', 'app.js', 'motion.js', 'fonts', 'covers', 'pages', 'media', 'motion'];

function digest(directory) {
  const hashes = {};
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name);
    if (filename === target) continue;
    if (entry.isDirectory()) {
      for (const [name, hash] of Object.entries(digest(filename))) hashes[`${entry.name}/${name}`] = hash;
    } else if (entry.isFile()) {
      hashes[entry.name] = createHash('sha256').update(fs.readFileSync(filename)).digest('hex');
    } else throw new Error(`Unsupported file: ${filename}`);
  }
  return hashes;
}

// Never overwrite either a prior release or the original website.
if (fs.existsSync(target)) throw new Error('portfolio-current already exists. Preserve or review it before preparing another release.');
for (const name of files) if (!fs.existsSync(path.join(source, name))) throw new Error(`Missing release asset: ${name}`);
const before = digest(legacy);
fs.mkdirSync(target);
for (const name of files) fs.cpSync(path.join(source, name), path.join(target, name), { recursive: true, errorOnExist: true, force: false });
const after = digest(legacy);
if (JSON.stringify(before) !== JSON.stringify(after)) throw new Error('Legacy website changed unexpectedly.');
const copied = digest(target);
for (const [name, hash] of Object.entries(copied)) {
  const original = createHash('sha256').update(fs.readFileSync(path.join(source, name))).digest('hex');
  if (original !== hash) throw new Error(`Release copy mismatch: ${name}`);
}
console.log(`Release prepared: ${Object.keys(copied).length} files; original HTML directory unchanged (${Object.keys(before).length} files).`);
console.log('Only public website assets were copied; no repository, editor metadata, source documents or credentials.');
