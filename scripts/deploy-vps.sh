#!/usr/bin/env bash
set -euo pipefail

: "${VPS_HOST:?Set VPS_HOST}"
: "${VPS_USER:?Set VPS_USER}"
: "${VPS_WEB_ROOT:?Set VPS_WEB_ROOT}"
: "${VPS_URL:?Set VPS_URL}"
: "${VPS_SSH_KEY_FILE:?Set VPS_SSH_KEY_FILE}"
: "${VPS_KNOWN_HOSTS_FILE:?Set VPS_KNOWN_HOSTS_FILE}"
# For workflow_run, GITHUB_SHA identifies the dispatcher, not necessarily the tested commit.
# Preserve existing manual callers that only provide GITHUB_SHA.
RELEASE_SHA="${RELEASE_SHA:-${GITHUB_SHA:-}}"
: "${RELEASE_SHA:?Set RELEASE_SHA or GITHUB_SHA}"

VPS_PORT="${VPS_PORT:-22}"
VPS_WEB_ROOT="${VPS_WEB_ROOT%/}"

[[ "$VPS_WEB_ROOT" =~ ^/var/www/[A-Za-z0-9._/-]+$ && "$VPS_WEB_ROOT" != *".."* ]] || {
  echo "VPS_WEB_ROOT must be a safe path under /var/www." >&2
  exit 1
}
[[ "$VPS_PORT" =~ ^[0-9]{1,5}$ ]] || { echo "VPS_PORT must be numeric." >&2; exit 1; }
[[ "$VPS_URL" =~ ^https://[^/]+/?$ ]] || { echo "VPS_URL must be an HTTPS origin without a path." >&2; exit 1; }
[[ "$RELEASE_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "RELEASE_SHA must be a full commit SHA." >&2; exit 1; }
[[ -s "$VPS_SSH_KEY_FILE" && -s "$VPS_KNOWN_HOSTS_FILE" ]] || {
  echo "SSH key and pinned known_hosts file are required." >&2
  exit 1
}
command -v rsync >/dev/null
command -v ssh >/dev/null
command -v curl >/dev/null

target="$VPS_USER@$VPS_HOST"
release_dir="$VPS_WEB_ROOT/releases/$RELEASE_SHA"
ssh_opts=(
  -p "$VPS_PORT"
  -i "$VPS_SSH_KEY_FILE"
  -o BatchMode=yes
  -o IdentitiesOnly=yes
  -o StrictHostKeyChecking=yes
  -o "UserKnownHostsFile=$VPS_KNOWN_HOSTS_FILE"
)
rsync_ssh="ssh -p $VPS_PORT -i $VPS_SSH_KEY_FILE -o BatchMode=yes -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes -o UserKnownHostsFile=$VPS_KNOWN_HOSTS_FILE"

echo "Preparing release $RELEASE_SHA"
ssh "${ssh_opts[@]}" "$target" "mkdir -p -- '$release_dir'"
rsync -a --delete -e "$rsync_ssh" dist/ "$target:$release_dir/"

ssh "${ssh_opts[@]}" "$target" "VPS_WEB_ROOT='$VPS_WEB_ROOT' RELEASE_ID='$RELEASE_SHA' bash -s" <<'REMOTE'
set -euo pipefail
root="$VPS_WEB_ROOT"
release="$root/releases/$RELEASE_ID"
test -s "$release/index.html"

if [ -e "$root/current" ] && [ ! -L "$root/current" ]; then
  echo "Refusing to replace a non-symlink current path." >&2
  exit 1
fi
if [ -L "$root/current" ]; then
  old_target="$(readlink "$root/current")"
  ln -sfn "$old_target" "$root/previous"
fi

ln -sfn "releases/$RELEASE_ID" "$root/.current-$RELEASE_ID"
mv -Tf "$root/.current-$RELEASE_ID" "$root/current"
REMOTE

health_ok=false
for attempt in 1 2 3 4 5 6; do
  if curl -fsS --max-time 8 "${VPS_URL%/}/health" | grep -q '"app":"math-explorer"'; then
    health_ok=true
    break
  fi
  sleep 2
done

if [[ "$health_ok" != true ]]; then
  echo "Health check failed; attempting to restore the previous release." >&2
  ssh "${ssh_opts[@]}" "$target" "VPS_WEB_ROOT='$VPS_WEB_ROOT' bash -s" <<'REMOTE'
set -euo pipefail
root="$VPS_WEB_ROOT"
if [ -L "$root/previous" ]; then
  previous_target="$(readlink "$root/previous")"
  ln -sfn "$previous_target" "$root/.rollback"
  mv -Tf "$root/.rollback" "$root/current"
fi
REMOTE
  exit 1
fi

ssh "${ssh_opts[@]}" "$target" "VPS_WEB_ROOT='$VPS_WEB_ROOT' bash -s" <<'REMOTE'
set -euo pipefail
root="$VPS_WEB_ROOT"
current_target="$(readlink "$root/current" || true)"
previous_target="$(readlink "$root/previous" || true)"
mapfile -t releases < <(find "$root/releases" -mindepth 1 -maxdepth 1 -type d -printf '%T@ %p\n' | sort -rn | cut -d' ' -f2-)
for index in "${!releases[@]}"; do
  if (( index >= 5 )); then
    path="${releases[$index]}"
    relative="releases/${path##*/}"
    if [[ "$relative" != "$current_target" && "$relative" != "$previous_target" ]]; then
      rm -rf -- "$path"
    fi
  fi
done
REMOTE

echo "Deployed $RELEASE_SHA to $VPS_URL"
