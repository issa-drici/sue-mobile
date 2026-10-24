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
CW=$((W / 3)); CH=$((H / 2)); M=24; i=0
for name in "$@"; do
  col=$((i % 3)); row=$((i / 3))
  # Case élargie d'une marge : un objet qui dépasse un peu de sa case n'est pas coupé
  X=$((col * CW - M)); Y=$((row * CH - M)); [ $X -lt 0 ] && X=0; [ $Y -lt 0 ] && Y=0
  magick "$TMP/sheet.png" -crop $((CW + 2 * M))x$((CH + 2 * M))+$X+$Y +repage "$TMP/cell.png"
  # Masque sans les pixels presque transparents ni les petits morceaux d'objets voisins
  magick "$TMP/cell.png" -alpha extract -threshold 12% -type bilevel \
    -define connected-components:area-threshold=$((CW * CH / 60)) \
    -define connected-components:mean-color=true -connected-components 8 "$TMP/mask.png"
  BB=$(magick "$TMP/mask.png" -format "%@" info:)
  # Le masque ne fait que retirer les morceaux voisins : la transparence d'origine (bords, ombre) est conservée
  magick "$TMP/cell.png" \( "$TMP/mask.png" -morphology Dilate Disk:10 -blur 0x3 -alpha copy \) \
    -compose DstIn -composite "$TMP/clean.png"
  magick "$TMP/clean.png" -crop "$BB" +repage -background none -gravity center \
    -extent "%[fx:max(w,h)*1.1]x%[fx:max(w,h)*1.1]" -resize 240x240 -strip "$OUT/$name.png"
  echo "$name.png"
  i=$((i + 1))
done
rm -rf "$TMP"
