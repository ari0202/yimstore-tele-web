import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { Save, ShieldAlert } from 'lucide-react';

export default async function SettingsPage() {
  const { data: settings } = await supabaseAdmin.from('system_settings').select('*');
  
  // Convert array to object
  const config = settings?.reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {}) || {};

  async function updateSettings(formData: FormData) {
    'use server';
    const { admin_id } = await verifyAdminSession();
    
      // Construct the settings object safely
    const payload = {
      store_name: formData.get('store_name') as string,
      maintenance_mode: formData.get('maintenance_mode') === 'on' ? 'true' : 'false',
      kill_switch_active: formData.get('kill_switch_active') === 'on' ? 'true' : 'false',
      max_orders_per_minute: formData.get('max_orders_per_minute') as string,
      telegram_testimoni_channel_id: formData.get('telegram_testimoni_channel_id') as string
    };

    // Panggil Atomic RPC
    await supabaseAdmin.rpc('rpc_update_system_settings', {
      p_admin_id: admin_id,
      p_settings: payload
    });

    revalidatePath('/admin/settings');
  }

  return (
    <div className="max-w-3xl space-y-8">
      <form action={updateSettings} className="bg-white dark:bg-gray-900 p-8 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-8 mt-4 transition-colors">
        
        {/* General Info */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 border-b dark:border-gray-800 pb-2">General</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Store Name</label>
            <input 
              type="text" 
              name="store_name" 
              defaultValue={config['store_name'] || 'Yim Digital'} 
              className="w-full px-4 py-2 border dark:border-gray-700 bg-transparent dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telegram Testimonial Channel ID</label>
            <input 
              type="text" 
              name="telegram_testimoni_channel_id" 
              placeholder="-100123456789"
              defaultValue={config['telegram_testimoni_channel_id'] || ''} 
              className="w-full px-4 py-2 border dark:border-gray-700 bg-transparent dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Leave empty to disable auto-posting testimonials.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Orders Per Minute (Rate Limiter)</label>
            <input 
              type="number" 
              name="max_orders_per_minute" 
              defaultValue={config['max_orders_per_minute'] || '30'} 
              className="w-full px-4 py-2 border dark:border-gray-700 bg-transparent dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" 
            />
          </div>
        </section>

        {/* Danger Zone */}
        <section className="space-y-4 pt-4 border-t border-red-100 dark:border-red-900/30">
          <h2 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <ShieldAlert size={20} /> Danger Zone
          </h2>
          
          <div className="p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-4">
            <input 
              type="checkbox" 
              name="maintenance_mode" 
              id="maintenance" 
              defaultChecked={config['maintenance_mode'] === 'true'} 
              className="mt-1 h-4 w-4 text-orange-600 rounded border-orange-300 dark:border-orange-600 focus:ring-orange-500" 
            />
            <div>
              <label htmlFor="maintenance" className="font-semibold text-orange-800 dark:text-orange-400">Maintenance Mode</label>
              <p className="text-sm text-orange-700 dark:text-orange-300">Display "Under Maintenance" to all public visitors. Admin dashboard remains accessible.</p>
            </div>
          </div>

          <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-4">
            <input 
              type="checkbox" 
              name="kill_switch_active" 
              id="killswitch" 
              defaultChecked={config['kill_switch_active'] === 'true'} 
              className="mt-1 h-4 w-4 text-red-600 rounded border-red-300 dark:border-red-600 focus:ring-red-500" 
            />
            <div>
              <label htmlFor="killswitch" className="font-semibold text-red-800 dark:text-red-400">Emergency Kill Switch</label>
              <p className="text-sm text-red-700 dark:text-red-300">Instantly paralyze ALL checkout APIs and automated fulfillment webhooks to prevent large-scale exploits. Use during active attacks.</p>
            </div>
          </div>
        </section>

        <div className="flex justify-end pt-4">
          <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Save size={20} /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}
