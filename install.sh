#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ $# -eq 0 ]; then
  echo "Usage: ./install.sh /path/to/your-project"
  echo ""
  echo "Installs LLM-wiki skills into a Claude Code project."
  exit 1
fi

TARGET="$1"

if [ ! -d "$TARGET" ]; then
  echo "Error: directory '$TARGET' does not exist."
  exit 1
fi

# Copy skills (each skill is a directory with SKILL.md inside)
for skill_dir in "$SCRIPT_DIR/.claude/skills"/*/; do
  skill_name="$(basename "$skill_dir")"
  mkdir -p "$TARGET/.claude/skills/$skill_name"
  cp "$skill_dir/SKILL.md" "$TARGET/.claude/skills/$skill_name/SKILL.md"
  echo "  Installed /$(echo "$skill_name" | tr '-' '-')"
done
echo "Installed skills to $TARGET/.claude/skills/"

# Copy check script
mkdir -p "$TARGET/scripts"
cp "$SCRIPT_DIR/scripts/wiki-check.ts" "$TARGET/scripts/"
echo "Installed wiki-check.ts to $TARGET/scripts/"

echo ""
echo "Done. Next steps:"
echo "  1. Restart Claude Code if it's already running (/exit then relaunch)"
echo "     Skills are detected at session startup — they won't appear mid-session."
echo "  2. Open a Claude Code session in: $TARGET"
echo "  3. Run: /wiki-init"
