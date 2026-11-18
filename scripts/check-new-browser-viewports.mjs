// Issue #239: new Chromium test entrypoints use one desktop content box.
// Existing tests are grandfathered by a fixed, accepted main commit; this
// check does not rewrite, run, or silently remove any legacy test or evidence.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync, readdirSync} from 'node:fs';
import {resolve, relative, dirname, basename, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(readFileSync(resolve(root, 'ci/desktop-browser-viewport.json'), 'utf8'));
const baselineSha = '0231280c506309f3487f0d4a8dfe2f266068a9bf';
const sourceFile = /\.(?:cjs|mjs|js)$/;

export function isBrowserTestEntry(path, source) {
  if (!/^(?:tests|scripts)\//.test(path) || !sourceFile.test(path)) return false;
  return (/^tests\//.test(path) && /(?:^|[-_.])browser(?:[-_.]|$)/i.test(basename(path)))
    || /\b(?:chromium|firefox|webkit)\s*\.\s*launch\s*\(/.test(source)
    || /(?:\bfrom\s*|\brequire\s*\(\s*|\bimport\s*\(\s*)['"](?:playwright|playwright-core)(?:\/[^'"]*)?['"]/.test(source);
}

export function checkNewBrowserTestSource(path, source) {
  if (!isBrowserTestEntry(path, source)) return [];
  const errors = [];
  if (!source.includes('standard-desktop-viewport.cjs'))
    errors.push('Import tests/helpers/standard-desktop-viewport.cjs');
  if (!/\bnewDesktopContext\s*\(/.test(source))
    errors.push('Create each browser context with newDesktopContext(browser, options)');
  if (/\.\s*newContext\s*\(/.test(source))
    errors.push('Direct browser.newContext is forbidden in new tests');
  if (/\.\s*setViewportSize\s*\(/.test(source))
    errors.push('Changing viewport sizes is forbidden in new tests');
  if (/\bviewport\s*:\s*\{/.test(source))
    errors.push('Inline viewport dimensions are forbidden in new tests');
  return errors.map(message => path + ': ' + message);
}

function allSources(directory, output = []) {
  for (const item of readdirSync(directory, {withFileTypes: true})) {
    const full = join(directory, item.name);
    if (item.isDirectory()) allSources(full, output);
    else if (item.isFile() && sourceFile.test(item.name)) output.push(full);
  }
  return output;
}

export function auditNewBrowserTests({base = root, oldPaths = null} = {}) {
  assert.equal(policy.schema, 'math-desktop-browser-viewport/1');
  assert.equal(policy.legacyBaselineCommit, baselineSha);
  assert.deepEqual([policy.width, policy.height], [1920, 1080]);
  // CI uses fetch-depth: 0. A missing baseline fails closed.
  const legacy = oldPaths || new Set(execFileSync('git',
    ['ls-tree', '-r', '--name-only', baselineSha, '--', 'tests', 'scripts'],
    {cwd: base, encoding: 'utf8'}).trim().split('\n').filter(Boolean));
  const seen = [];
  const errors = [];
  for (const top of ['tests', 'scripts']) {
    for (const full of allSources(resolve(base, top))) {
      const path = relative(base, full).split('\\').join('/');
      if (legacy.has(path)) continue;
      const source = readFileSync(full, 'utf8');
      if (!isBrowserTestEntry(path, source)) continue;
      seen.push(path);
      errors.push(...checkNewBrowserTestSource(path, source));
    }
  }
  return {schema: policy.schema, viewport: [policy.width, policy.height],
    grandfathered: legacy.size, newBrowserTests: seen.sort(), errors};
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const report = auditNewBrowserTests();
    process.stdout.write(JSON.stringify(report, null, 2) + '\n');
    if (report.errors.length) process.exitCode = 1;
  } catch (error) {
    console.error('Viewport policy audit failed closed: ' + String(error?.stack || error));
    process.exitCode = 1;
  }
}
