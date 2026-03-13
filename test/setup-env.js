const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.test');

if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');

  envConfig.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;

    const key = trimmed.substring(0, eqIndex).trim();
    const value = trimmed.substring(eqIndex + 1).trim();

    // Only set vars that are not already defined (allows CI overrides)
    if (key && !(key in process.env)) {
      process.env[key] = value;
    }
  });
}
