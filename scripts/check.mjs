import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { isPublicPath, publicFiles, root, sourceFile } from './site-files.mjs';

const failures = [];
const expect = (condition, message) => { if (!condition) failures.push(message); };
const readJson = name => JSON.parse(readFileSync(join(root, name), 'utf8').replace(/^\uFEFF/u, ''));
const secretPattern = /(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----)/u;
const textExtensions = new Set(['.md', '.json', '.html', '.css', '.js', '.mjs', '.ps1', '.yml', '.yaml', '.txt', '.svg', '.toml', '.tex']);

try {
  const profile = readJson('content/profile.json');
  const manifest = readJson('figs/manifest.json');
  expect(profile.schemaVersion === 1, 'Unsupported profile schemaVersion.');
  expect(manifest.schemaVersion === 1, 'Unsupported asset manifest schemaVersion.');
  expect(readdirSync(root).includes('AGENTS.md'), 'Use the exact filename AGENTS.md.');
  expect(/^\d{4}-\d{2}-\d{2}$/u.test(profile.source?.asOf ?? ''), 'Profile source.asOf is required.');
  expect(Boolean(profile.person?.name && profile.person?.email), 'Name and public email are required.');
  for (const section of ['education', 'internships', 'publications', 'research', 'interests', 'news']) {
    expect(Array.isArray(profile[section]), `${section} must be an array.`);
  }
  for (const section of ['education', 'internships', 'publications', 'research']) {
    const entries = profile[section] ?? [];
    expect(entries.every(entry => entry.id), `${section} entries need stable IDs.`);
    expect(new Set(entries.map(entry => entry.id)).size === entries.length, `${section} has duplicate IDs.`);
    for (const entry of entries) {
      for (const field of ['start', 'end', 'expectedStart']) {
        if (entry[field] != null) expect(/^\d{4}-(0[1-9]|1[0-2])$/u.test(entry[field]), `${section}/${entry.id}: invalid ${field}.`);
      }
      if (entry.start && entry.end) expect(entry.start <= entry.end, `${section}/${entry.id}: reversed date range.`);
    }
  }
  for (const study of profile.education ?? []) {
    if (study.status === 'incoming') {
      expect(Boolean(study.expectedStart) && /Expected/iu.test(study.dateLabel ?? ''), `${study.id}: incoming education needs an expected date label.`);
    }
  }
  const publicationIds = new Set((profile.publications ?? []).map(item => item.id));
  const researchIds = new Set((profile.research ?? []).map(item => item.id));
  for (const publication of profile.publications ?? []) {
    expect(['accepted', 'submitted', 'under_review', 'published', 'preprint'].includes(publication.status), `${publication.id}: unknown publication status.`);
    expect(Boolean(publication.statusLabel), `${publication.id}: statusLabel is required.`);
    if (publication.researchId) expect(researchIds.has(publication.researchId), `${publication.id}: missing linked research.`);
    for (const field of ['arxiv', 'code', 'projectPage']) {
      const value = publication[field];
      expect(value === null || (typeof value === 'string' && value.startsWith('https://')), `${publication.id}/${field}: use an HTTPS URL or null.`);
    }
  }
  for (const research of profile.research ?? []) {
    if (research.publicationId) expect(publicationIds.has(research.publicationId), `${research.id}: missing linked publication.`);
  }
  const profileText = JSON.stringify(profile);
  expect(!/"(?:phone|telephone|mobile)"\s*:/iu.test(profileText), 'Public profile contains a phone field; review the content policy.');
  expect(!/\b1[3-9]\d{9}\b/u.test(profileText), 'Public profile may contain a personal mobile number.');
  expect(!secretPattern.test(profileText), 'Public profile contains a credential-like value.');
  for (const field of ['portrait', 'cvPdf']) {
    const value = profile.person?.[field];
    if (value != null) expect(isPublicPath(value) && existsSync(join(root, value)), `${field}: public asset is missing.`);
  }

  const assets = manifest.assets ?? [];
  const originalFiles = readdirSync(join(root, 'figs')).filter(name => /\.png$/iu.test(name));
  expect(assets.length === originalFiles.length, 'Asset manifest must cover all original PNG files.');
  expect(new Set(assets.map(asset => asset.id)).size === assets.length, 'Asset manifest has duplicate IDs.');
  expect(new Set(assets.map(asset => asset.filename)).size === assets.length, 'Asset manifest has duplicate filenames.');
  for (const asset of assets) {
    expect(originalFiles.includes(asset.filename) && asset.path === `figs/${asset.filename}`, `Invalid original asset path for ${asset.id}.`);
    if (!originalFiles.includes(asset.filename)) continue;
    const bytes = readFileSync(join(root, 'figs', asset.filename));
    expect(bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `${asset.id}: invalid PNG signature.`);
    expect(bytes.length === asset.bytes && bytes.readUInt32BE(16) === asset.width && bytes.readUInt32BE(20) === asset.height, `${asset.id}: image metadata changed.`);
    expect(createHash('sha256').update(bytes).digest('hex') === asset.sha256, `${asset.id}: original image changed.`);
    for (const derivative of asset.derivatives ?? []) {
      expect(typeof derivative === 'string' && derivative.startsWith('assets/images/') && isPublicPath(derivative) && existsSync(join(root, derivative)), `${asset.id}: derivative must be an existing public image path.`);
    }
  }

  const publicNames = new Set(publicFiles());
  expect(publicNames.has('index.html'), 'index.html is missing.');
  const html = readFileSync(sourceFile('index.html'), 'utf8');
  for (const [, attribute, target] of html.matchAll(/\b(href|src)\s*=\s*["']([^"']*)["']/giu)) {
    if (/^(?:https?:|mailto:|tel:|data:|\/\/)/iu.test(target)) continue;
    if (target.startsWith('#')) {
      expect(target.length > 1, `${attribute}: remove empty anchor placeholders.`);
      continue;
    }
    const name = decodeURIComponent(target.split(/[?#]/u)[0]).replace(/^\//u, '').replace(/^\.\//u, '');
    if (name) expect(publicNames.has(name), `${attribute}: local resource is absent from the public build: ${name}`);
  }
  const gitFiles = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
  for (const name of gitFiles) {
    expect(!name.startsWith('private/') && (!/(^|\/)\.env(?:\.|$)/u.test(name) || name === '.env.example'), `Private file is eligible for commit: ${name}`);
    if (!textExtensions.has(extname(name)) && !['.gitignore', '.gitattributes'].includes(name)) continue;
    if (!existsSync(join(root, name))) continue;
    expect(!secretPattern.test(readFileSync(join(root, name), 'utf8')), `Credential-like content found in ${name}; value suppressed.`);
  }
  if (existsSync(join(root, 'private', 'cv-original.tex'))) {
    const ignored = execFileSync('git', ['check-ignore', 'private/cv-original.tex'], { cwd: root, encoding: 'utf8' }).trim();
    expect(Boolean(ignored), 'Original CV must stay ignored by Git.');
  }
  console.log(`Checked profile, ${assets.length} original images, ${publicNames.size} public files, and ${gitFiles.length} repository files.`);
  console.log('External academic claims and browser rendering are not verified by this command.');
} catch (error) {
  failures.push(error.message);
}

if (failures.length) {
  for (const failure of failures) console.error(`FAIL: ${failure}`);
  process.exitCode = 1;
} else console.log('Workspace checks passed.');
