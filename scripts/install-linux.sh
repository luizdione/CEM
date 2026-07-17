#!/usr/bin/env bash
# CEM — Linux command-line installer.
# Downloads the latest AppImage from GitHub Releases, installs it to
# ~/.local/bin and registers a desktop entry. No root required.
#
#   curl -fsSL https://raw.githubusercontent.com/luizdione/CEM_software/main/scripts/install-linux.sh | bash
set -euo pipefail

REPO="luizdione/CEM_software"
BIN_DIR="${HOME}/.local/bin"
APP_DIR="${HOME}/.local/share/applications"
ICON_DIR="${HOME}/.local/share/icons"
TARGET="${BIN_DIR}/cem-desktop.AppImage"

echo "CEM Linux installer — fetching the latest release of ${REPO}…"

API="https://api.github.com/repos/${REPO}/releases/latest"
URL=$(curl -fsSL "$API" | grep -o '"browser_download_url": *"[^"]*\.AppImage"' | head -1 | cut -d'"' -f4)

if [ -z "${URL}" ]; then
  echo "No AppImage found in the latest release." >&2
  echo "Build from source instead:" >&2
  echo "  git clone https://github.com/${REPO}.git && cd CEM" >&2
  echo "  pnpm install && pnpm --filter @cem/desktop package:linux" >&2
  exit 1
fi

mkdir -p "$BIN_DIR" "$APP_DIR" "$ICON_DIR"
echo "Downloading $(basename "$URL")…"
curl -fL --progress-bar "$URL" -o "$TARGET"
chmod +x "$TARGET"

ICON_URL="https://raw.githubusercontent.com/${REPO}/main/apps/desktop/build/icon.png"
curl -fsSL "$ICON_URL" -o "${ICON_DIR}/cem.png" || true

cat > "${APP_DIR}/cem.desktop" <<DESKTOP
[Desktop Entry]
Name=Claude Environment Manager
Comment=Backup, restore and migrate Claude Code environments
Exec=${TARGET} %f
Icon=${ICON_DIR}/cem.png
Terminal=false
Type=Application
Categories=Utility;Development;
MimeType=application/x-cem;
DESKTOP

echo ""
echo "✓ Installed to ${TARGET}"
echo "✓ Desktop entry registered (application menu → Claude Environment Manager)"
case ":$PATH:" in
  *":${BIN_DIR}:"*) ;;
  *) echo "! Add ${BIN_DIR} to your PATH to launch it from the terminal." ;;
esac
echo "Run it now with: ${TARGET}"
