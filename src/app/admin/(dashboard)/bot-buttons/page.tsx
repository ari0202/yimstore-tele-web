import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { MousePointerClick } from 'lucide-react';
import ButtonForm from './ButtonForm';

export default async function BotButtonsPage() {
  const { data: buttons } = await supabaseAdmin
    .from('bot_templates')
    .select('*')
    .like('key', 'btn_%')
    .order('name');

  async function updateButton(formData: FormData) {
    'use server';
    const id = formData.get('id') as string;
    const content = formData.get('content_html') as string;
    
    await supabaseAdmin.from('bot_templates')
      .update({ content_html: content, updated_at: new Date().toISOString() })
      .eq('id', id);
      
    revalidatePath('/admin/bot-buttons');
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MousePointerClick className="text-blue-600" />
          Bot Menu Buttons
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Ubah teks dan emoji untuk tombol-tombol yang muncul di Telegram Bot. 
          <br/>
          <strong className="text-amber-600 dark:text-amber-500">Penting:</strong> Telegram API hanya mendukung <b>Emoji Standar (Unicode)</b> untuk tombol *Inline Keyboard*, bukan Emoji Premium (Custom Emoji). Jangan memasukkan kode HTML atau Custom Emoji ke dalam tombol.
        </p>
      </div>

      <div className="space-y-4">
        {buttons?.map((btn) => (
          <ButtonForm key={btn.id} tpl={btn} updateTemplateAction={updateButton} />
        ))}
        
        {(!buttons || buttons.length === 0) && (
          <div className="text-center p-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">Belum ada konfigurasi tombol ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );
}
