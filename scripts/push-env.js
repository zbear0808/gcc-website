import fs from 'fs';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

console.log('Reading local .env file...');
const envConfig = dotenv.parse(fs.readFileSync('.env'));

const environment = process.argv[2] || 'development';
console.log(`Pushing environment variables to Vercel (${environment} environment)...`);

for (const key in envConfig) {
  const value = envConfig[key];
  console.log(`Pushing ${key}...`);
  try {
    // We use the CLI to add the variable non-interactively
    execSync(`vercel env add ${key} ${environment} --yes`, {
      input: value,
      stdio: ['pipe', 'inherit', 'inherit']
    });
  } catch (err) {
    console.error(`Failed to push ${key}. (It might already exist, or Vercel CLI threw an error)`);
  }
}

console.log('\nDone pushing environment variables!');
