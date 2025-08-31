#!/usr/bin/env node

/**
 * Automatic ChittyChat Integration Script
 * Integrates project awareness directly into ChittyChat as a core service
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ChittyChatAutoIntegrator {
    constructor() {
        this.chittyChatPath = '/Volumes/thumb/Projects/chittyos/chittychat';
        this.projectAwarenessPath = '/Volumes/thumb/Projects/chittyos/chittyops/project-awareness';
        this.claudePath = '/Users/nb/.claude';
    }

    async integrate() {
        console.log('🔄 Starting automatic ChittyChat integration...');

        try {
            // Step 1: Check ChittyChat availability
            await this.checkChittyChatAvailability();

            // Step 2: Integrate into ChittyChat server
            await this.integrateIntoChittyChatServer();

            // Step 3: Update ChittyChat MCP endpoints
            await this.updateMCPEndpoints();

            // Step 4: Install Claude hooks automatically
            await this.autoInstallClaudeHooks();

            // Step 5: Update ChittyChat package.json
            await this.updateChittyChatPackage();

            // Step 6: Create auto-startup service
            await this.createAutoStartupService();

            console.log('✅ ChittyChat integration complete!');
            console.log('🚀 Project awareness is now a core ChittyChat service');

        } catch (error) {
            console.error('❌ Integration failed:', error);
            process.exit(1);
        }
    }

    async checkChittyChatAvailability() {
        if (!fs.existsSync(this.chittyChatPath)) {
            throw new Error(`ChittyChat not found at: ${this.chittyChatPath}`);
        }

        const packagePath = path.join(this.chittyChatPath, 'package.json');
        if (!fs.existsSync(packagePath)) {
            throw new Error('ChittyChat package.json not found');
        }

        console.log('✅ ChittyChat found and accessible');
    }

    async integrateIntoChittyChatServer() {
        console.log('🔧 Integrating into ChittyChat server...');

        const serverPath = path.join(this.chittyChatPath, 'server');
        const projectAwarenessServicePath = path.join(serverPath, 'services', 'project-awareness');

        // Create project awareness service directory
        if (!fs.existsSync(projectAwarenessServicePath)) {
            fs.mkdirSync(projectAwarenessServicePath, { recursive: true });
        }

        // Copy core project awareness files
        const filesToCopy = [
            'index.js',
            'lib/project-analyzer.js',
            'lib/chittychat-client.js',
            'lib/session-parser.js',
            'lib/user-prompt.js'
        ];

        for (const file of filesToCopy) {
            const sourcePath = path.join(this.projectAwarenessPath, file);
            const targetPath = path.join(projectAwarenessServicePath, path.basename(file));
            
            if (fs.existsSync(sourcePath)) {
                const sourceDir = path.dirname(targetPath);
                if (!fs.existsSync(sourceDir)) {
                    fs.mkdirSync(sourceDir, { recursive: true });
                }
                fs.copyFileSync(sourcePath, targetPath);
                console.log(`📄 Copied ${file}`);
            }
        }

        // Create ChittyChat integration module
        const integrationModule = `
const ProjectAwarenessExtension = require('./project-awareness/index.js');

class ChittyChatProjectAwareness {
    constructor(chittyChatServer) {
        this.server = chittyChatServer;
        this.projectAwareness = new ProjectAwarenessExtension();
        this.isEnabled = true;
    }

    async initialize() {
        console.log('🧠 Initializing ChittyChat Project Awareness...');
        
        // Register MCP endpoints
        this.registerMCPEndpoints();
        
        // Start project awareness
        await this.projectAwareness.onClaudeStart();
        
        console.log('✅ ChittyChat Project Awareness initialized');
    }

    registerMCPEndpoints() {
        // Get active projects
        this.server.addTool('get_active_projects', async (params) => {
            return await this.projectAwareness.chittyChatClient.getActiveProjects();
        });

        // Set active project
        this.server.addTool('set_active_project', async (params) => {
            return await this.projectAwareness.chittyChatClient.setActiveProject(params.project_name);
        });

        // Get project suggestions
        this.server.addTool('get_project_suggestions', async (params) => {
            return await this.projectAwareness.getProjectSuggestions(params);
        });

        // Force cross-session alignment
        this.server.addTool('force_session_alignment', async (params) => {
            return await this.projectAwareness.forceSessionRestoration();
        });

        // Consolidate session memory
        this.server.addTool('consolidate_session_memory', async (params) => {
            return await this.projectAwareness.chittyChatClient.consolidateSessionMemory(
                params.session_id, 
                params.project_id
            );
        });
    }

    async onSessionStart(sessionId) {
        if (this.isEnabled) {
            await this.projectAwareness.onClaudeStart();
        }
    }

    async onSessionEnd(sessionId) {
        if (this.isEnabled) {
            await this.projectAwareness.onSessionEnd();
        }
    }

    async onToolUse(toolName, toolArgs) {
        if (this.isEnabled) {
            await this.projectAwareness.onPreToolUse(toolName, toolArgs);
        }
    }
}

module.exports = { ChittyChatProjectAwareness };
`;

        const integrationPath = path.join(serverPath, 'services', 'chittychat-project-awareness.js');
        fs.writeFileSync(integrationPath, integrationModule);
        console.log('🔧 Created ChittyChat integration module');
    }

    async updateMCPEndpoints() {
        console.log('🔌 Updating MCP endpoints...');

        const serverIndexPath = path.join(this.chittyChatPath, 'server', 'index.ts');
        
        if (fs.existsSync(serverIndexPath)) {
            let serverContent = fs.readFileSync(serverIndexPath, 'utf8');
            
            // Add project awareness import
            if (!serverContent.includes('ChittyChatProjectAwareness')) {
                const importLine = "import { ChittyChatProjectAwareness } from './services/chittychat-project-awareness.js';\n";
                serverContent = importLine + serverContent;
            }

            // Add project awareness initialization
            const initCode = `
// Initialize Project Awareness
const projectAwareness = new ChittyChatProjectAwareness(server);
await projectAwareness.initialize();
`;

            if (!serverContent.includes('projectAwareness')) {
                // Find a good place to insert initialization (after server creation)
                const serverCreationPattern = /const server = new MCPServer/g;
                if (serverCreationPattern.test(serverContent)) {
                    serverContent = serverContent.replace(
                        /const server = new MCPServer[^;]+;/g,
                        match => match + initCode
                    );
                }
            }

            fs.writeFileSync(serverIndexPath, serverContent);
            console.log('🔌 Updated ChittyChat server with project awareness');
        }
    }

    async autoInstallClaudeHooks() {
        console.log('🪝 Auto-installing Claude hooks...');

        // Update Claude settings automatically
        const settingsPath = path.join(this.claudePath, 'settings.local.json');
        let settings = {};

        if (fs.existsSync(settingsPath)) {
            settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        }

        // Ensure hooks section exists
        if (!settings.hooks) {
            settings.hooks = {};
        }

        // Add project awareness hooks
        const hooksToAdd = {
            onSessionStart: [{
                command: path.join(this.projectAwarenessPath, 'hooks', 'project-awareness-startup.sh')
            }],
            preToolUse: [{
                command: path.join(this.projectAwarenessPath, 'hooks', 'project-awareness-pretool.sh'),
                tools: ['*']
            }],
            postToolUse: [{
                command: path.join(this.projectAwarenessPath, 'hooks', 'project-awareness-posttool.sh'),
                tools: ['*']
            }],
            onSessionEnd: [{
                command: path.join(this.projectAwarenessPath, 'hooks', 'project-awareness-sessionend.sh')
            }]
        };

        for (const [hookType, hookConfig] of Object.entries(hooksToAdd)) {
            if (!settings.hooks[hookType]) {
                settings.hooks[hookType] = [];
            }
            
            // Check if hook already exists
            const existingHook = settings.hooks[hookType].find(h => 
                h.command.includes('project-awareness')
            );
            
            if (!existingHook) {
                settings.hooks[hookType].push(...hookConfig);
            }
        }

        // Add /projects command
        if (!settings.commands) {
            settings.commands = {};
        }
        
        settings.commands.projects = {
            command: path.join(this.projectAwarenessPath, 'commands', 'projects.js')
        };

        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        console.log('🪝 Claude hooks auto-installed');
    }

    async updateChittyChatPackage() {
        console.log('📦 Updating ChittyChat package.json...');

        const packagePath = path.join(this.chittyChatPath, 'package.json');
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

        // Add project awareness dependency
        if (!packageData.dependencies) {
            packageData.dependencies = {};
        }
        packageData.dependencies['@chittyops/project-awareness'] = 'file:../chittyops/project-awareness';

        // Add scripts
        if (!packageData.scripts) {
            packageData.scripts = {};
        }
        packageData.scripts['project-awareness'] = 'node server/services/chittychat-project-awareness.js';

        fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
        console.log('📦 ChittyChat package updated');
    }

    async createAutoStartupService() {
        console.log('🚀 Creating auto-startup service...');

        const startupScript = `#!/bin/bash
# ChittyChat with Project Awareness Auto-Startup

echo "🚀 Starting ChittyChat with Project Awareness..."

# Set environment variables
export CHITTY_PROJECT_AWARENESS_ENABLED=true
export CHITTY_SESSION_MEMORY_ENABLED=true
export CHITTY_CROSS_SESSION_ALIGNMENT=true

# Start ChittyChat with project awareness
cd "${this.chittyChatPath}"
npm run dev

echo "✅ ChittyChat with Project Awareness started"
`;

        const startupPath = path.join(this.chittyChatPath, 'start-with-project-awareness.sh');
        fs.writeFileSync(startupPath, startupScript);
        fs.chmodSync(startupPath, '755');

        console.log('🚀 Auto-startup service created');
        console.log(`📍 Run: ${startupPath}`);
    }
}

// Auto-run if called directly
if (require.main === module) {
    const integrator = new ChittyChatAutoIntegrator();
    integrator.integrate();
}

module.exports = { ChittyChatAutoIntegrator };