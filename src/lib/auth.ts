import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { supabaseAdmin } from './supabase/admin';
import { redirect } from 'next/navigation';

const JWT_SECRET = new TextEncoder().encode(process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-fallback');

export async function signAdminSession(admin_id: string, session_id: string) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const token = await new SignJWT({ admin_id, session_id })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(JWT_SECRET);
    
    return { token, expiresAt };
}

export async function verifyAdminSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
        redirect('/admin/login');
    }

    try {
        // 1. Stateless Signature Verify (Fast Edge-friendly)
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const { admin_id, session_id } = payload as { admin_id: string, session_id: string };

        // 2. Stateful Database Verify (Zenith Anti-Exfiltration)
        const { data: session, error } = await supabaseAdmin
            .from('admin_sessions')
            .select('id')
            .eq('id', session_id)
            .eq('admin_id', admin_id)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !session) {
            throw new Error('Session revoked or expired in database');
        }

        return { admin_id, session_id };
    } catch (error) {
        // Destroy invalid cookie
        cookieStore.delete('admin_session');
        redirect('/admin/login');
    }
}

export async function verifyAdminAPI() {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
        return null;
    }

    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        const { admin_id, session_id } = payload as { admin_id: string, session_id: string };

        const { data: session, error } = await supabaseAdmin
            .from('admin_sessions')
            .select('id')
            .eq('id', session_id)
            .eq('admin_id', admin_id)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (error || !session) {
            return null;
        }

        return { admin_id, session_id };
    } catch (error) {
        return null;
    }
}

export async function logoutAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            const { session_id } = payload as { session_id: string };
            
            // Atomic DB Purge
            await supabaseAdmin.from('admin_sessions').delete().eq('id', session_id);
        } catch (e) {
            // Ignore token parse errors on logout
        }
    }
    
    cookieStore.delete('admin_session');
    redirect('/admin/login');
}
