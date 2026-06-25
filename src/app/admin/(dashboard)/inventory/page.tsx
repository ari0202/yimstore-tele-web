'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// We use a separate client side instance because we'll call an API route to do the secure upload
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function BulkUploadPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [targetType, setTargetType] = useState<'product' | 'category'>('product');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [credentialsText, setCredentialsText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  useEffect(() => {
    supabase.from('products').select('id, name, is_archived, category_id, categories(name)')
      .order('name')
      .then(({ data }) => setProducts(data || []));

    supabase.from('categories').select('id, name')
      .order('name')
      .then(({ data }) => setCategories(data || []));
  }, []);

  // Simple product list with category prefix
  const hierarchicalProducts = products.map(p => ({
    ...p,
    displayName: `${p.categories?.name || 'Tanpa Kategori'} - ${p.name}`
  })).sort((a, b) => a.displayName.localeCompare(b.displayName));

  async function handleBulkUpload() {
    const target_id = targetType === 'product' ? selectedProduct : selectedCategory;
    if (!target_id || !credentialsText.trim()) return;

    setIsUploading(true);
    setStatus({ type: 'idle', message: 'Preparing chunks...' });
    setProgress(0);

    // Filter baris kosong
    const allCredentials = credentialsText.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const CHUNK_SIZE = 500;
    const totalChunks = Math.ceil(allCredentials.length / CHUNK_SIZE);
    let totalInserted = 0;

    for (let i = 0; i < totalChunks; i++) {
      const chunk = allCredentials.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      
      try {
        // Panggil Server Action API (Kirim token & request aman)
        const res = await fetch('/api/admin/inventory/bulk-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            target_id: target_id,
            target_type: targetType,
            credentials: chunk
          })
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        totalInserted += data.inserted_count;
        setProgress(Math.round(((i + 1) / totalChunks) * 100));

      } catch (err: any) {
        setStatus({ type: 'error', message: `Chunk ${i + 1} failed: ${err.message}. Stopped.` });
        setIsUploading(false);
        return; // Hentikan jika gagal di tengah jalan
      }
    }

    setStatus({ type: 'success', message: `Successfully uploaded ${totalInserted} credentials! (Duplicates/Hold skipped automatically)` });
    setCredentialsText('');
    setIsUploading(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Bulk Inventory Upload</h1>
        <p className="text-[var(--color-text-muted)] mt-2">Format: 1 credential (email:password / link) per baris.</p>
      </div>

      <div className="bg-[var(--color-surface-card)] p-6 rounded-xl border border-[var(--color-border-soft)] shadow-sm space-y-6">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
            <input type="radio" name="targetType" value="product" checked={targetType === 'product'} onChange={() => setTargetType('product')} />
            Produk Variasi (Isolated)
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
            <input type="radio" name="targetType" value="category" checked={targetType === 'category'} onChange={() => setTargetType('category')} />
            Kategori (Shared)
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Target {targetType === 'product' ? 'Product' : 'Category'}</label>
          {targetType === 'product' ? (
            <select 
              data-testid="product-select"
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none bg-[var(--color-surface-core)] text-[var(--color-text-primary)] transition-colors"
              disabled={isUploading}
            >
              <option value="">-- Select Product --</option>
              {hierarchicalProducts.map(p => (
                <option key={p.id} value={p.id}>
                  {p.displayName} {p.is_archived ? '(Archived)' : ''}
                </option>
              ))}
            </select>
          ) : (
            <select 
              data-testid="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-[var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none bg-[var(--color-surface-core)] text-[var(--color-text-primary)] transition-colors"
              disabled={isUploading}
            >
              <option value="">-- Select Category --</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Credentials (Satu per baris)</label>
          <textarea 
            data-testid="credentials-input"
            value={credentialsText}
            onChange={(e) => setCredentialsText(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 border border-[var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none font-mono text-sm bg-[var(--color-surface-core)] text-[var(--color-text-primary)] transition-colors resize-y"
            placeholder="user1@email.com:pass123&#10;user2@email.com:pass456&#10;https://invite.canva.com/xxx"
            disabled={isUploading}
          />
        </div>

        {status.type !== 'idle' && (
          <div data-testid="upload-status" className={`p-4 rounded-lg flex items-center gap-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{status.message}</span>
          </div>
        )}

        {isUploading && (
          <div data-testid="upload-progress" className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-[var(--color-action-primary)]">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-[var(--color-border-soft)] rounded-full h-2.5">
              <div className="bg-[var(--color-action-primary)] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button 
            data-testid="upload-button"
            onClick={handleBulkUpload}
            disabled={!(targetType === 'product' ? selectedProduct : selectedCategory) || !credentialsText.trim() || isUploading}
            className="w-full sm:w-auto bg-[var(--color-action-primary)] text-[var(--color-surface-card)] px-8 py-3 rounded-lg font-medium hover:bg-[var(--color-action-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
            {isUploading ? 'Processing...' : 'Upload Data'}
          </button>
        </div>
      </div>

    </div>
  );
}
