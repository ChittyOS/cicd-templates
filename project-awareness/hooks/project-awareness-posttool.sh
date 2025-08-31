#!/bin/bash

# Project Awareness Post-Tool Hook
# Analyzes tool results and learns patterns for better project detection

# Get tool information
TOOL_NAME="${CLAUDE_TOOL_NAME:-unknown}"
AGENT_NAME="${CLAUDE_AGENT_NAME:-unknown}"
SESSION_ID="${CLAUDE_SESSION_ID:-$(date +%s)}"

# Skip if project prompts are disabled
if [ -f ~/.claude/skip-project-prompts ]; then
    exit 0
fi

# Read tool result from stdin (if available)
TOOL_RESULT=""
if [ ! -t 0 ]; then
    TOOL_RESULT=$(cat)
fi

# Set up environment
export PROJECT_AWARENESS_HOME="/Users/nb/.claude/extensions/project-awareness"
export CLAUDE_TOOL_NAME="$TOOL_NAME"
export CLAUDE_SESSION_ID="$SESSION_ID"

# Log post-tool analysis
echo "$(date): Post-tool analysis - Tool: $TOOL_NAME, Agent: $AGENT_NAME" >> ~/.claude/logs/project-awareness.log

# Skip analysis for certain tools
case "$TOOL_NAME" in
    "Task"|"TodoWrite")
        exit 0
        ;;
esac

# Run post-tool analysis
node -e "
const fs = require('fs');
const path = require('path');

async function postToolAnalysis() {
    try {
        const currentDir = process.cwd();
        const currentProject = fs.existsSync(process.env.HOME + '/.claude/current-project') 
            ? fs.readFileSync(process.env.HOME + '/.claude/current-project', 'utf8').trim()
            : 'none';
        
        // Log activity to project tracking
        const activityLog = {
            timestamp: new Date().toISOString(),
            session_id: process.env.CLAUDE_SESSION_ID,
            tool: process.env.CLAUDE_TOOL_NAME,
            agent: process.env.CLAUDE_AGENT_NAME,
            project: currentProject,
            working_directory: currentDir,
            result_size: '$TOOL_RESULT'.length
        };
        
        // Append to activity log
        const logFile = process.env.HOME + '/.claude/logs/project-activity.jsonl';
        fs.appendFileSync(logFile, JSON.stringify(activityLog) + '\\n');
        
        // Check if tool result suggests new project opportunities
        const toolResult = \`$TOOL_RESULT\`;
        
        if (toolResult.length > 100) {
            // Analyze result for project keywords
            const projectKeywords = {
                'Arias-v-Bianchi': ['arias', 'bianchi', 'legal', 'court', 'evidence', 'motion'],
                'ChittyOS-Core': ['chittyos', 'mcp', 'server', 'canon'],
                'ChittyFinance': ['finance', 'invoice', 'payment', 'accounting', 'money'],
                'ChiCo-Properties': ['property', 'rental', 'tenant', 'lease', 'chicago'],
                'IT-CAN-BE-LLC': ['wyoming', 'llc', 'corporate', 'entity']
            };
            
            const lowerResult = toolResult.toLowerCase();
            const projectMatches = [];
            
            for (const [project, keywords] of Object.entries(projectKeywords)) {
                const matchCount = keywords.filter(keyword => lowerResult.includes(keyword)).length;
                if (matchCount > 0) {
                    projectMatches.push({
                        project: project,
                        matches: matchCount,
                        confidence: matchCount / keywords.length
                    });
                }
            }
            
            // If we found strong matches and they're different from current project
            const strongMatches = projectMatches.filter(m => m.confidence > 0.3);
            
            if (strongMatches.length > 0 && strongMatches[0].project !== currentProject) {
                const suggestion = strongMatches[0];
                
                console.log('\\n💡 RELATED PROJECT DETECTED IN RESULTS');
                console.log(\`   Current Project: \${currentProject}\`);
                console.log(\`   Related Project: \${suggestion.project} (based on tool output)\`);
                console.log(\`   Confidence: \${Math.round(suggestion.confidence * 100)}%\`);
                
                // Store suggestion for future reference
                const suggestionData = {
                    timestamp: new Date().toISOString(),
                    current_project: currentProject,
                    suggested_project: suggestion.project,
                    confidence: suggestion.confidence,
                    trigger: 'post_tool_result_analysis',
                    tool: process.env.CLAUDE_TOOL_NAME
                };
                
                const suggestionsFile = process.env.HOME + '/.claude/logs/project-suggestions.jsonl';
                fs.appendFileSync(suggestionsFile, JSON.stringify(suggestionData) + '\\n');
                
                console.log('   (Suggestion logged for future reference)');
            }
        }
        
        // Update project usage statistics
        const statsFile = process.env.HOME + '/.claude/project-stats.json';
        let stats = {};
        
        if (fs.existsSync(statsFile)) {
            try {
                stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
            } catch (e) {
                stats = {};
            }
        }
        
        if (!stats[currentProject]) {
            stats[currentProject] = {
                tool_uses: 0,
                last_used: null,
                directories: new Set(),
                agents_used: new Set()
            };
        }
        
        stats[currentProject].tool_uses++;
        stats[currentProject].last_used = new Date().toISOString();
        stats[currentProject].directories = [...new Set([...Array.from(stats[currentProject].directories || []), currentDir])];
        stats[currentProject].agents_used = [...new Set([...Array.from(stats[currentProject].agents_used || []), process.env.CLAUDE_AGENT_NAME])];
        
        // Convert sets back to arrays for JSON serialization
        Object.keys(stats).forEach(project => {
            stats[project].directories = Array.from(stats[project].directories);
            stats[project].agents_used = Array.from(stats[project].agents_used);
        });
        
        fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
        
    } catch (error) {
        console.error('Post-tool analysis error:', error.message);
    }
}

postToolAnalysis();
" 2>/dev/null

# Check if we should update project status
if [ -f ~/.claude/current-project ]; then
    CURRENT_PROJECT=$(cat ~/.claude/current-project)
    
    # Update last activity timestamp for current project
    echo "$(date): $TOOL_NAME used in $CURRENT_PROJECT" >> ~/.claude/logs/project-activity-simple.log
fi