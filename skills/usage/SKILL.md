---
name: usage
description: Launch Claude Code token usage dashboard in browser
allowed-tools: [Bash]
---

# Usage Dashboard

Launch the Claude Code usage dashboard to view token usage statistics by model, day, hour, and project.

Find the installed plugin path and start the server:

```bash
PLUGIN_DIR=$(find ~/.claude/plugins/cache -path "*/claude-usage/*/server.js" -print -quit 2>/dev/null | xargs dirname)
if [ -z "$PLUGIN_DIR" ]; then
  echo "claude-usage plugin not found. Install it with: claude plugin install claude-usage@wangtyonly"
  exit 1
fi
cd "$PLUGIN_DIR" && npm install --silent 2>/dev/null && node server.js
```
