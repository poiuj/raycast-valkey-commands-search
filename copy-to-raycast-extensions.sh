#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${RAYCAST_EXTENSION_HOME:-}" ]]; then
  echo "Error: RAYCAST_EXTENSION_HOME environment variable is not set." >&2
  exit 1
fi

if [[ ! -d "$RAYCAST_EXTENSION_HOME" ]]; then
  echo "Error: Destination directory $RAYCAST_EXTENSION_HOME does not exist." >&2
  exit 1
fi

EXCLUDES=(
  "--exclude-from=<(git ls-files --ignored --directory --exclude-standard -o)"
  "--exclude=$(basename $0)"
  "--exclude=.git"
)

DEST="$RAYCAST_EXTENSION_HOME/valkey-commands-search"
mkdir -p "$DEST"

RSYNC_CMD=(
  rsync
  "${EXCLUDES[@]}"
  --progress
  -av
  ./
  "$DEST/"
)

echo "Running: ${RSYNC_CMD[*]}"

eval "${RSYNC_CMD[@]}"
