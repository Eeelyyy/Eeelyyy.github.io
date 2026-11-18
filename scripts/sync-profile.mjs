import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { root } from './site-files.mjs';
import { renderProfile } from './profile-html.mjs';

const file = join(root, 'index.html');
writeFileSync(file, renderProfile(readFileSync(file, 'utf8')));
console.log('Synced public profile into index.html. No browser JavaScript required for research content.');
