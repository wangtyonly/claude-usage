# Claude Code Usage Dashboard

A local web dashboard for visualizing your Claude Code token usage, with breakdowns by model, day, hour, and project.

![Dashboard Preview](https://img.shields.io/badge/Claude_Code-Plugin-blue)

## Features

- **Overview Cards** — Total sessions, messages, tokens, tool calls
- **Daily Token Trend** — Stacked bar chart by model, with date range filter
- **Model Usage Proportion** — Doughnut chart showing token distribution across models
- **Hourly Activity** — Bar chart showing your most active hours
- **Project Statistics** — Per-project session and subagent counts
- **Sortable Tables** — Daily activity, token detail by model, and project detail

## Installation

### As a Claude Code Plugin

```bash
/plugin install github:wangtyonly/claude-usage
```

### Standalone

```bash
git clone https://github.com/wangtyonly/claude-usage.git
cd claude-usage
npm install
npm start
```

## Usage

### From Claude Code

Use the `/usage` slash command to launch the dashboard.

### Standalone

```bash
npm start
# or
node server.js
```

The dashboard will start on port 3456 (auto-finds next available port if occupied) and open in your browser.

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Single HTML file + Chart.js (CDN)
- **Data Source**: `~/.claude/stats-cache.json`, `~/.claude/sessions/`, `~/.claude/projects/`

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/stats` | Full stats-cache.json data |
| `GET /api/projects` | Per-project aggregated statistics |
| `GET /api/sessions` | Session list with metadata |

## License

MIT
