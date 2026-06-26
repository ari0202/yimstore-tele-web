'use client';

import { Save, CheckCircle2 } from 'lucide-react';
import { useTransition, useState } from 'react';

export default function TemplateForm({ tpl, updateTemplateAction }: any) {
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
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4 relative">
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
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {isSuccess && (
            <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 size={16} /> Saved
            </span>
          )}
          <button 
            type="submit" 
            disabled={isPending}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 disabled:opacity-70"
          >
            <Save size={18} /> {isPending ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </form>
  );
}
