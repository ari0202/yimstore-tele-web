'use server';

import { logoutAdmin } from '@/lib/auth';

export async function handleLogout() {
    await logoutAdmin();
}
