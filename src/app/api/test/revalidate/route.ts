import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
    if (process.env.APP_ENV !== 'test') {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const authHeader = req.headers.get('x-e2e-reset-secret');
    if (authHeader !== process.env.E2E_BYPASS_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    revalidatePath('/', 'layout');
    
    return NextResponse.json({ success: true, message: 'Cache revalidated' });
}
