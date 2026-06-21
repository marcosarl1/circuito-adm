const fs = require('fs');
const path = require('path');

const envFile = path.resolve(__dirname, '..', '.env');
const outDir = path.resolve(__dirname, '..', 'src', 'environments');
const outFile = path.join(outDir, 'environment.ts');

if (!fs.existsSync(envFile)) {
  console.error('.env file not found at', envFile);
  process.exit(1);
}

const raw = fs.readFileSync(envFile, 'utf8');
const lines = raw.split(/\r?\n/);
const env = {};
for (const line of lines) {
  if (!line || line.trim().startsWith('#')) continue;
  const idx = line.indexOf('=');
  if (idx === -1) continue;
  const key = line.substring(0, idx).trim();
  let val = line.substring(idx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.substring(1, val.length - 1);
  }
  env[key] = val;
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const content = `
export const environment = {
  production: false,
  apiUrl: '${env.API_URL || ''}',
  apiKey: '${env.API_KEY || ''}',
  postsApiUrl: '${env.POSTS_API_URL || 'https://cp2eg4gie4xqq4u4cvdzmnaane0muskn.lambda-url.sa-east-1.on.aws/'}',
  postsApiKey: '${env.POSTS_API_KEY || ''}',
  adminUser: '${env.ADMIN_USER || ''}',
  adminPass: '${env.ADMIN_PASS || ''}'
};
`;

fs.writeFileSync(outFile, content, { encoding: 'utf8' });
console.log('Wrote', outFile);
