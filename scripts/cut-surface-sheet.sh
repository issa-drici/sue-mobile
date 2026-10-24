#!/bin/bash
# Découpe une planche de 2 terrains empilés (séparés par une fine bande blanche) en 2 WebP 1000px de large
# dans assets/images/surfaces/. Usage :
#   scripts/cut-surface-sheet.sh planche.webp parquet-basket parquet-multisport
set -euo pipefail
SHEET="$1"; TOP="$2"; BOTTOM="$3"
OUT="$(cd "$(dirname "$0")/.." && pwd)/assets/images/surfaces"
mkdir -p "$OUT"
TMP="$(mktemp -d)"
magick "$SHEET" -alpha off "$TMP/sheet.png"
W=$(magick identify -format "%w" "$TMP/sheet.png"); H=$(magick identify -format "%h" "$TMP/sheet.png")
# Luminosité moyenne de chaque ligne autour du milieu : la bande blanche est la suite de lignes la plus claire
FROM=$((H * 40 / 100)); TO=$((H * 60 / 100))
GAP=$(magick "$TMP/sheet.png" -crop ${W}x$((TO - FROM))+0+$FROM +repage -colorspace gray -resize 1x$((TO - FROM))! txt:- \
  | awk -F'[(,)]' -v from=$FROM 'NR>1 { y=$0; sub(/^0,/, "", y); sub(/:.*/, "", y); v=$3+0; if (v > 0.93*65535 || v > 0.93*255 && v < 256) rows[y+from]=1 }
    END { min=-1; max=-1; for (r in rows) { r+=0; if (min<0||r<min) min=r; if (r>max) max=r } print min, max }')
read GMIN GMAX <<< "$GAP"
[ "$GMIN" -ge 0 ] || { echo "Bande blanche introuvable"; exit 1; }
M=6 # marge pour ne pas garder de liseré blanc
magick "$TMP/sheet.png" -crop ${W}x$((GMIN - M))+0+0 +repage -resize 1000x -quality 82 "$OUT/$TOP.webp"
magick "$TMP/sheet.png" -crop ${W}x$((H - GMAX - 1 - M))+0+$((GMAX + 1 + M)) +repage -resize 1000x -quality 82 "$OUT/$BOTTOM.webp"
echo "bande blanche: lignes $GMIN-$GMAX"
magick identify "$OUT/$TOP.webp" "$OUT/$BOTTOM.webp"
rm -rf "$TMP"
