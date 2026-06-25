import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { Save, MessageSquareText } from 'lucide-react';

export default async function BotTemplatesPage() {
  const { data: templates } = await supabaseAdmin.from('bot_templates').select('*').order('name');

  async function updateTemplate(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const content = formData.get('content_html') as string;
    
    await supabaseAdmin.from('bot_templates')
      .update({ content_html: content, updated_at: new Date().toISOString() })
      .eq('id', id);
      
    revalidatePath('/admin/bot-templates');
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageSquareText className="text-blue-600" />
          Bot Message Templates
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage the automated messages sent by your Telegram bot.
          To add <b>Premium Emojis</b>, open your Telegram Bot, type <code>/admin_templates</code>, select the template, and edit it directly via Telegram!
        </p>
      </div>

      <div className="space-y-6">
        {templates?.map((tpl) => (
          <form key={tpl.id} action={updateTemplate} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <input type="hidden" name="id" value={tpl.id} />
            
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{tpl.name}</h2>
                <code className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">Key: {tpl.key}</code>
              </div>
              <p className="text-xs text-gray-400">Last updated: {new Date(tpl.updated_at).toLocaleString('id-ID')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HTML Message Content</label>
              <textarea 
                name="content_html" 
                defaultValue={tpl.content_html} 
                rows={8}
                className="w-full px-4 py-3 border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm leading-relaxed" 
              />
            </div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
              <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-3 rounded-lg text-sm text-blue-800 dark:text-blue-300 w-full sm:w-auto">
                <span className="font-semibold block mb-1">Supported Variables:</span>
                <code>{tpl.variables_hint || 'None'}</code>
              </div>
              
              <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0">
                <Save size={18} /> Save Template
              </button>
            </div>
          </form>
        ))}
        
        {(!templates || templates.length === 0) && (
          <div className="text-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No templates found in database.</p>
          </div>
        )}
      </div>
    </div>
  );
}
