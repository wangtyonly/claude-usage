---
name: usage
description: Launch Claude Code token usage dashboard in browser
allowed-tools: [Bash]
---

# Usage Dashboard

Launch the Claude Code usage dashboard to view token usage statistics by model, day, hour, and project.

Run the following command to start the dashboard server and open it in the browser:

```bash
cd ~/.claude/plugins/claude-usage && npm start
```

If the plugin is not installed at that location, try:

```bash
node $ARGUMENTS/server.js
```
