# Claude Code Usage Dashboard

A local web dashboard for visualizing your Claude Code token usage, with breakdowns by model, day, hour, and project.

![Dashboard Preview](https://img.shields.io/badge/Claude_Code-Plugin-blue)

## Features

- **Overview Cards** — Total sessions, messages, tokens, tool calls (supports date range filter)
- **Daily Token Trend** — Stacked bar chart by model, with date range filter (7d / 30d / 90d / all)
- **Model Usage Proportion** — Doughnut chart showing token distribution across models
- **Hourly Activity** — Bar chart showing your most active hours of the day
- **Project Statistics** — Horizontal bar chart of top projects by session count
- **Sortable Tables** — Daily activity, token detail by model, and per-project detail (all columns sortable)

## Installation

### As a Claude Code Plugin (Recommended)

```bash
# 1. Add the marketplace (one-time setup)
claude plugin marketplace add wangtyonly/claude-marketplace

# 2. Install the plugin
claude plugin install claude-usage@wangtyonly
```

After installation, restart Claude Code and use the `/usage` slash command to launch the dashboard.

### Standalone

```bash
git clone https://github.com/wangtyonly/claude-usage.git
cd claude-usage
npm install
npm start
```

## Usage

### From Claude Code

Use the `/claude-usage:usage` slash command to launch the dashboard in your browser.

### Standalone

```bash
npm start
# or
node server.js
```

The dashboard will start on port 3456 (auto-finds next available port if occupied) and open in your browser automatically. The server auto-closes after 30 minutes of idle.

## Data Sources

All data is read **locally and read-only** from `~/.claude/` — nothing is sent to any external service.

### `~/.claude/stats-cache.json`

Claude Code's built-in statistics cache. Provides:

| Field | Description |
|-------|-------------|
| `dailyActivity[]` | Per-day aggregation: `messageCount`, `sessionCount`, `toolCallCount` |
| `dailyModelTokens[]` | Per-day token output grouped by model name (e.g. `claude-opus-4-6`, `claude-sonnet-4-6`) |
| `modelUsage{}` | All-time cumulative token usage per model: `inputTokens`, `outputTokens`, `cacheReadInputTokens`, `cacheCreationInputTokens` |
| `hourCounts{}` | Number of sessions started in each hour (0-23), used for hourly activity chart |
| `totalSessions` | Total number of sessions ever created |
| `totalMessages` | Total number of messages ever sent |
| `firstSessionDate` | Timestamp of the first session |

### `~/.claude/projects/<encoded-path>/`

Each project directory is named by encoding the absolute project path (e.g. `/Users/ty/projects/foo` becomes `-Users-ty-projects-foo`). Inside each project directory:

- **`<session-id>.jsonl`** — Session conversation logs in JSON Lines format. Each line is a message object. We parse these to extract:
  - **Messages**: Lines with `message.role === "user"` or `message.role === "assistant"` are counted
  - **Token usage**: Extracted from `message.usage` on assistant messages, which contains `input_tokens`, `output_tokens`, `cache_read_input_tokens`, `cache_creation_input_tokens`
- **`<session-id>/subagents/`** — Subagent conversation logs (same `.jsonl` format), also parsed for tokens and messages

### `~/.claude/sessions/`

Session metadata files (`<pid>.json`), each containing:
- `sessionId`, `cwd` (project working directory), `startedAt`, `kind` (interactive/headless), `entrypoint`

## API Endpoints

| Endpoint | Description | Source |
|----------|-------------|--------|
| `GET /api/stats` | Full stats-cache.json data | `stats-cache.json` |
| `GET /api/projects` | Per-project aggregated stats (sessions, messages, tokens breakdown) | `projects/**/*.jsonl` |
| `GET /api/sessions` | Active session list with metadata | `sessions/*.json` |

### `GET /api/projects` Response Example

```json
[
  {
    "project": "/Users/ty/projects/my-app",
    "dirName": "-Users-ty-projects-my-app",
    "sessionCount": 18,
    "subagentCount": 22,
    "totalMessages": 3364,
    "totalTokens": 166990502,
    "inputTokens": 10062,
    "outputTokens": 422634,
    "cacheRead": 150897408,
    "cacheCreation": 15660398
  }
]
```

## Tech Stack

- **Backend**: Node.js + Express (sole dependency)
- **Frontend**: Single HTML file + [Chart.js](https://www.chartjs.org/) via CDN
- **No build step** — works out of the box with `npm install && npm start`

## License

MIT
