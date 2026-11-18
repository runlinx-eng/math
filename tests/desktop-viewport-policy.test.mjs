import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdtempSync, mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {isBrowserTestEntry, checkNewBrowserTestSource, auditNewBrowserTests}
  from '../scripts/check-new-browser-viewports.mjs';

const require = createRequire(import.meta.url);
const {STANDARD_DESKTOP_VIEWPORT, newDesktopContext} = require('./helpers/standard-desktop-viewport.cjs');

test('new Chromium contexts always use a 1920x1080 content viewport', async () => {
  assert.deepEqual(STANDARD_DESKTOP_VIEWPORT, {width: 1920, height: 1080});
  assert.equal(Object.isFrozen(STANDARD_DESKTOP_VIEWPORT), true);
  let options;
  const fake = {newContext: async value => {options = value; return {ok: true};}};
  assert.deepEqual(await newDesktopContext(fake, {serviceWorkers: 'allow'}), {ok: true});
  assert.deepEqual(options, {serviceWorkers: 'allow', viewport: {width: 1920, height: 1080}});
  assert.notStrictEqual(options.viewport, STANDARD_DESKTOP_VIEWPORT);
  await assert.rejects(newDesktopContext(fake, {viewport: {width: 1280, height: 720}}));
  await assert.rejects(newDesktopContext(fake, {viewport: null}));
  await newDesktopContext(fake, {viewport: {width: 1920, height: 1080}});
});

test('new browser test guard rejects arbitrary viewport and missing helper', () => {
  const file = 'tests/new-family-adapter-browser.cjs';
  const good = "const {newDesktopContext} = require('./helpers/standard-desktop-viewport.cjs');\nawait newDesktopContext(browser, {serviceWorkers: 'allow'});";
  assert.equal(isBrowserTestEntry(file, good), true);
  assert.deepEqual(checkNewBrowserTestSource(file, good), []);
  const bad = "const ctx = await browser.newContext({viewport:{width:620,height:800}});\nawait page.setViewportSize({width:980,height:760});";
  const errors = checkNewBrowserTestSource(file, bad);
  assert.ok(errors.length >= 4);
  assert.ok(errors.some(x => x.includes('Direct browser.newContext')));
  assert.ok(errors.some(x => x.includes('Changing viewport sizes')));
  assert.deepEqual(checkNewBrowserTestSource('tests/math-model.test.mjs', bad), []);
});

test('grandfathers historical files and fails closed on newly added viewport tests', () => {
  const base = mkdtempSync(join(tmpdir(), 'math-browser-viewport-policy-'));
  try {
    mkdirSync(join(base, 'tests'));
    mkdirSync(join(base, 'scripts'));
    const legacy = 'tests/old-lesson-browser.cjs';
    const newTest = 'tests/new-lesson-browser.cjs';
    const compliant = 'tests/new-compliant-browser.cjs';
    const source = "const ctx = await browser.newContext({viewport: {width:620,height:800}});";
    writeFileSync(join(base, 'tests/old-lesson-browser.cjs'), source);
    writeFileSync(join(base, 'tests/new-lesson-browser.cjs'), source);
    writeFileSync(join(base, 'tests/new-compliant-browser.cjs'),
      "const {newDesktopContext} = require('./helpers/standard-desktop-viewport.cjs');\nawait newDesktopContext(browser);");
    const report = auditNewBrowserTests({base, oldPaths: new Set([legacy])});
    assert.equal(report.errors.some(x => x.includes(legacy)), false);
    assert.equal(report.errors.some(x => x.includes(newTest)), true);
    assert.equal(report.errors.some(x => x.includes(compliant)), false);
    assert.deepEqual(report.newBrowserTests, [compliant, newTest]);
  } finally {
    rmSync(base, {recursive: true, force: true});
  }
});
