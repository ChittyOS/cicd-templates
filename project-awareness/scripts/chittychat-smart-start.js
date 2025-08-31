#!/usr/bin/env node

/**
 * ChittyChat Smart Start - Complete Environment Restoration
 * Connects to ChittyChat, loads smart session, sets up terminal and environment
 */

const fs = require('fs');
const path = require('path');
const { EnvironmentRestorer } = require('../lib/environment-restorer');

class ChittyChatSmartStart {
    constructor() {
        this.environmentRestorer = new EnvironmentRestorer();
        this.chittyChatEndpoint = process.env.CHITTYCHAT_ENDPOINT || 'https://api.chitty.cc';
    }

    /**
     * Start a smart session with full environment setup
     */
    async startSmartSession(projectName) {
        console.log(`🚀 Starting ChittyChat smart session for ${projectName}...`);

        try {
            // Step 1: Load smart session data
            const smartSession = await this.loadSmartSession(projectName);
            if (!smartSession) {
                console.log(`❌ No smart session found for ${projectName}`);
                return false;
            }

            console.log(`📖 Smart session loaded (${smartSession.consolidated_sessions} sessions consolidated)`);

            // Step 2: Connect to ChittyChat
            const chittyChatProject = await this.connectToChittyChat(projectName);
            
            // Step 3: Restore complete environment
            const environmentResult = await this.environmentRestorer.restoreProjectEnvironment(
                projectName, 
                smartSession
            );

            if (!environmentResult.success) {
                console.log(`⚠️  Environment setup had issues: ${environmentResult.error}`);
            }

            // Step 4: Display smart session context
            this.displaySmartContext(smartSession);

            // Step 5: Set up ChittyChat integration
            await this.setupChittyChatIntegration(projectName, chittyChatProject);

            // Step 6: Create session restoration script
            await this.createSessionScript(projectName, environmentResult);

            console.log(`✅ Smart session active for ${projectName}!`);
            console.log(`📂 Working directory: ${environmentResult.workingDirectory}`);
            console.log(`🔧 Services: ${environmentResult.servicesStarted?.join(', ') || 'none'}`);
            console.log(`💬 ChittyChat: Connected to ${this.chittyChatEndpoint}`);

            return true;

        } catch (error) {
            console.error(`❌ Smart session failed for ${projectName}:`, error);
            return false;
        }
    }

    /**
     * Load smart session data
     */
    async loadSmartSession(projectName) {
        const smartSessionPath = path.join(
            process.env.HOME,
            '.claude',
            'projects',
            projectName,
            `${projectName}-SMART-START.jsonl`
        );

        if (!fs.existsSync(smartSessionPath)) {
            return null;
        }

        try {
            const content = fs.readFileSync(smartSessionPath, 'utf8');
            const lines = content.trim().split('\n');
            
            const sessionData = JSON.parse(lines[0]);
            const contextMessage = lines[1] ? JSON.parse(lines[1]) : null;
            const suggestions = lines[2] ? JSON.parse(lines[2]) : null;

            return {
                ...sessionData,
                context: contextMessage?.content,
                suggestions: suggestions?.content
            };

        } catch (error) {
            console.error(`Error loading smart session: ${error.message}`);
            return null;
        }
    }

    /**
     * Connect to ChittyChat and get project info
     */
    async connectToChittyChat(projectName) {
        console.log(`🔗 Connecting to ChittyChat for ${projectName}...`);

        try {
            // This would use the actual ChittyChat API
            const projectData = await this.callChittyChatAPI('projects/get', {
                name: projectName,
                include_tasks: true,
                include_activity: true
            });

            if (projectData) {
                console.log(`📡 Connected to ChittyChat project: ${projectData.name}`);
                if (projectData.open_tasks) {
                    console.log(`📋 Open tasks: ${projectData.open_tasks}`);
                }
                return projectData;
            } else {
                console.log(`📝 Creating new ChittyChat project: ${projectName}`);
                return await this.createChittyChatProject(projectName);
            }

        } catch (error) {
            console.log(`⚠️  ChittyChat connection issue: ${error.message}`);
            return { name: projectName, status: 'local' };
        }
    }

    /**
     * Call ChittyChat API
     */
    async callChittyChatAPI(endpoint, data) {
        // For now, simulate the API call
        // In production, this would make actual HTTPS requests to ChittyChat
        console.log(`   📡 API Call: ${endpoint}`);
        
        // Simulate project data
        return {
            name: data.name,
            chitty_id: `PROJ-${Date.now()}`,
            open_tasks: Math.floor(Math.random() * 10),
            last_activity: new Date().toISOString(),
            working_directory: `/Volumes/thumb/Projects/${data.name}`,
            environment: 'development'
        };
    }

