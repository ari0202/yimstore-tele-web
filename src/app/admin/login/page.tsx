import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import * as bcrypt from 'bcryptjs';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { signAdminSession } from '@/lib/auth';
import { AlertCircle } from 'lucide-react';

export default function AdminLogin({ searchParams }: { searchParams: { error?: string } }) {
  async function handleLogin(formData: FormData) {
    'use server';
    
    const reqHeaders = await headers();
    // Fallback Limiter: x-real-ip -> x-vercel-forwarded-for -> x-forwarded-for
    const ip = reqHeaders.get('x-real-ip') 
            || reqHeaders.get('x-vercel-forwarded-for') 
            || reqHeaders.get('x-forwarded-for')?.split(',')[0] 
            || 'unknown';

    // 1. Check Rate Limit
    const { data: attempt } = await supabaseAdmin
        .from('login_attempts')
        .select('*')
        .eq('ip_address', ip)
        .single();

    if (attempt && attempt.attempts >= 5) {
        const lastAttempt = new Date(attempt.last_attempt).getTime();
        const now = new Date().getTime();
        if (now - lastAttempt < 15 * 60 * 1000) {
            redirect('/admin/login?error=Rate limit exceeded. Try again in 15 minutes.');
        } else {
            // Reset after 15 mins
            await supabaseAdmin.from('login_attempts').delete().eq('ip_address', ip);
        }
    }

    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    if (!username || !password) {
        redirect('/admin/login?error=Invalid credentials');
    }

    // 2. Fetch Admin
    const { data: admin } = await supabaseAdmin
        .from('admins')
        .select('id, password_hash')
        .eq('username', username)
        .single();

    let validPassword = false;
    if (admin) {
        validPassword = await bcrypt.compare(password, admin.password_hash);
    }

    if (!admin || !validPassword) {
        // Record failed attempt
        const newAttempts = attempt ? attempt.attempts + 1 : 1;
        await supabaseAdmin.from('login_attempts').upsert({
            ip_address: ip,
            attempts: newAttempts,
            last_attempt: new Date().toISOString()
        });
        redirect('/admin/login?error=Invalid credentials');
    }

    // 3. Clear attempts on success
    await supabaseAdmin.from('login_attempts').delete().eq('ip_address', ip);

    // 4. Create Session
    const session_id = crypto.randomUUID();
    const { token, expiresAt } = await signAdminSession(admin.id, session_id);

    await supabaseAdmin.from('admin_sessions').insert({
        id: session_id,
        admin_id: admin.id,
        expires_at: expiresAt.toISOString()
    });

    const cookieStore = await cookies();
    cookieStore.set('admin_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: '/',
        expires: expiresAt
    });

    redirect('/admin');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white">YimStore Admin</h2>
            <p className="text-gray-400 mt-2">Sign in to manage your store</p>
          </div>

          {searchParams.error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-500">
              <AlertCircle size={20} />
              <p className="text-sm font-medium">{searchParams.error}</p>
            </div>
          )}

          <form action={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
              <input
                type="text"
                name="username"
                required
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="Enter your username"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <input
                type="password"
                name="password"
                required
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
