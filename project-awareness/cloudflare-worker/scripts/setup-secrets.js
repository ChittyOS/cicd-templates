#!/usr/bin/env node

/**
 * Setup Secrets Script
 * Interactive script to setup required secrets for the Cloudflare Worker
 */

const readline = require('readline');
const { exec } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Required secrets configuration
const SECRETS_CONFIG = [
  {
    name: 'CHITTYID_API_KEY',
    description: 'API key for ChittyID authentication service',
    required: true,
    validate: (value) => value.length >= 32
  },
  {
    name: 'CHITTYCHAT_API_KEY', 
    description: 'API key for ChittyChat integration',
    required: true,
    validate: (value) => value.length >= 32
  },
  {
    name: 'REGISTRY_API_KEY',
    description: 'API key for ChittyRegistry service',
    required: true,
    validate: (value) => value.length >= 32
  },
  {
    name: 'SESSION_ENCRYPTION_KEY',
    description: 'Key for encrypting session data',
    required: true,
    generate: () => crypto.randomBytes(32).toString('hex'),
    validate: (value) => value.length === 64
  },
  {
    name: 'JWT_SECRET',
    description: 'Secret for signing JWT tokens',
    required: true,
    generate: () => crypto.randomBytes(32).toString('hex'),
    validate: (value) => value.length >= 32
  },
  {
    name: 'WEBHOOK_SECRET',
    description: 'Secret for validating webhooks',
    required: false,
    generate: () => crypto.randomBytes(16).toString('hex'),
    validate: (value) => value.length >= 16
  },
  {
    name: 'OPENAI_API_KEY',
    description: 'OpenAI API key for CustomGPT integration (optional)',
    required: false,
    validate: (value) => value.startsWith('sk-')
  }
];

class SecretsSetup {
  constructor() {
    this.secrets = new Map();
    this.environment = 'production';
  }

  async run() {
    console.log('🔐 ChittyOps Project Awareness - Secrets Setup');
    console.log('===============================================\n');

    try {
      // Check if wrangler is available
      await this.checkWrangler();

      // Ask for environment
      await this.selectEnvironment();

      // Collect secrets
      await this.collectSecrets();

      // Confirm and deploy
      await this.confirmAndDeploy();

      console.log('\n✅ Secrets setup completed successfully!');
      
    } catch (error) {
      console.error('\n❌ Error setting up secrets:', error.message);
      process.exit(1);
    } finally {
      rl.close();
    }
  }

  async checkWrangler() {
    return new Promise((resolve, reject) => {
      exec('wrangler --version', (error) => {
        if (error) {
          reject(new Error('Wrangler CLI not found. Please install it with: npm install -g wrangler'));
        } else {
          resolve();
        }
      });
    });
  }

  async selectEnvironment() {
    const answer = await this.askQuestion('Select environment (production/staging) [production]: ');
    this.environment = answer.toLowerCase() || 'production';
    
    if (!['production', 'staging'].includes(this.environment)) {
      throw new Error('Invalid environment. Must be "production" or "staging"');
    }

    console.log(`\n📋 Setting up secrets for ${this.environment} environment\n`);
  }

  async collectSecrets() {
    console.log('Collecting required secrets...\n');

    for (const secretConfig of SECRETS_CONFIG) {
      await this.collectSecret(secretConfig);
    }
  }

  async collectSecret(config) {
    console.log(`\n🔑 ${config.name}`);
    console.log(`   Description: ${config.description}`);
    console.log(`   Required: ${config.required ? 'Yes' : 'No'}`);

    let value = '';

    // Check if secret can be generated
    if (config.generate) {
      const shouldGenerate = await this.askQuestion('   Generate automatically? (y/N): ');
      if (shouldGenerate.toLowerCase() === 'y') {
        value = config.generate();
        console.log(`   ✓ Generated automatically`);
      }
    }

    // If not generated, ask for input
    if (!value) {
      value = await this.askQuestion('   Enter value: ', true);
    }

    // Skip if empty and not required
    if (!value && !config.required) {
      console.log(`   ⏭️  Skipped (optional)`);
      return;
    }

    // Validate required fields
    if (!value && config.required) {
      throw new Error(`${config.name} is required`);
    }

    // Validate format if validator provided
    if (value && config.validate && !config.validate(value)) {
      throw new Error(`${config.name} validation failed`);
    }

    this.secrets.set(config.name, value);
    console.log(`   ✓ Collected`);
  }

  async confirmAndDeploy() {
    console.log('\n📋 Summary of secrets to be set:');
    console.log('================================');

    for (const [name, value] of this.secrets.entries()) {
      const maskedValue = this.maskSecret(value);
      console.log(`  ${name}: ${maskedValue}`);
    }

    const confirm = await this.askQuestion('\nProceed with setting these secrets? (y/N): ');
    if (confirm.toLowerCase() !== 'y') {
      console.log('❌ Cancelled by user');
      return;
    }

    console.log('\n🚀 Setting secrets...');

    for (const [name, value] of this.secrets.entries()) {
      await this.setSecret(name, value);
    }

    // Save secrets to local file for backup (masked)
    await this.saveSecretsBackup();
  }

  async setSecret(name, value) {
    return new Promise((resolve, reject) => {
      const envFlag = this.environment === 'staging' ? '--env staging' : '';
      const command = `echo "${value}" | wrangler secret put ${name} ${envFlag}`;
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error(`   ❌ Failed to set ${name}: ${error.message}`);
          reject(error);
        } else {
          console.log(`   ✅ ${name} set successfully`);
          resolve();
        }
      });
    });
  }

  async saveSecretsBackup() {
    const backup = {
      environment: this.environment,
      created_at: new Date().toISOString(),
      secrets: {}
    };

    for (const [name, value] of this.secrets.entries()) {
      backup.secrets[name] = this.maskSecret(value);
    }

    const backupFile = `secrets-backup-${this.environment}-${Date.now()}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));
    console.log(`\n💾 Secrets backup saved to: ${backupFile}`);
  }

  maskSecret(value) {
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    }
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
  }

  askQuestion(question, hidden = false) {
    return new Promise((resolve) => {
      if (hidden) {
        // For hidden input, we'll just use regular input
        // In production, you might want to use a library like 'read' for true hidden input
        rl.question(question, (answer) => {
          resolve(answer.trim());
        });
      } else {
        rl.question(question, (answer) => {
          resolve(answer.trim());
        });
      }
    });
  }
}

// Run the setup
if (require.main === module) {
  const setup = new SecretsSetup();
  setup.run().catch((error) => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = SecretsSetup;