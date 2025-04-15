const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env.test');
const envConfig = fs.readFileSync(envPath, 'utf8');

envConfig.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    process.env[key.trim()] = value.trim();
  }
}); 