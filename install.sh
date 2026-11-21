#!/usr/bin/env bash
# Install the gantt skill for Claude Code.
#   ./install.sh            link into ~/.claude/skills/gantt (all your projects)
#   ./install.sh --project  link into ./.claude/skills/gantt (this directory only)
#   ./install.sh --copy     copy instead of symlink (add to either form)
set -eu
here=$(cd "$(dirname "$0")" && pwd)
src="$here/skill/gantt"
dest_root="$HOME/.claude/skills"
mode=link
for a in "$@"; do
  case "$a" in
    --project) dest_root="$PWD/.claude/skills" ;;
    --copy) mode=copy ;;
    *) echo "unknown option $a" >&2; exit 1 ;;
  esac
done
command -v node >/dev/null || { echo "Node 18+ is required (the skill's scripts run on node)." >&2; exit 1; }
mkdir -p "$dest_root"
dest="$dest_root/gantt"
if [ -e "$dest" ] || [ -L "$dest" ]; then
  echo "$dest already exists; remove it first to reinstall." >&2; exit 1
fi
if [ "$mode" = copy ]; then cp -R "$src" "$dest"; else ln -s "$src" "$dest"; fi
echo "Installed: $dest -> $src ($mode)"
echo "Start Claude Code and ask for a Gantt, or type /gantt."
