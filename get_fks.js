const { Client } = require('pg');
const client = new Client('postgresql://postgres:%23Sakithatiku02@db.zdhlfoiytkamnyywbgyx.supabase.co:5432/postgres');

async function run() {
  await client.connect();
  const fks = await client.query(`
    SELECT
      tc.table_name, kcu.column_name
    FROM 
      information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    WHERE constraint_type = 'FOREIGN KEY' AND tc.table_schema='public';
  `);
  console.log("FOREIGN KEYS:");
  fks.rows.forEach(r => console.log(r.table_name, r.column_name));
  
  const idxs = await client.query(`
    SELECT tablename, indexname, indexdef
    FROM pg_indexes
    WHERE schemaname = 'public';
  `);
  console.log("\nINDEXES:");
  idxs.rows.forEach(r => console.log(r.tablename, r.indexname));
  client.end();
}
run();
