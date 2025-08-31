#!/bin/bash

# Project Awareness Session End Hook
# Triggered when Claude Code session ends

# Set environment
export PROJECT_AWARENESS_HOME="/Users/nb/.claude/extensions/project-awareness"
export CLAUDE_SESSION_END="true"
export CLAUDE_SESSION_ID="${CLAUDE_SESSION_ID:-$(date +%s)}"

# Log session end
echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"): Session end hook triggered for session ${CLAUDE_SESSION_ID}" >> ~/.claude/logs/project-awareness.log

# Run session end consolidation
if [ -f "$PROJECT_AWARENESS_HOME/index.js" ]; then
    cd "$PROJECT_AWARENESS_HOME"
    
    # Call session end method
    node -e "
        const ProjectAwarenessExtension = require('./index.js');
        const extension = new ProjectAwarenessExtension();
        extension.onSessionEnd()
            .then(() => console.log('Session consolidation complete'))
            .catch(err => console.error('Session consolidation error:', err));
    " 2>&1 | tee -a ~/.claude/logs/project-awareness.log
else
    echo "$(date -u +"%Y-%m-%dT%H:%M:%SZ"): Project awareness extension not found" >> ~/.claude/logs/project-awareness.log
fi