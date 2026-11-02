#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run this script as root on the VPS." >&2
  exit 1
fi
for command in curl python3 nginx systemctl; do
  command -v "$command" >/dev/null || { echo "Missing required command: $command" >&2; exit 1; }
done

RAW_BASE="https://raw.githubusercontent.com/runlinx-eng/math/main"
TMP_DIR="$(mktemp -d)"
BACKUP="/etc/nginx/sites-available/math-preview.before-shared-login.$(date +%Y%m%d%H%M%S)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Downloading reviewed shared-login files from main..."
curl -fsSL "${RAW_BASE}/deploy/vps/preview-auth.py" -o "${TMP_DIR}/preview-auth.py"
curl -fsSL "${RAW_BASE}/deploy/vps/preview-auth.service" -o "${TMP_DIR}/preview-auth.service"
curl -fsSL "${RAW_BASE}/deploy/vps/preview-login.html" -o "${TMP_DIR}/preview-login.html"
curl -fsSL "${RAW_BASE}/deploy/vps/nginx-math-preview.conf.example" -o "${TMP_DIR}/math-preview"

install -d -o root -g root -m 755 /opt/math-preview-auth /var/www/math-preview-login
install -m 644 "${TMP_DIR}/preview-auth.py" /opt/math-preview-auth/preview-auth.py
install -m 644 "${TMP_DIR}/preview-login.html" /var/www/math-preview-login/index.html
install -m 644 "${TMP_DIR}/preview-auth.service" /etc/systemd/system/math-preview-auth.service

echo
echo "Set the shared preview password. You may reuse the current preview password."
read -r -s -p "Shared preview password (12+ characters): " password
printf '\n'
read -r -s -p "Repeat shared preview password: " password_confirm
printf '\n'
if [[ "$password" != "$password_confirm" ]]; then
  unset password password_confirm
  echo "Passwords do not match. No Nginx changes have been made." >&2
  exit 1
fi
if [[ "${#password}" -lt 12 ]]; then
  unset password password_confirm
  echo "Use at least 12 characters. No Nginx changes have been made." >&2
  exit 1
fi

export MATH_PREVIEW_SETUP_PASSWORD="$password"
unset password password_confirm
install -d -o root -g www-data -m 750 /etc/math-preview-auth
python3 - <<'PY'
import hashlib, os, secrets, grp, pwd
password = os.environ.pop("MATH_PREVIEW_SETUP_PASSWORD")
salt = secrets.token_bytes(16)
iterations = 310_000
digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
password_hash = "pbkdf2_sha256$" + str(iterations) + "$" + salt.hex() + "$" + digest.hex()
secret = secrets.token_hex(32)
content = (
    "MATH_PREVIEW_PASSWORD_HASH=" + password_hash + "\n"
    "MATH_PREVIEW_SESSION_SECRET=" + secret + "\n"
    "MATH_PREVIEW_ORIGIN=https://math.664357788.xyz:8443\n"
    "MATH_PREVIEW_SESSION_TTL=43200\n"
)
path = "/etc/math-preview-auth.env"
fd = os.open(path + ".new", os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o640)
with os.fdopen(fd, "w", encoding="utf-8") as stream:
    stream.write(content)
os.chown(path + ".new", pwd.getpwnam("root").pw_uid, grp.getgrnam("www-data").gr_gid)
os.chmod(path + ".new", 0o640)
os.replace(path + ".new", path)
PY
unset MATH_PREVIEW_SETUP_PASSWORD

systemctl daemon-reload
systemctl enable --now math-preview-auth.service
if ! systemctl is-active --quiet math-preview-auth.service; then
  journalctl -u math-preview-auth.service -n 50 --no-pager
  echo "Auth service failed; existing Nginx configuration remains active." >&2
  exit 1
fi

if [[ -f /etc/nginx/sites-available/math-preview ]]; then
  cp -a /etc/nginx/sites-available/math-preview "${BACKUP}"
fi
install -m 644 "${TMP_DIR}/math-preview" /etc/nginx/sites-available/math-preview
if ! nginx -t; then
  if [[ -f "${BACKUP}" ]]; then
    cp -a "${BACKUP}" /etc/nginx/sites-available/math-preview
    nginx -t && systemctl reload nginx
  fi
  echo "Nginx validation failed; previous configuration was restored." >&2
  exit 1
fi
systemctl reload nginx

echo
echo "=== Local health check ==="
curl --resolve math.664357788.xyz:8443:127.0.0.1 -fsS https://math.664357788.xyz:8443/health
echo
echo "=== Login page ==="
curl --resolve math.664357788.xyz:8443:127.0.0.1 -sS -o /dev/null -w 'HTTP %{http_code}\n' https://math.664357788.xyz:8443/login
echo "=== Unauthenticated app request (expected 302) ==="
curl --resolve math.664357788.xyz:8443:127.0.0.1 -sS -o /dev/null -w 'HTTP %{http_code}\n' https://math.664357788.xyz:8443/
echo "=== Services ==="
systemctl is-active nginx
systemctl is-active math-preview-auth.service
systemctl is-active xray
echo "=== Ports (443 must remain Xray; 8443 must remain Nginx) ==="
ss -ltnp | grep -E ':(22|80|443|8443|8765)\b' || true
echo
echo "The old htpasswd file is retained as a rollback fallback but is no longer referenced by Nginx."
echo "Previous Nginx configuration backup: ${BACKUP}"
