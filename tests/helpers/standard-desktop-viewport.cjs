'use strict';
// All new browser tests use this context factory. Legacy browser tests stay as written.
const assert = require('node:assert/strict');
const policy = require('../../ci/desktop-browser-viewport.json');

assert.equal(policy.schema, 'math-desktop-browser-viewport/1');
assert.equal(policy.width, 1920);
assert.equal(policy.height, 1080);

const STANDARD_DESKTOP_VIEWPORT = Object.freeze({width: policy.width, height: policy.height});

async function newDesktopContext(browser, options = {}) {
  assert.ok(browser && typeof browser.newContext === 'function', 'A Playwright browser is required');
  assert.ok(options && typeof options === 'object' && !Array.isArray(options), 'Invalid context options');
  if (Object.hasOwn(options, 'viewport')) {
    assert.deepEqual(options.viewport, STANDARD_DESKTOP_VIEWPORT, 'New tests must use the standard 1920x1080 viewport');
  }
  return browser.newContext({...options, viewport: {...STANDARD_DESKTOP_VIEWPORT}});
}

module.exports = {STANDARD_DESKTOP_VIEWPORT, newDesktopContext};
