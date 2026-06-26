import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { MessageSquareText } from 'lucide-react';
import TemplateForm from './TemplateForm';

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
          <TemplateForm key={tpl.id} tpl={tpl} updateTemplateAction={updateTemplate} />
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
