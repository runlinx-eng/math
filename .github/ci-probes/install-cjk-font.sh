#!/usr/bin/env bash
# Use the reviewed Ubuntu 24.04 WQY package without relying on apt mirrors.
# Source checksum: https://packages.ubuntu.com/jammy/all/fonts-wqy-microhei/download
set -euo pipefail

name='fonts-wqy-microhei_0.2.0-beta-3.1_all.deb'
sha256='58d0a29af79ce1fc5c63b4276065f0fce27decf6839835f3f9c2e68d9f84ca20'
size=1606960
cache="${HOME}/.cache/math-tree/${name}"
mkdir -p "$(dirname "$cache")"
started=$SECONDS

valid_package() {
  local file=$1
  [[ -f "$file" ]] &&
    [[ "$(stat -c '%s' "$file")" == "$size" ]] &&
    printf '%s  %s\n' "$sha256" "$file" | sha256sum --check --status
}

if valid_package "$cache"; then
  echo "CJK_PACKAGE_SOURCE=verified-cache"
else
  if [[ -e "$cache" ]]; then
    echo "CJK_PACKAGE_CACHE_INVALID: removing rejected bytes" >&2
    rm -f "$cache"
  fi
  partial=$(mktemp "$(dirname "$cache")/download.XXXXXXXX")
  trap 'rm -f "$partial"' EXIT

  # Independently hosted mirrors of the exact reviewed Ubuntu .deb.
  # The pinned SHA-256 (not TLS/mirror selection) determines acceptance.
  mirrors=(
    "https://mirrors.kernel.org/ubuntu/pool/universe/f/fonts-wqy-microhei/$name"
    "https://ftp.osuosl.org/pub/ubuntu/pool/universe/f/fonts-wqy-microhei/$name"
    "https://archive.ubuntu.com/ubuntu/pool/universe/f/fonts-wqy-microhei/$name"
  )
  downloaded=false
  for url in "${mirrors[@]}"; do
    rm -f "$partial"
    echo "CJK_PACKAGE_ATTEMPT ${url%%/pool/*}"
    if curl --fail --silent --show-error --location \
         --connect-timeout 10 --max-time 35 --retry 1 --retry-delay 1 \
         --output "$partial" "$url" && valid_package "$partial"; then
      mv "$partial" "$cache"
      downloaded=true
      echo "CJK_PACKAGE_SOURCE=verified-download"
      break
    fi
    echo 'CJK_PACKAGE_REJECTED: download failed or official size/SHA-256 mismatch' >&2
  done
  if [[ "$downloaded" != true ]]; then
    echo 'CJK_FONT_UNAVAILABLE: all trusted Ubuntu mirrors failed checksum/download' >&2
    exit 1
  fi
  trap - EXIT
fi

# Fail closed even on a poisoned cache. Extract only the required font file;
# avoid apt-get update, dpkg dependency resolution, and privileged writes.
valid_package "$cache" || { echo 'CJK_PACKAGE_SHA256_FAILED' >&2; exit 1; }
staging=$(mktemp -d)
trap 'rm -rf "$staging"' EXIT
dpkg-deb --extract "$cache" "$staging"
font="$staging/usr/share/fonts/truetype/wqy/wqy-microhei.ttc"
[[ -s "$font" ]] || { echo 'CJK_FONT_MISSING_IN_PACKAGE' >&2; exit 1; }
install -Dm644 "$font" "$HOME/.local/share/fonts/wqy-microhei.ttc"
echo "CJK_FONT_INSTALLED seconds=$((SECONDS-started))"
