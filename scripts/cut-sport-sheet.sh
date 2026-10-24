#!/bin/bash
# Découpe une planche d'icônes de sports (grille 3x2, fond transparent) en 6 PNG 240x240
# centrés, dans assets/images/sports/. Usage :
#   scripts/cut-sport-sheet.sh planche.webp football basketball tennis padel volleyball handball
set -euo pipefail
SHEET="$1"; shift
[ "$#" -eq 6 ] || { echo "6 noms de sports attendus (ordre de lecture de la planche)"; exit 1; }
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/images/sports"
TMP="$(mktemp -d)"
magick "$SHEET" "$TMP/sheet.png"
W=$(magick identify -format "%w" "$TMP/sheet.png"); H=$(magick identify -format "%h" "$TMP/sheet.png")
CW=$((W / 3)); CH=$((H / 2)); i=0
for name in "$@"; do
  col=$((i % 3)); row=$((i / 3))
  magick "$TMP/sheet.png" -crop ${CW}x${CH}+$((col * CW))+$((row * CH)) +repage "$TMP/cell.png"
  # Cadre calculé sans les pixels presque transparents (ombres très légères)
  BB=$(magick "$TMP/cell.png" -alpha extract -threshold 12% -format "%@" info:)
  magick "$TMP/cell.png" -crop "$BB" +repage -background none -gravity center \
    -extent "%[fx:max(w,h)*1.1]x%[fx:max(w,h)*1.1]" -resize 240x240 -strip "$OUT/$name.png"
  echo "$name.png"
  i=$((i + 1))
done
rm -rf "$TMP"
