// P8-START: matched before/after startup evidence in real Chromium.
// Local comparison only. This test does NOT assert VPS timings or speed targets.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.MATH_PLAYWRIGHT_MODULE || 'playwright');
const before = process.env.MATH_STARTUP_BEFORE || 'http://127.0.0.1:43828';
const after = process.env.MATH_STARTUP_AFTER || 'http://127.0.0.1:43827';
const rounds = Number(process.env.MATH_STARTUP_ROUNDS || 5);
const output = path.resolve(__dirname, '../verification/p8-startup');
fs.mkdirSync(output, { recursive: true });

function summary(values) {
  const v = values.filter(Number.isFinite).sort((a, b) => a - b);
  return { count: v.length, median: v.length ? v[Math.floor(v.length / 2)] : null,
    p95: v.length ? v[Math.ceil(v.length * .95) - 1] : null,
    max: v.length ? v[v.length - 1] : null };
}
function check(ok, reason) { if (!ok) throw new Error(reason); }
function inject(body, anchor, addition) {
  check(body.includes(anchor), 'Instrumentation anchor missing: ' + anchor.slice(0, 60));
  return body.replace(anchor, addition);
}
async function instrument(page) {
  await page.addInitScript(() => {
    window.__startupLongTasks = [];
    try {
      new PerformanceObserver(list => {
        for (const item of list.getEntries()) {
          window.__startupLongTasks.push({ start: item.startTime, duration: item.duration });
        }
      }).observe({ type: 'longtask', buffered: true });
    } catch {}
  });
  await page.route('**/space.js', async route => {
    const response = await route.fetch();
    let body = await response.text();
    body = inject(body, 'async function boot(){try {',
      "async function boot(){try {performance.mark('math:boot-start');");
    body = inject(body, "atlas=applyNavigationCopy(await response.json());",
      "atlas=applyNavigationCopy(await response.json());performance.mark('math:atlas-ready');");
    body = inject(body, 'space=buildRelationshipSpace(atlas);',
      "performance.mark('math:space-build-start');space=buildRelationshipSpace(atlas);performance.mark('math:space-built');");
    body = inject(body, "scene=new SpatialScene($('#space-canvas')",
      "performance.mark('math:webgl-start');scene=new SpatialScene($('#space-canvas')");
    body = inject(body, "const defaultMode=worldLayout==='network'",
      "performance.mark('math:webgl-created');const defaultMode=worldLayout==='network'");
    body = inject(body, "$('#loading').hidden=true;$('#space-app').classList.add('ready');offline();",
      "performance.mark('math:boot-ready');$('#loading').hidden=true;$('#space-app').classList.add('ready');offline();");
    await route.fulfill({ response, body });
  });
  await page.route('**/spatial-scene.js', async route => {
    const response = await route.fetch();
    let body = await response.text();
    const render = 'this.renderer.render(this.scene,this.camera);';
    check(body.includes(render), 'WebGL render anchor missing');
    body = body.replaceAll(render, render +
      "if(!performance.getEntriesByName('math:first-webgl-frame').length)performance.mark('math:first-webgl-frame');");
    await route.fulfill({ response, body });
  });
}
function metricsMap(list) {
  return Object.fromEntries(list.map(metric => [metric.name, metric.value]));
}
function value(map, key) { return Number.isFinite(map[key]) ? map[key] : null; }
async function measure(browser, version, scenario, round, mode, url, context) {
  const owned = !context;
  const ctx = context || await browser.newContext({ viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce', serviceWorkers: 'block' });
  const page = owned ? await ctx.newPage() : ctx.pages()[0];
  const errors = [], failures = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('requestfailed', r => failures.push({ url: r.url(), failure: r.failure()?.errorText }));
  if (owned) await instrument(page);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Performance.enable');
  const initial = metricsMap((await cdp.send('Performance.getMetrics')).metrics);
  let result;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.waitForFunction(() => {
      const app = document.querySelector('#space-app');
      const loading = document.querySelector('#loading');
      return app?.classList.contains('ready') && loading?.hidden &&
        window.mathSpace?.snapshot()?.counts?.nodes === 587 &&
        performance.getEntriesByName('math:first-webgl-frame').length > 0;
    }, null, { timeout: 45000 });
    await page.evaluate(() => new Promise(resolve =>
      requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const ended = metricsMap((await cdp.send('Performance.getMetrics')).metrics);
    result = await page.evaluate(() => {
      const marks = Object.fromEntries(performance.getEntriesByType('mark')
        .filter(e => e.name.startsWith('math:')).map(e => [e.name, e.startTime]));
      const nav = performance.getEntriesByType('navigation')[0];
      const files = performance.getEntriesByType('resource');
      const transfers = [nav, ...files].filter(Boolean);
      const atlas = files.find(x => x.name.includes('/data/atlas.json'));
      const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint');
      const firstFrame = marks['math:first-webgl-frame'];
      const ready = marks['math:boot-ready'];
      return {
        marks, atlas: atlas ? { durationMs: atlas.duration, transferBytes: atlas.transferSize,
          decodedBytes: atlas.decodedBodySize, responseEnd: atlas.responseEnd } : null,
        navigationMs: nav?.duration ?? null,
        responseEndMs: nav?.responseEnd ?? null,
        firstContentfulPaintMs: fcp?.startTime ?? null,
        first3dFrameMs: firstFrame ?? null,
        interactiveMs: Math.max(firstFrame ?? 0, ready ?? 0),
        loadingGoneMs: ready ?? null,
        criticalModulesMs: marks['math:boot-start'] ?? null,
        atlasAndNavigationMs: marks['math:atlas-ready'] !== undefined && marks['math:boot-start'] !== undefined ?
          marks['math:atlas-ready'] - marks['math:boot-start'] : null,
        relationshipBuildMs: marks['math:space-built'] !== undefined && marks['math:space-build-start'] !== undefined ?
          marks['math:space-built'] - marks['math:space-build-start'] : null,
        webglConstructionMs: marks['math:webgl-created'] !== undefined && marks['math:webgl-start'] !== undefined ?
          marks['math:webgl-created'] - marks['math:webgl-start'] : null,
        requestCount: transfers.length,
        transferBytes: transfers.reduce((sum, e) => sum + (e.transferSize || 0), 0),
        decodedBytes: transfers.reduce((sum, e) => sum + (e.decodedBodySize || 0), 0),
        longTaskCount: (window.__startupLongTasks || []).length,
        longTaskMs: (window.__startupLongTasks || []).reduce((sum, t) => sum + t.duration, 0),
        state: { ready: document.querySelector('#space-app')?.classList.contains('ready'),
          nodeCount: window.mathSpace.snapshot().counts.nodes,
          selected: window.mathSpace.snapshot().selected,
          surface: new URL(location.href).searchParams.get('surface') || 'explore' }
      };
    });
    result.taskDurationMs = value(ended, 'TaskDuration') === null || value(initial, 'TaskDuration') === null ?
      null : (ended.TaskDuration - initial.TaskDuration) * 1000;
    result.scriptDurationMs = value(ended, 'ScriptDuration') === null || value(initial, 'ScriptDuration') === null ?
      null : (ended.ScriptDuration - initial.ScriptDuration) * 1000;
    result.layoutDurationMs = value(ended, 'LayoutDuration') === null || value(initial, 'LayoutDuration') === null ?
      null : (ended.LayoutDuration - initial.LayoutDuration) * 1000;
    result.errors = errors; result.failures = failures;
    check(!errors.length && !failures.length, version + ' ' + scenario + ' browser errors ' + JSON.stringify({ errors, failures }));
    check(result.interactiveMs >= result.first3dFrameMs && result.interactiveMs >= result.loadingGoneMs,
      'Interactive time is inconsistent');
    check(result.state.ready && result.state.nodeCount === 587, '3D scene not ready');
    if (scenario.includes('learn')) check(result.state.surface === 'learn', 'Learn deep link lost');
    if (scenario.includes('trail')) check(result.state.surface === 'trail', 'Trail deep link lost');
    const sample = { version, scenario, round, ...result };
    console.log('P8_STARTUP_SAMPLE ' + JSON.stringify(sample));
    return { sample, ctx, page };
  } catch (error) {
    const failure = { version, scenario, round, message: String(error.stack || error),
      errors, failures, pageUrl: page.url() };
    console.error('P8_STARTUP_FAILURE ' + JSON.stringify(failure));
    fs.writeFileSync(path.join(output, 'failure-' + version + '-' + scenario + '-' + round + '.json'),
      JSON.stringify(failure, null, 2));
    if (owned) await ctx.close();
    throw error;
  } finally {
    await cdp.detach().catch(() => {});
  }
}
async function main() {
  check(Number.isInteger(rounds) && rounds >= 3 && rounds <= 12, 'Round count must be between 3 and 12');
  const browser = await chromium.launch({ headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const samples = [];
  const paths = [
    ['explore', '/?world=network&layout=53#space'],
    ['learn-deep', '/?world=network&layout=53&surface=learn#space/node/mt_Ep7TDFuYUa'],
    ['trail-deep', '/?world=network&layout=53&surface=trail#space/node/mt_WcfaSfVT33']
  ];
  try {
    for (let round = 0; round < rounds; round++) {
      // Alternate ordering to reduce shared-runner thermal or scheduling bias.
      const versions = round % 2 ? [['candidate', after], ['baseline', before]] :
        [['baseline', before], ['candidate', after]];
      for (const [version, host] of versions) {
        for (const [scenario, suffix] of paths) {
          // All cold entries get independent storage and cache. Explore gets a
          // warm reload in the SAME context, without changing the URL or state.
          const result = await measure(browser, version, scenario, round, 'cold', host + suffix);
          samples.push(result.sample);
          if (scenario === 'explore') {
            const warm = await measure(browser, version, 'explore-refresh', round,
              'warm', host + suffix, result.ctx);
            samples.push(warm.sample);
          }
          await result.ctx.close();
        }
      }
    }
    const metrics = ['interactiveMs', 'first3dFrameMs', 'loadingGoneMs', 'criticalModulesMs',
      'atlasAndNavigationMs', 'relationshipBuildMs', 'webglConstructionMs',
      'scriptDurationMs', 'taskDurationMs', 'requestCount', 'transferBytes', 'decodedBytes',
      'longTaskMs'];
    const aggregates = {};
    for (const version of ['baseline', 'candidate']) {
      aggregates[version] = {};
      for (const scenario of ['explore', 'explore-refresh', 'learn-deep', 'trail-deep']) {
        const group = samples.filter(s => s.version === version && s.scenario === scenario);
        aggregates[version][scenario] = Object.fromEntries(metrics.map(m =>
          [m, summary(group.map(s => s[m]))]));
      }
    }
    const report = { source: 'GitHub Actions isolated Chromium; not VPS', serviceWorkers: 'blocked',
      runtime: { browserVersion: browser.version(), rounds, viewport: '1440x900',
        network: 'two loopback Python HTTP servers; no artificial throttling',
        baseReference: process.env.MATH_STARTUP_BASE_SHA || 'unspecified' },
      aggregates, samples };
    fs.writeFileSync(path.join(output, 'comparison.json'), JSON.stringify(report, null, 2));
    console.log('P8_STARTUP_COMPARISON ' + JSON.stringify({ runtime: report.runtime, aggregates }));
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.stack || error); process.exitCode = 1; });
