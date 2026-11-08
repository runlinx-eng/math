import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import os from 'node:os';
import net from 'node:net';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

test('the published entry points and runtime assets exist', () => {
  for (const file of [
    'index.html',
    'learn.html',
    'journey.html',
    'sw.js',
    'space.js',
    'space.css',
    'data/atlas.json',
    'vendor/three/three.module.min.js',
  ]) {
    assert.ok(fs.statSync(path.join(dist, file)).isFile(), `missing dist/${file}`);
  }
});

test('every service-worker precache entry resolves inside dist', () => {
  const sw = fs.readFileSync(path.join(dist, 'sw.js'), 'utf8');
  const match = sw.match(/const FILES = \[(.*?)\];/s);
  assert.ok(match, 'service worker must expose its static precache list');

  const entries = [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
  assert.ok(entries.length > 0, 'precache list must not be empty');

  const missing = entries.filter((entry) => {
    const url = new URL(entry, 'https://math-preview.invalid/');
    const relative = decodeURIComponent(url.pathname).replace(/^\//, '');
    const target = path.resolve(dist, relative || 'index.html');
    return !target.startsWith(dist + path.sep) && target !== path.join(dist, 'index.html')
      ? true
      : !fs.existsSync(target);
  });

  assert.deepEqual(missing, [], `missing service-worker resources: ${missing.join(', ')}`);
});

test('the preview server keeps the app under a protected root and a public health check', () => {
  const nginx = fs.readFileSync(path.join(root, 'deploy/vps/nginx-math-preview.conf.example'), 'utf8');
  assert.match(nginx, /root \/var\/www\/math-explorer-preview\/current;/);
  assert.match(nginx, /listen 8443 ssl;/);
  assert.match(nginx, /listen \[::\]:8443 ssl;/);
  assert.doesNotMatch(nginx, /^\s*listen\s+(?:\[::\]:)?443(?:\s|;)/m);
  assert.match(nginx, /return 308 https:\/\/\$host:8443\$request_uri;/);
  assert.match(nginx, /location \^~ \/\.well-known\/acme-challenge\//);
  assert.match(nginx, /location = \/health[\s\S]*?return 200/);
  assert.match(nginx, /location = \/login[\s\S]*?alias \/var\/www\/math-preview-login\/index\.html;/);
  assert.match(nginx, /auth_request \/__preview_auth;/);
  assert.match(nginx, /location = \/auth\/login[\s\S]*?proxy_pass http:\/\/127\.0\.0\.1:8765\/login;/);
  assert.match(nginx, /limit_req_status 429;/);
  assert.doesNotMatch(nginx, /auth_basic|\.htpasswd-math-preview/);
  assert.match(nginx, /try_files \$uri \$uri\/ =404;/);
  assert.match(nginx, /Cache-Control "no-cache"/);

  const authService = fs.readFileSync(path.join(root, 'deploy/vps/preview-auth.py'), 'utf8');
  assert.match(authService, /pbkdf2_hmac/);
  assert.match(authService, /hmac\.compare_digest/);
  assert.match(authService, /SameSite=Lax/);
  assert.match(authService, /HttpOnly/);
  assert.match(authService, /Secure/);
  assert.match(authService, /127\.0\.0\.1", 8765/);

  const login = fs.readFileSync(path.join(root, 'deploy/vps/preview-login.html'), 'utf8');
  assert.match(login, /action="\/auth\/login"/);
  assert.match(login, /name="password"/);
  assert.doesNotMatch(login, /password\s*[:=]\s*["'][^"']+["']/i);

  const serviceUnit = fs.readFileSync(path.join(root, 'deploy/vps/preview-auth.service'), 'utf8');
  assert.match(serviceUnit, /User=www-data/);
  assert.match(serviceUnit, /NoNewPrivileges=true/);

  const httpOnly = fs.readFileSync(path.join(root, 'deploy/vps/nginx-math-preview-http.conf.example'), 'utf8');
  assert.match(httpOnly, /listen 80;/);
  assert.match(httpOnly, /location \^~ \/\.well-known\/acme-challenge\//);
  assert.doesNotMatch(httpOnly, /listen 443|listen 8443/);

  const deploy = fs.readFileSync(path.join(root, '.github/workflows/deploy-vps.yml'), 'utf8');
  const rollback = fs.readFileSync(path.join(root, '.github/workflows/rollback-vps.yml'), 'utf8');
  assert.ok(deploy.includes("github.ref == 'refs/heads/main'"));
  assert.match(deploy, /workflow_dispatch:/);
  assert.doesNotMatch(deploy, /^\s+push:/m, 'merging main must not deploy');
  assert.ok(deploy.includes("confirm_deploy"));
  assert.ok(deploy.includes("inputs.confirm_deploy == true"));
  assert.ok(deploy.includes("github.event_name == 'workflow_dispatch'"));
  assert.ok(rollback.includes("github.ref == 'refs/heads/main'"));
  assert.match(rollback, /workflow_dispatch:/);
  assert.doesNotMatch(rollback, /^\s+push:/m, 'rollback must be explicitly requested');
  assert.ok(rollback.includes("github.event_name == 'workflow_dispatch'"));
});


test('shared preview auth service tests and installer syntax pass', () => {
  const python = spawnSync('python3', [path.join(root, 'tests/preview-auth.test.py')], { encoding: 'utf8' });
  assert.equal(python.status, 0, `Python auth tests failed:\n${python.stdout}\n${python.stderr}`);
  const shell = spawnSync('bash', ['-n', path.join(root, 'scripts/setup-preview-auth-vps.sh')], { encoding: 'utf8' });
  assert.equal(shell.status, 0, `VPS setup script syntax failed:\n${shell.stdout}\n${shell.stderr}`);
});

test('local launcher refuses to reuse an older checkout on the same port', async () => {
  // Regression: a stale main server could look healthy to a PR14 launcher.
  const probe = net.createServer();
  await new Promise((resolve, reject) => {
    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', resolve);
  });
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));

  const launcher = path.join(root, 'scripts/server.py');
  const other = fs.mkdtempSync(path.join(os.tmpdir(), 'math-other-checkout-'));
  fs.mkdirSync(path.join(other, 'scripts'));
  const otherLauncher = path.join(other, 'scripts/server.py');
  fs.copyFileSync(launcher, otherLauncher);
  const first = spawn('python3', [launcher, '--port', String(port)], { stdio: 'ignore' });
  try {
    let health;
    for (let i = 0; i < 60; i++) {
      if (first.exitCode !== null) throw new Error('Math server exited early');
      try {
        const response = await fetch('http://127.0.0.1:' + port + '/health');
        if (response.ok) { health = await response.json(); break; }
      } catch {}
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    assert.equal(health?.project_root, root, 'health must identify the served checkout');
    const same = spawnSync('python3', [launcher, '--port', String(port)], { encoding: 'utf8', timeout: 5000 });
    assert.equal(same.status, 0, same.stderr);
    assert.match(same.stdout, /当前项目目录/);

    const stale = spawnSync('python3', [otherLauncher, '--port', String(port)], { encoding: 'utf8', timeout: 5000 });
    assert.notEqual(stale.status, 0, 'a different checkout must not silently reuse the running server');
    assert.match(stale.stderr, /另一份数学探索服务占用/);
    assert.match(stale.stderr, /没有启动当前版本/);
  } finally {
    if (first.exitCode === null) {
      const exited = once(first, 'exit');
      first.kill('SIGTERM');
      await exited;
    }
    fs.rmSync(other, { recursive: true, force: true });
  }
});
