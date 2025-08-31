#!/bin/bash

# ChatGPT Connector Setup Script
# ChittyOS MCP Integration for ChatGPT

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MCP_SERVER_URL="https://mcp.chitty.cc"
OAUTH_CLIENT_ID="chittychat-mcp"
CONNECTOR_NAME="ChittyChat Project Manager"

# Logging functions
log() {
    echo -e "${1}"
}

error_exit() {
    log "${RED}ERROR: $1${NC}"
    exit 1
}

success() {
    log "${GREEN}✅ $1${NC}"
}

warn() {
    log "${YELLOW}⚠️  $1${NC}"
}

info() {
    log "${BLUE}ℹ️  $1${NC}"
}

# Check if MCP server is healthy
check_mcp_server() {
    info "Checking MCP server health..."
    
    if curl -s "${MCP_SERVER_URL}/health" | grep -q "healthy"; then
        success "MCP server is healthy and ready"
    else
        error_exit "MCP server at ${MCP_SERVER_URL} is not responding properly"
    fi
}

# Display ChatGPT connector setup instructions
show_setup_instructions() {
    info "ChatGPT Connector Setup Instructions"
    echo
    log "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
    log "${BLUE}│                 ChatGPT Connector Setup                     │${NC}"
    log "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
    echo
    
    log "${YELLOW}Step 1: Open ChatGPT Settings${NC}"
    log "1. Go to https://chat.openai.com"
    log "2. Click on your profile in the bottom left"
    log "3. Select 'Settings & Beta'"
    log "4. Go to 'Beta features'"
    log "5. Enable 'Third-party plugins' if not already enabled"
    echo
    
    log "${YELLOW}Step 2: Add New Connector${NC}"
    log "1. In ChatGPT, look for 'Connectors' or 'Third-party plugins'"
    log "2. Click 'Add Connector' or similar button"
    log "3. Choose 'MCP Server' or 'Custom Connector'"
    echo
    
    log "${YELLOW}Step 3: Configure Connector${NC}"
    log "Use these exact values:"
    log "┌─────────────────────────────────────────────────────────────┐"
    log "│ Name: ${GREEN}${CONNECTOR_NAME}${NC}                            │"
    log "│ Description: ${GREEN}Universal project management system${NC}      │"
    log "│ MCP Server URL: ${GREEN}${MCP_SERVER_URL}${NC}                     │"
    log "│ Authentication: ${GREEN}OAuth${NC}                                │"
    log "│ Client ID: ${GREEN}${OAUTH_CLIENT_ID}${NC}                        │"
    log "└─────────────────────────────────────────────────────────────┘"
    echo
    
    log "${YELLOW}Step 4: Complete OAuth Flow${NC}"
    log "1. Click 'Connect' or 'Authorize'"
    log "2. You'll be redirected to: ${MCP_SERVER_URL}/oauth/authorize"
    log "3. The system will auto-approve for now (development mode)"
    log "4. You'll be redirected back to ChatGPT"
    log "5. The connector should show as 'Connected'"
    echo
    
    log "${YELLOW}Step 5: Test the Connection${NC}"
    log "Try these test commands in ChatGPT:"
    log "• 'Find all my Python projects using ChittyChat'"
    log "• 'Create a new project called Test Project'"
    log "• 'Show me tasks in my latest project'"
    log "• 'Add a task to review documentation'"
    echo
}

# Display available MCP tools
show_available_tools() {
    info "Available MCP Tools"
    echo
    log "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
    log "${BLUE}│                    Available Tools                          │${NC}"
    log "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
    echo
    
    log "${GREEN}📁 Project Management${NC}"
    log "• search_projects - Find existing projects by name or keywords"
    log "• create_project - Create new projects with ChittyID integration"
    log "• get_project_info - Get detailed information about a project"
    echo
    
    log "${GREEN}✅ Task Management${NC}"  
    log "• list_tasks - View tasks in a project with status and priority"
    log "• create_task - Add new tasks with descriptions and assignments"
    log "• update_task - Change task status, priority, or details"
    log "• delete_task - Remove tasks from projects"
    echo
    
    log "${GREEN}🧠 Project Awareness${NC}"
    log "• get_project_suggestions - Get intelligent project suggestions"
    log "• set_active_project - Switch to a different project context"
    log "• analyze_current_context - Analyze current work context"
    echo
    
    log "${GREEN}📊 Statistics & Reporting${NC}"
    log "• get_project_statistics - View project usage and activity stats"
    log "• get_recent_activity - Check recent activity across projects"
    echo
}

# Show example usage
show_example_usage() {
    info "Example Usage Scenarios"
    echo
    log "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
    log "${BLUE}│                   Example Conversations                     │${NC}"
    log "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
    echo
    
    log "${YELLOW}🔍 Finding Projects${NC}"
    log "User: 'Show me all my legal projects'"
    log "ChatGPT: Uses search_projects to find projects with legal keywords"
    log "Result: Lists all legal-related projects with descriptions"
    echo
    
    log "${YELLOW}📋 Managing Tasks${NC}"
    log "User: 'What tasks do I have in the Arias case?'"
    log "ChatGPT: Uses list_tasks for the Arias-v-Bianchi project"
    log "Result: Shows all tasks with current status and priorities"
    echo
    
    log "${YELLOW}✨ Creating Content${NC}"
    log "User: 'Create a new project for API development'"
    log "ChatGPT: Uses create_project with appropriate metadata"
    log "Result: Creates project with ChittyID and shows project details"
    echo
    
    log "${YELLOW}🎯 Smart Context Switching${NC}"
    log "User: 'I'm working on financial reports now'"
    log "ChatGPT: Uses get_project_suggestions with financial context"
    log "Result: Suggests ChittyFinance project and related tasks"
    echo
}

