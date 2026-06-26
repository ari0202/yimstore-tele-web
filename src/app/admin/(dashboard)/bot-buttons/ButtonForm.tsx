'use client';

import { Save, CheckCircle2 } from 'lucide-react';
import { useTransition, useState } from 'react';

export default function ButtonForm({ tpl, updateTemplateAction }: any) {
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateTemplateAction(formData);
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-3 relative">
      <input type="hidden" name="id" value={tpl.id} />
      
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
        <div>
          <h2 className="text-md font-semibold text-gray-900 dark:text-gray-100">{tpl.name}</h2>
          <code className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded">Key: {tpl.key}</code>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input 
            type="text"
            name="content_html" 
            defaultValue={tpl.content_html} 
            placeholder="e.g. 🛍️ Beli Produk"
            className="w-full px-4 py-2 border dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
          />
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          {isSuccess && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 size={16} /> Tersimpan
            </span>
          )}
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-70 text-sm"
          >
            <Save size={16} /> {isPending ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </form>
  );
}
