# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is the ChittyOps CI/CD repository - a centralized system for managing standardized CI/CD workflows across all ChittyOS, ChittyCorp, and nevershitty organization repositories. It provides automated testing, deployment, security scanning, and ChittyBeacon monitoring integration.

## Common Commands

### CI/CD Setup and Management
```bash
# One-time setup for all organization repos
./setup-org-workflows.sh

# Lock workflows and add protection (requires admin)
./lock-workflows.sh

# Check workflow status
gh run list --limit 10
gh run list --status=failure

# View and rerun workflows
gh run view --log [RUN_ID]
gh run rerun --failed [RUN_ID]

# Manual deployment trigger
gh workflow run deploy.yml --ref main
```

### Platform-Specific Deployments
```bash
# Vercel
vercel --prod
vercel rollback [DEPLOYMENT_URL]

# Cloudflare Workers
npx wrangler publish
npx wrangler rollback
```

### Security and Monitoring
```bash
# Check CI/CD health
gh api /orgs/[ORG]/dependabot/alerts
gh pr list --label="dependencies"

# View ChittyBeacon dashboard
# https://beacon.cloudeto.com
```

## Architecture

### Repository Structure
- `setup-org-workflows.sh` - Main script to deploy CI/CD across all organization repos
- `lock-workflows.sh` - Implements workflow protection and branch rules
- `ChittyOS-CICD-SOPs.md` - Comprehensive standard operating procedures
- `CICD-Quick-Reference.md` - Quick reference guide for common operations
- `CODEOWNERS` - Defines code ownership and review requirements

### Workflow System Components

1. **Project Type Detection**
   - Automatically identifies: Node.js, Python, Rust, Go, Cloudflare Workers, Next.js
   - Applies appropriate workflow templates based on detected type

2. **ChittyBeacon Integration**
   - Automatic monitoring package installation
   - Heartbeat tracking every 5 minutes
   - Platform detection and deployment tracking

3. **Security Features**
   - Automated dependency updates via Dependabot
   - Security scanning with Snyk, CodeQL, OWASP
   - Secret detection in code
   - Weekly vulnerability assessments

4. **Deployment Platforms**
   - Vercel (preview and production deployments)
   - Cloudflare Workers (edge deployment)
   - Generic Node.js CI/CD

### Required GitHub Secrets

| Secret Name | Purpose | Required For |
|------------|---------|--------------|
| `BEACON_ENDPOINT` | ChittyBeacon tracking URL | Optional (defaults to https://beacon.cloudeto.com) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare deployments | Cloudflare Workers projects |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account | Cloudflare Workers projects |
| `VERCEL_TOKEN` | Vercel deployments | Vercel projects |
| `VERCEL_ORG_ID` | Vercel organization | Vercel projects |
| `VERCEL_PROJECT_ID` | Vercel project | Vercel projects |
| `SNYK_TOKEN` | Security scanning | Recommended for all |

### Organizations Managed
- ChittyOS
- ChittyCorp
- nevershitty

## Key SOPs

### SOP-001: Initial Setup
- Runs `setup-org-workflows.sh` to deploy workflows across all repos
- Creates PRs with CI/CD changes for review
- Configures organization-wide secrets

### SOP-002: New Repository Integration
- Detects project type automatically
- Adds appropriate workflows
- Integrates ChittyBeacon monitoring
- Sets up branch protection

### SOP-003: ChittyBeacon Integration
- Node.js: `npm install @chittycorp/app-beacon --save`
- Python: Custom module in `chittybeacon/`
- Environment variables for configuration

### SOP-004: Deployment Management
- Platform-specific deployment workflows
- Rollback procedures for each platform
- Environment separation (production/preview)

### SOP-005: Security Management
- Weekly dependency updates
- Automated vulnerability scanning
- Security response by severity level

### SOP-006: Troubleshooting
- Common issues and resolutions
- Debug commands and procedures
- Emergency response workflows

### SOP-007: Monitoring and Maintenance
- Daily health checks
- Weekly dependency reviews
- Monthly performance analysis
- Quarterly strategy reviews

## Workflow Protection System

The repository implements a comprehensive protection system:

1. **CODEOWNERS File**
   - Requires admin approval for workflow changes
   - Protected paths: `.github/workflows/`, setup scripts
   - Default reviewers: @nickbianchi, @ChittyOS/cicd-admins

2. **Branch Protection Rules**
   - Required status checks: beacon-check, test, security
   - Dismiss stale reviews
   - Require code owner reviews
   - No force pushes or deletions

3. **Automated Checks**
   - ChittyBeacon integration verification
   - Secret detection in code
   - License file presence
   - YAML syntax validation

## Emergency Procedures

### Complete Pipeline Failure
1. Disable failing workflow temporarily
2. Deploy manually using platform CLIs
3. Create incident ticket
4. Investigate root cause
5. Implement fix and re-enable

### Quick Rollback
- Vercel: `vercel rollback [URL]`
- Cloudflare: `npx wrangler rollback`
- Git: `git revert HEAD && git push`

## Performance Targets

- Workflow success rate: >95%
- Deployment success rate: >99%
- Average build time: <5 minutes
- Average deployment time: <3 minutes
- Critical vulnerability patch time: <24 hours

## Monitoring Dashboards

- ChittyBeacon: https://beacon.cloudeto.com
- GitHub Actions: https://github.com/[ORG]/[REPO]/actions
- Vercel: https://vercel.com/dashboard
- Cloudflare: https://dash.cloudflare.com