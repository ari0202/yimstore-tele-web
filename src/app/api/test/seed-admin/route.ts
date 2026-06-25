import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const isE2E = req.headers.get('x-e2e-bypass') === process.env.E2E_BYPASS_SECRET;
    if (!isE2E) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    console.log('🌱 Seeding Admin E2E data...');

    console.log('1. Cleanup categories...');
    await supabaseAdmin.from('categories').delete().like('name', 'E2E-TEST-%');
    
    console.log('2. Cleanup products...');
    await supabaseAdmin.from('products').delete().like('name', 'E2E-TEST-%');

    console.log('3. Cleanup users...');
    await supabaseAdmin.from('users').delete().like('telegram_chat_id', 'E2E-USER-%');

    console.log('4. Create Category...');
    const timestamp = Date.now();
    const { data: category, error: catError } = await supabaseAdmin
      .from('categories')
      .insert({ name: `E2E-TEST-CAT-${timestamp}`, slug: `e2e-test-cat-${timestamp}` })
      .select('id').single();

    if (catError) {
      console.log('Category Error:', catError);
      throw catError;
    }
    console.log('Category created:', category?.id);

    if (catError) throw catError;

    // 3. Create Consumer User for Checkout testing
    const email = `e2e-admin-${timestamp}@test.com`;
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: 'password123',
      email_confirm: true
    });
    if (authErr || !authUser.user) throw new Error(authErr?.message || 'Failed to create auth user');
    const userId = authUser.user.id;
    
    const fakeTelegramId = `E2E-USER-${timestamp}`;
    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert({ id: userId, telegram_chat_id: fakeTelegramId });

    if (userError) throw userError;

    return NextResponse.json({ 
      message: 'Seed admin data successful', 
      categoryId: category.id,
      consumerId: userId,
      consumerTelegramId: fakeTelegramId
    });
  } catch (error: any) {
    console.error('Seed Admin Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
