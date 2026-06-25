import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Gunakan koneksi langsung (port 5432) untuk bypass masalah pooler & edge-runtime
const connectionString = 'postgresql://postgres:%23Sakithatiku02@db.zdhlfoiytkamnyywbgyx.supabase.co:5432/postgres';

async function runMigrations() {
    console.log('🚀 Starting migration push...');
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('✅ Connected to Supabase Remote Database');

        // Ambil data migrasi yang sudah pernah diaplikasikan oleh Supabase CLI
        let appliedMigrations: string[] = [];
        try {
            const res = await client.query('SELECT version FROM supabase_migrations.schema_migrations');
            appliedMigrations = res.rows.map(r => r.version);
        } catch (e) {
            console.log('⚠️ Warning: supabase_migrations schema not found. Migrations will run blindly.');
        }

        const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        let appliedCount = 0;
        for (const file of files) {
            const version = file.split('_')[0]; // Ambil prefix tanggal
            
            // Skip jika sudah diaplikasikan sebelumnya
            if (appliedMigrations.includes(version)) {
                console.log(`⏭️  Skipping already applied migration: ${file}`);
                continue;
            }

            console.log(`\n⏳ Executing: ${file}...`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            
            try {
                await client.query('BEGIN');
                await client.query(sql);
                // Catat ke tabel tracking Supabase
                try {
                    await client.query('INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1)', [version]);
                } catch(err) {
                    // Abaikan jika tidak bisa insert ke tabel log Supabase
                }
                await client.query('COMMIT');
                console.log(`✅ Applied: ${file}`);
                appliedCount++;
            } catch (err: any) {
                await client.query('ROLLBACK');
                // Jika error karena objek sudah ada (misal tertinggal dari eksekusi setengah jalan), tawarkan manual bypass
                if (err.code === '42P07' || err.code === '42710' || err.code === '42701') {
                    console.warn(`⚠️ Warning: ${err.message}. It seems this migration was already partially applied.`);
                    console.log(`⏭️  Marking as applied and skipping...`);
                    try {
                        await client.query('INSERT INTO supabase_migrations.schema_migrations (version) VALUES ($1)', [version]);
                    } catch(e) {}
                    continue;
                } else {
                    throw err;
                }
            }
        }

        if (appliedCount === 0) {
            console.log('\n✨ Database is already up to date!');
        } else {
            console.log('\n🎉 All new migrations pushed successfully!');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigrations();
