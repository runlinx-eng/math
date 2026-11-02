import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  assert.ok(deploy.includes("vars.VPS_DEPLOY_ENABLED == 'true'"));
  assert.ok(deploy.includes("confirm_deploy"));
  assert.ok(deploy.includes("inputs.confirm_deploy == true"));
  assert.ok(rollback.includes("github.ref == 'refs/heads/main'"));
  assert.ok(rollback.includes("vars.VPS_DEPLOY_ENABLED == 'true'"));
});
