import { copyFileSync, existsSync, lstatSync, mkdirSync, realpathSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { output, publicFiles, root, sourceFile } from './site-files.mjs';

export function build() {
  const files = publicFiles();
  if (!files.includes('index.html')) throw new Error('index.html is required.');
  // Verify the exact deletion target before rebuilding this generated directory.
  if (dirname(output) !== root || basename(output) !== 'dist') {
    throw new Error('Build output must be the workspace dist directory.');
  }
  if (existsSync(output)) {
    if (lstatSync(output).isSymbolicLink() || realpathSync(output) !== output) {
      throw new Error('Refusing to replace a linked build directory.');
    }
    rmSync(output, { recursive: true });
  }
  mkdirSync(output, { recursive: true });
  for (const name of files) {
    const target = join(output, ...name.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(sourceFile(name), target);
  }
  console.log(`Built ${files.length} public files in ${output}`);
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) build();
