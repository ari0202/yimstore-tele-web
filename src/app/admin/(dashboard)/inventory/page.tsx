'use client';

import { useState, useEffect } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// We use a separate client side instance because we'll call an API route to do the secure upload
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function BulkUploadPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [credentialsText, setCredentialsText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<{ type: 'idle' | 'success' | 'error', message: string }>({ type: 'idle', message: '' });

  useEffect(() => {
    supabase.from('products').select('id, name, is_archived')
      .order('name')
      .then(({ data }) => setProducts(data || []));
  }, []);

  async function handleBulkUpload() {
    if (!selectedProduct || !credentialsText.trim()) return;

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
            product_id: selectedProduct,
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
        <h1 className="text-2xl font-bold text-gray-900">Bulk Inventory Upload</h1>
        <p className="text-gray-500 mt-2">Format: 1 credential (email:password / link) per baris.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Target Product</label>
          <select 
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            disabled={isUploading}
          >
            <option value="">-- Select Product --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.is_archived ? '(Archived)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Credentials (Satu per baris)</label>
          <textarea 
            value={credentialsText}
            onChange={(e) => setCredentialsText(e.target.value)}
            rows={15}
            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
            placeholder="user1@email.com:pass123&#10;user2@email.com:pass456&#10;https://invite.canva.com/xxx"
            disabled={isUploading}
          />
        </div>

        {status.type !== 'idle' && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{status.message}</span>
          </div>
        )}

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-blue-700">
              <span>Uploading...</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button 
            onClick={handleBulkUpload}
            disabled={!selectedProduct || !credentialsText.trim() || isUploading}
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
            {isUploading ? 'Processing...' : 'Upload Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
