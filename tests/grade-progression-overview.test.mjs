import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = path => readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../dist/index.html");
const space = read("../dist/space.js");
const css = read("../dist/space.css");

test("relationship and grade observation share the existing guide panel", () => {
  const guide = html.indexOf('id="network-guide"');
  const modeSwitch = html.indexOf('id="observation-mode-switch"');
  const relationship = html.indexOf('id="relationship-observation-content"');
  const grade = html.indexOf('id="grade-observation-view"');
  const structure = html.indexOf('id="overview-structure-controls"');
  assert.ok(guide >= 0 && modeSwitch > guide && relationship > modeSwitch && grade > relationship);
  assert.ok(structure > grade);
  assert.match(html, /data-mode="relationship" aria-pressed="true">关系全景/);
  assert.match(html, /data-mode="grade" aria-pressed="false">年级观察/);
  assert.doesNotMatch(html, /id="grade-observation-toolbar"/);
});

test("switching observation mode only changes the guide panel contents", () => {
  const start = space.indexOf("function setObservationMode(mode){");
  const end = space.indexOf("\nfunction renderLocation()", start);
  assert.ok(start >= 0 && end > start);
  const implementation = space.slice(start, end);
  assert.match(implementation, /relationship\.hidden=next!=='relationship'/);
  assert.match(implementation, /grade\.hidden=next!=='grade'/);
  assert.match(implementation, /document\.body\.dataset\.observationMode=next/);
  assert.doesNotMatch(implementation, /scene\.|camera|zoom|fitGlobalView|setMode/);
  assert.match(space, /action==='observation-mode'/);
});

test("grade observation layout stays within the existing explanation area", () => {
  assert.match(css, /\.observation-mode-switch/);
  assert.match(css, /body\[data-observation-mode="grade"\] \.network-guide/);
  assert.match(css, /@media\(max-width:600px\).*observation-mode-switch/s);
});
