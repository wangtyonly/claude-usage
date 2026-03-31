const express = require('express');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CLAUDE_DIR = path.join(process.env.HOME, '.claude');
const STATS_FILE = path.join(CLAUDE_DIR, 'stats-cache.json');
const SESSIONS_DIR = path.join(CLAUDE_DIR, 'sessions');
const PROJECTS_DIR = path.join(CLAUDE_DIR, 'projects');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function decodeDirName(dirName) {
  return dirName.replace(/^-/, '/').replace(/-/g, '/');
}

function aggregateTokensFromJsonl(filePath) {
  let inputTokens = 0, outputTokens = 0, cacheRead = 0, cacheCreation = 0;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const line of content.split('\n')) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        const usage = msg.usage || msg.message?.usage;
        if (usage) {
          inputTokens += usage.input_tokens || 0;
          outputTokens += usage.output_tokens || 0;
          cacheRead += usage.cache_read_input_tokens || 0;
          cacheCreation += usage.cache_creation_input_tokens || 0;
        }
      } catch { /* skip malformed lines */ }
    }
  } catch { /* file read error */ }
  return { inputTokens, outputTokens, cacheRead, cacheCreation };
}

// GET /api/stats — full stats-cache.json
app.get('/api/stats', (req, res) => {
  const stats = readJSON(STATS_FILE);
  if (!stats) {
    return res.status(500).json({ error: 'Cannot read stats-cache.json' });
  }
  res.json(stats);
});

// GET /api/sessions — session metadata list
app.get('/api/sessions', (req, res) => {
  try {
    const files = fs.readdirSync(SESSIONS_DIR).filter(f => f.endsWith('.json'));
    const sessions = files.map(f => readJSON(path.join(SESSIONS_DIR, f))).filter(Boolean);
    res.json(sessions);
  } catch {
    res.json([]);
  }
});

// GET /api/projects — per-project aggregated stats
app.get('/api/projects', (req, res) => {
  try {
    const projectDirs = fs.readdirSync(PROJECTS_DIR).filter(d => {
      const fullPath = path.join(PROJECTS_DIR, d);
      return fs.statSync(fullPath).isDirectory();
    });

    const projects = projectDirs.map(dirName => {
      const projectPath = path.join(PROJECTS_DIR, dirName);
      const decodedPath = decodeDirName(dirName);

      let sessionCount = 0;
      let subagentCount = 0;
      let totalMessages = 0;
      let totalInputTokens = 0, totalOutputTokens = 0;
      let totalCacheRead = 0, totalCacheCreation = 0;

      try {
        const entries = fs.readdirSync(projectPath);

        for (const entry of entries) {
          const entryPath = path.join(projectPath, entry);
          if (entry === 'sessions-index.json') continue;

          // Count .jsonl session files and aggregate tokens
          if (entry.endsWith('.jsonl')) {
            sessionCount++;
            const tokens = aggregateTokensFromJsonl(entryPath);
            totalInputTokens += tokens.inputTokens;
            totalOutputTokens += tokens.outputTokens;
            totalCacheRead += tokens.cacheRead;
            totalCacheCreation += tokens.cacheCreation;
          }

          // Count subagents in session directories
          if (fs.statSync(entryPath).isDirectory()) {
            const subagentsDir = path.join(entryPath, 'subagents');
            if (fs.existsSync(subagentsDir)) {
              const subFiles = fs.readdirSync(subagentsDir).filter(f => f.endsWith('.jsonl'));
              subagentCount += subFiles.length;
              for (const sf of subFiles) {
                const tokens = aggregateTokensFromJsonl(path.join(subagentsDir, sf));
                totalInputTokens += tokens.inputTokens;
                totalOutputTokens += tokens.outputTokens;
                totalCacheRead += tokens.cacheRead;
                totalCacheCreation += tokens.cacheCreation;
              }
            }
          }
        }
      } catch { /* ignore */ }

      // Enrich message count from sessions-index if available
      const sessionsIndex = readJSON(path.join(projectPath, 'sessions-index.json'));
      if (sessionsIndex && Array.isArray(sessionsIndex.entries)) {
        for (const s of sessionsIndex.entries) {
          totalMessages += s.messageCount || 0;
        }
      }

      return {
        project: decodedPath,
        dirName,
        sessionCount,
        subagentCount,
        totalMessages,
        totalTokens: totalInputTokens + totalOutputTokens + totalCacheRead + totalCacheCreation,
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        cacheRead: totalCacheRead,
        cacheCreation: totalCacheCreation
      };
    });

    // Sort by sessionCount descending
    projects.sort((a, b) => b.sessionCount - a.sessionCount);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
function startServer(port) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, () => {
      resolve(server);
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(null); // port in use, try next
      } else {
        reject(err);
      }
    });
  });
}

async function main() {
  const preferredPort = parseInt(process.env.PORT || '3456', 10);
  let server = null;
  let port = preferredPort;

  for (let i = 0; i < 10; i++) {
    server = await startServer(port);
    if (server) break;
    port++;
  }

  if (!server) {
    console.error('Could not find available port');
    process.exit(1);
  }

  const url = `http://localhost:${port}`;
  console.log(`Claude Usage Dashboard running at ${url}`);

  // Open browser
  try {
    const cmd = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';
    execSync(`${cmd} ${url}`);
  } catch { /* browser open is best-effort */ }

  // Auto-close after 30 min idle
  let idleTimer = setTimeout(() => {
    console.log('Idle timeout, shutting down.');
    process.exit(0);
  }, 30 * 60 * 1000);

  app.use((req, res, next) => {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      console.log('Idle timeout, shutting down.');
      process.exit(0);
    }, 30 * 60 * 1000);
    next();
  });
}

if (require.main === module) {
  main();
}

module.exports = app;