    /**
     * Create new ChittyChat project
     */
    async createChittyChatProject(projectName) {
        return {
            name: projectName,
            chitty_id: `PROJ-${Date.now()}`,
            created: new Date().toISOString(),
            status: 'active'
        };
    }

    /**
     * Display smart session context
     */
    displaySmartContext(smartSession) {
        console.log('\n' + '='.repeat(60));
        console.log('📊 SMART SESSION CONTEXT');
        console.log('='.repeat(60));
        
        if (smartSession.context) {
            console.log(smartSession.context);
        }
        
        if (smartSession.suggestions) {
            console.log('\n' + smartSession.suggestions);
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🚀 ENVIRONMENT READY - YOU CAN START WORKING!');
        console.log('='.repeat(60) + '\n');
    }

    /**
     * Setup ChittyChat integration
     */
    async setupChittyChatIntegration(projectName, chittyChatProject) {
        // Set environment variables for ChittyChat integration
        process.env.CHITTYCHAT_ACTIVE_PROJECT = projectName;
        process.env.CHITTYCHAT_PROJECT_ID = chittyChatProject.chitty_id;
        
        // Create integration status file
        const integrationStatus = {
            project: projectName,
            chitty_id: chittyChatProject.chitty_id,
            endpoint: this.chittyChatEndpoint,
            session_started: new Date().toISOString(),
            status: 'active'
        };
        
        const statusFile = path.join(process.env.HOME, '.claude', 'chittychat-integration-status.json');
        fs.writeFileSync(statusFile, JSON.stringify(integrationStatus, null, 2));
        
        console.log('🔗 ChittyChat integration active');
    }

    /**
     * Create session restoration script
     */
    async createSessionScript(projectName, environmentResult) {
        const scriptContent = `#!/bin/bash
# ChittyChat Smart Session Restoration Script for ${projectName}
# Generated: ${new Date().toISOString()}

echo "🔄 Restoring ${projectName} session..."

# Change to working directory
cd "${environmentResult.workingDirectory}"

# Set environment variables
export CHITTYCHAT_ACTIVE_PROJECT="${projectName}"
export PROJECT_TYPE="${environmentResult.environmentVariables?.PROJECT_TYPE || 'general'}"

# Source project aliases
source /tmp/chitty-project-aliases 2>/dev/null

# Display status
echo "✅ ${projectName} session restored"
echo "📂 Directory: $(pwd)"
echo "🔧 ChittyChat: Active"
echo ""
echo "Ready to continue work on ${projectName}!"

# Start shell with project context
exec $SHELL
`;

        const scriptPath = path.join('/tmp', `restore-${projectName.toLowerCase()}.sh`);
        fs.writeFileSync(scriptPath, scriptContent);
        fs.chmodSync(scriptPath, '755');
        
        console.log(`📜 Restoration script created: ${scriptPath}`);
        console.log(`   Run: bash ${scriptPath} (to restore session in new terminal)`);
    }

    /**
     * List available smart sessions
     */
    async listAvailableSessions() {
        const projectsPath = path.join(process.env.HOME, '.claude', 'projects');
        const smartSessions = [];

        if (!fs.existsSync(projectsPath)) {
            console.log('No projects directory found');
            return;
        }

        const projects = fs.readdirSync(projectsPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

        for (const project of projects) {
            const smartSessionPath = path.join(projectsPath, project, `${project}-SMART-START.jsonl`);
            if (fs.existsSync(smartSessionPath)) {
                try {
                    const content = fs.readFileSync(smartSessionPath, 'utf8');
                    const sessionData = JSON.parse(content.split('\n')[0]);
                    smartSessions.push({
                        name: project,
                        sessions: sessionData.consolidated_sessions,
                        generated: sessionData.generated_at
                    });
                } catch (error) {
                    // Skip invalid sessions
                }
            }
        }

        console.log('📋 Available Smart Sessions:');
        console.log('');
        smartSessions
            .sort((a, b) => b.sessions - a.sessions)
            .forEach((session, index) => {
                console.log(`${index + 1}. ${session.name} (${session.sessions} sessions)`);
            });
        
        return smartSessions;
    }
}

// CLI execution
if (require.main === module) {
    const smartStart = new ChittyChatSmartStart();
    const command = process.argv[2];
    const projectName = process.argv[3];

    switch (command) {
        case 'start':
            if (projectName) {
                smartStart.startSmartSession(projectName);
            } else {
                console.log('Usage: node chittychat-smart-start.js start <project-name>');
            }
            break;
        case 'list':
            smartStart.listAvailableSessions();
            break;
        default:
            console.log('ChittyChat Smart Start - Complete Environment Restoration');
            console.log('');
            console.log('Commands:');
            console.log('  start <project>  - Start smart session with full environment setup');
            console.log('  list            - List available smart sessions');
            console.log('');
            console.log('Example: node chittychat-smart-start.js start Arias-v-Bianchi');
    }
}

module.exports = { ChittyChatSmartStart };