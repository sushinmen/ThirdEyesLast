#!/usr/bin/env bash
# ---------------------------------------------------------------------
# Download GSAP locally so the site runs fully OFFLINE (e.g. on a
# presentation laptop with no Wi-Fi). Run this once on a machine that
# DOES have internet, then commit the vendor/ files.
#
#   bash vendor/fetch-libs.sh
#
# index.html tries vendor/gsap.min.js first and automatically falls back
# to the CDN if it is missing — so this step is optional but recommended.
# ---------------------------------------------------------------------
set -e
cd "$(dirname "$0")"

GSAP_URL="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"

echo "→ Downloading GSAP …"
curl -fSL "$GSAP_URL" -o gsap.min.js

bytes=$(wc -c < gsap.min.js)
if [ "$bytes" -lt 10000 ]; then
  echo "✗ Download looks too small ($bytes bytes). Check your connection."
  exit 1
fi
echo "✓ gsap.min.js  ($bytes bytes)"
echo "Done. The site will now use the local copy and works offline."
