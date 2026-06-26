import { Client } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

async function getMigrations(envFile: string) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);
  if (!dbUrlMatch) return [];
  
  const client = new Client({ connectionString: dbUrlMatch[1] });
  await client.connect();
  const res = await client.query('SELECT version FROM supabase_migrations.schema_migrations ORDER BY version ASC');
  await client.end();
  return res.rows.map(row => row.version);
}

async function main() {
  const devMigrations = await getMigrations('.env.development');
  const prodMigrations = await getMigrations('.env.production');
  
  console.log(`Dev has ${devMigrations.length} migrations.`);
  console.log(`Prod has ${prodMigrations.length} migrations.`);
  
  const devSet = new Set(devMigrations);
  const prodSet = new Set(prodMigrations);
  
  const missingInProd = devMigrations.filter(v => !prodSet.has(v));
  const missingInDev = prodMigrations.filter(v => !devSet.has(v));
  
  if (missingInProd.length > 0) {
    console.log('Missing in Prod:', missingInProd);
  } else if (missingInDev.length > 0) {
    console.log('Missing in Dev:', missingInDev);
  } else {
    console.log('Both databases are fully synced!');
  }
}

main().catch(console.error);
