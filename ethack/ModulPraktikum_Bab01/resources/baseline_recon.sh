#!/usr/bin/env bash
# baseline_recon.sh - Bab 1: Baseline scan terhadap target Juice Shop
#
# Cara pakai:
#   chmod +x baseline_recon.sh
#   ./baseline_recon.sh <IP-atau-hostname-target> [port]
#
# Contoh:
#   ./baseline_recon.sh 192.168.1.10 3000
#
# Hasil scan otomatis disimpan ke folder Lab-Notes untuk didokumentasikan.

set -euo pipefail

TARGET="${1:?Pemakaian: ./baseline_recon.sh <IP-atau-hostname-target> [port]}"
PORT="${2:-3000}"
OUTDIR="$HOME/Lab-Notes/Bab-01-Baseline-Recon"
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
OUTFILE="${OUTDIR}/01-nmap-scan-${TIMESTAMP}.txt"

mkdir -p "$OUTDIR"

echo "[*] Menjalankan baseline scan terhadap ${TARGET}:${PORT} ..."
echo "[*] Hasil akan disimpan ke: ${OUTFILE}"
echo ""

nmap -sV -p "${PORT}" "${TARGET}" | tee "${OUTFILE}"

echo ""
echo "[*] Selesai. Jangan lupa pindahkan ringkasan temuan ke 01-recon-notes.md"
echo "    dan lampirkan file scan ini sebagai bukti di laporan (03-laporan-final.md)."
