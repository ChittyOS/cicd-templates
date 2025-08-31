#!/bin/bash

# Project Awareness Pre-Tool Hook
# Analyzes tool context and suggests project switches before tool execution

# Read tool input from stdin
TOOL_INPUT=$(cat)

# Set environment variables
export CLAUDE_TOOL_NAME="${CLAUDE_TOOL_NAME:-unknown}"
export CLAUDE_AGENT_NAME="${CLAUDE_AGENT_NAME:-unknown}" 
export CLAUDE_SESSION_ID="${CLAUDE_SESSION_ID:-$(date +%s)}"
export PROJECT_AWARENESS_HOME="/Users/nb/.claude/extensions/project-awareness"

# Log the tool call for analysis
echo "$(date): Pre-tool analysis - Tool: $CLAUDE_TOOL_NAME, Input: $TOOL_INPUT" >> ~/.claude/logs/project-awareness.log

# Skip analysis for certain tools to avoid infinite loops
case "$CLAUDE_TOOL_NAME" in
    "Task"|"TodoWrite")
        echo "⏭️  Skipping project analysis for $CLAUDE_TOOL_NAME (redirected tool)"
        exit 0
        ;;
    "Bash")
        # Only analyze if it's not our own project awareness commands
        if echo "$TOOL_INPUT" | grep -q "project-awareness\|chittychat"; then
            exit 0
        fi
        ;;
esac

# Create temporary file for tool input analysis
TEMP_FILE=$(mktemp)
echo "$TOOL_INPUT" > "$TEMP_FILE"

# Run project context analysis
node -e "
const fs = require('fs');
const { ProjectAnalyzer } = require('$PROJECT_AWARENESS_HOME/lib/project-analyzer.js');

async function analyzeToolContext() {
    try {
        const toolInput = fs.readFileSync('$TEMP_FILE', 'utf8');
        let toolData;
        
        try {
            toolData = JSON.parse(toolInput);
        } catch (e) {
            toolData = { raw_input: toolInput };
        }
        
        const analyzer = new ProjectAnalyzer();
        const currentDir = process.cwd();
        
        // Analyze current directory
        const directoryAnalysis = await analyzer.analyzeDirectory(currentDir);
        
        // Check if tool suggests project switch
        let projectSuggestion = null;
        
        if (toolData.file_path) {
            const fileProject = await analyzer.detectProjectFromFile(toolData.file_path);
            if (fileProject && fileProject.confidence > 0.6) {
                projectSuggestion = fileProject;
            }
        }
        
        if (toolData.path) {
            const pathProject = await analyzer.analyzeDirectory(toolData.path);
            if (pathProject.primary_project && pathProject.primary_project.confidence > 0.6) {
                projectSuggestion = {
                    project: pathProject.primary_project.name,
                    confidence: pathProject.primary_project.confidence,
                    reason: 'Tool operates on directory suggesting different project'
                };
            }
        }
        
        // Check for cross-project context
        if (directoryAnalysis.cross_project_context) {
            console.log('🔀 Cross-project context detected');
            console.log('📍 Primary:', directoryAnalysis.primary_project?.name || 'Unknown');
            if (directoryAnalysis.secondary_projects.length > 0) {
                console.log('🔗 Secondary:', directoryAnalysis.secondary_projects.map(p => p.name).join(', '));
            }
        }
        
        // Suggest project switch if detected
        if (projectSuggestion) {
            const currentProject = fs.readFileSync(process.env.HOME + '/.claude/current-project', 'utf8').trim() || 'none';
            
            if (projectSuggestion.project !== currentProject) {
                console.log('\\n🔄 PROJECT SWITCH SUGGESTED');
                console.log(\`   Current: \${currentProject}\`);
                console.log(\`   Suggested: \${projectSuggestion.project} (\${Math.round(projectSuggestion.confidence * 100)}% confidence)\`);
                console.log(\`   Reason: \${projectSuggestion.reason || 'Tool context analysis'}\`);
                
                // Ask for confirmation
                const readline = require('readline');
                const rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                
                rl.question('\\nSwitch to suggested project? [y/N/s] (s=skip future prompts): ', (answer) => {
                    const response = answer.toLowerCase().trim();
                    
                    if (response === 'y' || response === 'yes') {
                        fs.writeFileSync(process.env.HOME + '/.claude/current-project', projectSuggestion.project);
                        console.log(\`✅ Switched to project: \${projectSuggestion.project}\`);
                        
                        // Log the switch
                        const logEntry = \`\${new Date().toISOString()}: Project switch - \${currentProject} → \${projectSuggestion.project} (via pre-tool hook)\\n\`;
                        fs.appendFileSync(process.env.HOME + '/.claude/logs/project-switches.log', logEntry);
                        
                    } else if (response === 's' || response === 'skip') {
                        fs.writeFileSync(process.env.HOME + '/.claude/skip-project-prompts', 'true');
                        console.log('⏭️  Project prompts disabled for this session');
                        
                    } else {
                        console.log('⏭️  Continuing with current project');
                    }
                    
                    rl.close();
                });
            }
        }
        
    } catch (error) {
        console.error('Project analysis error:', error.message);
    }
}

analyzeToolContext();
" 2>/dev/null

# Cleanup
rm -f "$TEMP_FILE"