#!/bin/bash

# Project Awareness Startup Hook
# Runs when Claude Code starts to analyze project context

HOOK_TYPE="${1:-startup}"
export CLAUDE_SESSION_ID="${CLAUDE_SESSION_ID:-$(date +%s)}"
export PROJECT_AWARENESS_HOME="/Users/nb/.claude/extensions/project-awareness"

# Ensure project awareness extension exists
if [ ! -f "$PROJECT_AWARENESS_HOME/index.js" ]; then
    echo "⚠️  Project Awareness extension not found at $PROJECT_AWARENESS_HOME"
    exit 0
fi

# Run project awareness analysis
echo "🧠 ChittyChat Project Awareness: Starting analysis..."

# Log startup for debugging
echo "$(date): Project awareness startup hook triggered" >> ~/.claude/logs/project-awareness.log

# Execute the main project awareness logic
node "$PROJECT_AWARENESS_HOME/index.js" init 2>&1 | tee -a ~/.claude/logs/project-awareness.log

# Update status line with current project if available
if [ -f ~/.claude/current-project ]; then
    CURRENT_PROJECT=$(cat ~/.claude/current-project)
    echo "📋 Current project: $CURRENT_PROJECT"
fi

echo "✅ Project awareness initialization complete"