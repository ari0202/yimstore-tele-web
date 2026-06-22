import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcryptjs';
import * as readline from 'readline';
import * as dotenv from 'dotenv';
dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string): Promise<string> => 
    new Promise(resolve => rl.question(query, resolve));

async function setupAdmin() {
    console.log('\n🔐 YimStore Genesis Admin Setup\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        console.error('❌ Error: Supabase credentials missing in environment.');
        process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        // 1. Genesis Lockout Check
        const { count, error: countError } = await supabase
            .from('admins')
            .select('*', { count: 'exact', head: true });

        if (countError) throw countError;

        if (count && count > 0) {
            console.error('\n🚨 SECURITY LOCKOUT: Admin account already exists. Backdoor attempt aborted.\n');
            process.exit(1);
        }

        // 2. Interactive Prompts
        const username = await question('👤 Enter Admin Username: ');
        if (!username || username.trim() === '') {
            console.error('❌ Error: Username cannot be empty.');
            process.exit(1);
        }

        const password = await question('🔑 Enter Admin Password: ');
        if (!password || password.length < 8) {
            console.error('❌ Error: Password must be at least 8 characters long.');
            process.exit(1);
        }

        const confirmPassword = await question('🔑 Confirm Password: ');
        if (password !== confirmPassword) {
            console.error('❌ Error: Passwords do not match.');
            process.exit(1);
        }

        // 3. Hash & Insert
        console.log('\n⏳ Hashing password and injecting into database...');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const { error: insertError } = await supabase
            .from('admins')
            .insert({ username: username.trim(), password_hash: hash });

        if (insertError) throw insertError;

        console.log(`\n✅ Success! Admin '${username}' injected. You may now login to the dashboard.\n`);
    } catch (error) {
        console.error('\n❌ Setup failed:', error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

setupAdmin();
