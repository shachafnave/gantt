#!/usr/bin/env bash
# Install the gantt skill for Claude Code, Codex and Cursor.
#
#   ./install.sh                 install for every supported agent (user-wide)
#   ./install.sh claude          only Claude Code   -> ~/.claude/skills/gantt
#   ./install.sh codex           only Codex         -> ~/.codex/skills/gantt
#   ./install.sh cursor          only Cursor        -> ~/.cursor/skills/gantt
#                                (Cursor also reads the Claude and Codex folders)
#   ./install.sh --project ...   install into the current project instead
#                                (.claude/skills, .agents/skills, .cursor/skills)
#   ./install.sh --copy ...      copy the files instead of symlinking
#   ./install.sh --uninstall ... remove the installed links or copies
set -eu
here=$(cd "$(dirname "$0")" && pwd)
src="$here/skill/gantt"
mode=link scope=user action=install agents=""
for a in "$@"; do
  case "$a" in
    --project) scope=project ;;
    --copy) mode=copy ;;
    --uninstall) action=uninstall ;;
    claude|codex|cursor) agents="$agents $a" ;;
    -h|--help) sed -n '2,13p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "unknown option: $a (try --help)" >&2; exit 1 ;;
  esac
done
[ -n "$agents" ] || agents="claude codex cursor"

dir_for() { # agent -> skills folder
  if [ "$scope" = project ]; then
    case "$1" in claude) echo "$PWD/.claude/skills" ;; codex) echo "$PWD/.agents/skills" ;; cursor) echo "$PWD/.cursor/skills" ;; esac
  else
    case "$1" in claude) echo "$HOME/.claude/skills" ;; codex) echo "$HOME/.codex/skills" ;; cursor) echo "$HOME/.cursor/skills" ;; esac
  fi
}
label() { case "$1" in claude) echo "Claude Code" ;; codex) echo "Codex" ;; cursor) echo "Cursor" ;; esac; }

if [ "$action" = install ]; then
  command -v node >/dev/null || { echo "Node 18+ is required (the skill's scripts run on node)." >&2; exit 1; }
fi
status=0
case " $agents " in *" claude "*|*" codex "*) covered=1 ;; *) covered=0 ;; esac
for agent in $agents; do
  dest="$(dir_for "$agent")/gantt"
  if [ "$agent" = cursor ] && [ "$covered" = 1 ] && [ "$action" = install ]; then
    echo "ok       Cursor: reads the Claude Code and Codex skill folders, no separate copy needed"; continue
  fi
  if [ "$action" = uninstall ]; then
    if [ -L "$dest" ]; then rm "$dest"; echo "removed  $(label "$agent"): $dest"
    elif [ -d "$dest" ] && [ -f "$dest/SKILL.md" ] && grep -q '^name: gantt$' "$dest/SKILL.md"; then rm -rf "$dest"; echo "removed  $(label "$agent"): $dest"
    else echo "skipped  $(label "$agent"): nothing installed at $dest"; fi
    continue
  fi
  if [ -e "$dest" ] || [ -L "$dest" ]; then
    if [ "$(cd "$dest" 2>/dev/null && pwd -P)" = "$(cd "$src" && pwd -P)" ]; then echo "ok       $(label "$agent"): already linked at $dest"; continue; fi
    echo "skipped  $(label "$agent"): $dest already exists (run with --uninstall first)" >&2; status=1; continue
  fi
  mkdir -p "$(dirname "$dest")"
  if [ "$mode" = copy ]; then cp -R "$src" "$dest"; else ln -s "$src" "$dest"; fi
  echo "installed $(label "$agent"): $dest ($mode)"
done
if [ "$action" = install ]; then
  echo
  echo "Start a new session, then:"
  echo "  Claude Code  /gantt"
  echo "  Codex        \$gantt  (or pick it from /skills)"
  echo "  Cursor       /gantt in Agent chat"
  echo "Or just ask for a Gantt chart; the agent picks the skill up from its description."
fi
exit $status