# Test MCP server endpoints
test_mcp_endpoints() {
    info "Testing MCP server endpoints..."
    
    # Test health endpoint
    if curl -s "${MCP_SERVER_URL}/health" | grep -q "healthy"; then
        success "✅ Health endpoint working"
    else
        warn "❌ Health endpoint failed"
    fi
    
    # Test OAuth endpoints
    if curl -s "${MCP_SERVER_URL}/.well-known/oauth-authorization-server" | grep -q "authorization_endpoint"; then
        success "✅ OAuth discovery working"
    else
        warn "❌ OAuth discovery failed"
    fi
    
    # Test CORS headers
    CORS_TEST=$(curl -s -H "Origin: https://chat.openai.com" -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Authorization" -X OPTIONS "${MCP_SERVER_URL}/oauth/authorize")
    if [[ $? -eq 0 ]]; then
        success "✅ CORS configuration working"
    else
        warn "❌ CORS configuration may have issues"
    fi
}

# Generate connector configuration file
generate_connector_config() {
    info "Generating connector configuration file..."
    
    CONFIG_FILE="chatgpt-connector-config.json"
    
    cat > "$CONFIG_FILE" << EOF
{
  "name": "${CONNECTOR_NAME}",
  "description": "Universal project management system that replaces TodoWrite for AI agents",
  "version": "1.0.0",
  "mcp_server": {
    "url": "${MCP_SERVER_URL}",
    "protocol": "websocket",
    "authentication": {
      "type": "oauth",
      "client_id": "${OAUTH_CLIENT_ID}",
      "authorization_url": "${MCP_SERVER_URL}/oauth/authorize",
      "token_url": "${MCP_SERVER_URL}/oauth/token",
      "scopes": ["project:read", "project:write", "task:manage"]
    }
  },
  "tools": [
    {
      "name": "search_projects",
      "description": "Find existing projects by name or keywords"
    },
    {
      "name": "create_project", 
      "description": "Create new projects with ChittyID integration"
    },
    {
      "name": "list_tasks",
      "description": "View tasks in a project with status and priority"
    },
    {
      "name": "create_task",
      "description": "Add new tasks with descriptions and assignments"
    },
    {
      "name": "update_task",
      "description": "Change task status, priority, or details"
    },
    {
      "name": "get_project_suggestions",
      "description": "Get intelligent project suggestions based on context"
    },
    {
      "name": "set_active_project",
      "description": "Switch to a different project context"
    },
    {
      "name": "get_project_statistics",
      "description": "View project usage and activity statistics"
    }
  ],
  "setup_instructions": {
    "step1": "Enable third-party plugins in ChatGPT settings",
    "step2": "Add new connector with MCP Server type",
    "step3": "Use provided URL and OAuth credentials",
    "step4": "Complete OAuth authorization flow",
    "step5": "Test connection with example commands"
  }
}
EOF
    
    success "Connector configuration saved to: $CONFIG_FILE"
}

# Show troubleshooting guide
show_troubleshooting() {
    info "Troubleshooting Guide"
    echo
    log "${BLUE}┌─────────────────────────────────────────────────────────────┐${NC}"
    log "${BLUE}│                  Common Issues                              │${NC}"
    log "${BLUE}└─────────────────────────────────────────────────────────────┘${NC}"
    echo
    
    log "${RED}❌ Connection Failed${NC}"
    log "• Check MCP server health: curl ${MCP_SERVER_URL}/health"
    log "• Verify CORS settings allow chat.openai.com"
    log "• Ensure OAuth endpoints are responding"
    echo
    
    log "${RED}❌ OAuth Authorization Failed${NC}"
    log "• Check client ID matches: ${OAUTH_CLIENT_ID}"
    log "• Verify OAuth endpoints are configured"
    log "• Check redirect URI in OAuth flow"
    echo
    
    log "${RED}❌ Tools Not Working${NC}"
    log "• Verify WebSocket connection to ${MCP_SERVER_URL}/mcp"
    log "• Check MCP protocol version compatibility"
    log "• Ensure proper authentication headers"
    echo
    
    log "${GREEN}✅ Debug Commands${NC}"
    log "• Health check: curl ${MCP_SERVER_URL}/health"
    log "• OAuth info: curl ${MCP_SERVER_URL}/.well-known/oauth-authorization-server"
    log "• Test auth: curl -H 'Origin: https://chat.openai.com' ${MCP_SERVER_URL}/oauth/authorize"
    echo
}

# Main execution
main() {
    info "ChittyOS ChatGPT Connector Setup"
    echo
    
    # Check MCP server health first
    check_mcp_server
    echo
    
    # Show setup instructions
    show_setup_instructions
    echo
    
    # Show available tools
    show_available_tools  
    echo
    
    # Show example usage
    show_example_usage
    echo
    
    # Test endpoints
    test_mcp_endpoints
    echo
    
    # Generate config file
    generate_connector_config
    echo
    
    # Show troubleshooting
    show_troubleshooting
    echo
    
    success "🎉 ChatGPT Connector Setup Complete!"
    echo
    info "Next steps:"
    info "1. Follow the setup instructions above to add the connector in ChatGPT"
    info "2. Test the connection with the example commands"
    info "3. Use the troubleshooting guide if you encounter issues"
    info "4. Check the generated config file for reference: chatgpt-connector-config.json"
}

# Execute main function
main "$@"