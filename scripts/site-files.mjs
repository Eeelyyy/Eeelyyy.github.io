import { existsSync, lstatSync, readdirSync, realpathSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = realpathSync(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
export const output = join(root, 'dist');

const topLevelFiles = new Set([
  'index.html', 'favicon.ico', 'favicon.svg', 'robots.txt',
  'sitemap.xml', 'CNAME', '.nojekyll', 'content/profile.json',
]);
const assetExtensions = new Set([
  '.css', '.js', '.mjs', '.json', '.png', '.jpg', '.jpeg', '.webp',
  '.avif', '.svg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.otf',
  '.pdf', '.mp4', '.webm', '.mp3', '.ogg', '.txt',
]);

export function isPublicPath(name) {
  if (topLevelFiles.has(name)) return true;
  const parts = name.split('/');
  return parts[0] === 'assets'
    && parts.length > 1
    && parts.every(part => part && !part.startsWith('.') && !/[\\:\0]/u.test(part))
    && assetExtensions.has(extname(name).toLowerCase());
}

export function sourceFile(name) {
  if (!isPublicPath(name)) throw new Error('Path is not a public website resource.');
  const candidate = join(root, ...name.split('/'));
  const actual = realpathSync(candidate);
  const inside = relative(root, actual);
  if (inside.startsWith(`..${sep}`) || inside === '..' || resolve(root, inside) !== actual
    || !isPublicPath(inside.split(sep).join('/')) || !lstatSync(actual).isFile()) {
    throw new Error('Resource is outside the public website files.');
  }
  return actual;
}

export function publicFiles() {
  const files = [...topLevelFiles].filter(name => existsSync(join(root, name)));
  const walk = (directory) => {
    if (lstatSync(directory).isSymbolicLink()) throw new Error('Build inputs cannot be symlinks.');
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = join(directory, entry.name);
      const name = relative(root, absolute).split(sep).join('/');
      if (entry.isSymbolicLink()) throw new Error(`Build input is a symlink: ${name}`);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.')) walk(absolute);
      } else if (entry.isFile() && isPublicPath(name)) files.push(name);
    }
  };
  const assets = join(root, 'assets');
  if (existsSync(assets)) walk(assets);
  for (const name of files) {
    const actual = sourceFile(name);
    if (actual !== join(root, ...name.split('/'))) throw new Error(`Build input is a symlink: ${name}`);
  }
  return files.sort();
}
