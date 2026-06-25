'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CariPesanan() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);
    const [orderId, setOrderId] = useState('');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const res = await fetch('/api/recovery/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, email })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Gagal meminta OTP');
            
            setSuccessMsg('Kode OTP telah dikirim ke email Anda. Silakan cek Inbox atau folder Spam.');
            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/recovery/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, email, code: otp })
            });
            const data = await res.json();
            
            if (!res.ok) throw new Error(data.error || 'Gagal memverifikasi OTP');
            
            router.push(data.redirectUrl || `/order/${orderId}`);
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Cari Pesanan</h1>
                    <p className="text-gray-500 mt-2 text-sm">
                        Pulihkan akses ke Dashboard Pesanan Anda jika Anda kehilangan tautan atau menggunakan perangkat baru.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100">
                        {error}
                    </div>
                )}
                
                {successMsg && (
                    <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-100">
                        {successMsg}
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleRequestOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">ID Pesanan (Invoice)</label>
                            <input
                                type="text"
                                required
                                value={orderId}
                                onChange={e => setOrderId(e.target.value)}
                                placeholder="Contoh: 123e4567-e89b-12d3-a456-426614174000"
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email saat melakukan pembelian"
                                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Memproses...' : 'Kirim Kode OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Kode OTP</label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                placeholder="Masukkan 6 digit kode OTP"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-center text-xl tracking-widest font-mono"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Memverifikasi...' : 'Verifikasi & Buka Pesanan'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            Kembali
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
