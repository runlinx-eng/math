#!/usr/bin/env bash
set -euo pipefail

: "${VPS_HOST:?Set VPS_HOST}"
: "${VPS_USER:?Set VPS_USER}"
: "${VPS_WEB_ROOT:?Set VPS_WEB_ROOT}"
: "${VPS_URL:?Set VPS_URL}"
: "${VPS_SSH_KEY_FILE:?Set VPS_SSH_KEY_FILE}"
: "${VPS_KNOWN_HOSTS_FILE:?Set VPS_KNOWN_HOSTS_FILE}"

VPS_PORT="${VPS_PORT:-22}"
VPS_WEB_ROOT="${VPS_WEB_ROOT%/}"
[[ "$VPS_WEB_ROOT" =~ ^/var/www/[A-Za-z0-9._/-]+$ && "$VPS_WEB_ROOT" != *".."* ]] || {
  echo "VPS_WEB_ROOT must be a safe path under /var/www." >&2
  exit 1
}
[[ "$VPS_PORT" =~ ^[0-9]{1,5}$ ]] || { echo "VPS_PORT must be numeric." >&2; exit 1; }
[[ "$VPS_URL" == https://* ]] || { echo "VPS_URL must use HTTPS." >&2; exit 1; }
[[ -s "$VPS_SSH_KEY_FILE" && -s "$VPS_KNOWN_HOSTS_FILE" ]] || {
  echo "SSH key and pinned known_hosts file are required." >&2
  exit 1
}

ssh_opts=(
  -p "$VPS_PORT"
  -i "$VPS_SSH_KEY_FILE"
  -o BatchMode=yes
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=yes
  -o "UserKnownHostsFile=$VPS_KNOWN_HOSTS_FILE"
)

ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" "VPS_WEB_ROOT='$VPS_WEB_ROOT' bash -s" <<'REMOTE'
set -euo pipefail
root="$VPS_WEB_ROOT"
test -L "$root/current"
test -L "$root/previous"
current_target="$(readlink "$root/current")"
previous_target="$(readlink "$root/previous")"
ln -sfn "$previous_target" "$root/.rollback"
mv -Tf "$root/.rollback" "$root/current"
ln -sfn "$current_target" "$root/previous"
REMOTE

if ! curl -fsS --max-time 8 "${VPS_URL%/}/health" | grep -q '"app":"math-explorer"'; then
  echo "Rollback health check failed; restoring the prior current release." >&2
  ssh "${ssh_opts[@]}" "$VPS_USER@$VPS_HOST" "VPS_WEB_ROOT='$VPS_WEB_ROOT' bash -s" <<'REMOTE'
set -euo pipefail
root="$VPS_WEB_ROOT"
current_target="$(readlink "$root/current")"
previous_target="$(readlink "$root/previous")"
ln -sfn "$previous_target" "$root/.restore"
mv -Tf "$root/.restore" "$root/current"
ln -sfn "$current_target" "$root/previous"
REMOTE
  exit 1
fi

echo "Rollback completed: $VPS_URL"
