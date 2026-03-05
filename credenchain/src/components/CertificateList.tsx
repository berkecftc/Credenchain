"use client";

import { useState, useEffect } from "react";

interface Certificate {
    id: string;
    title: string;
    issuer_name: string;
    recipient_name: string;
    status: "PENDING" | "COMPLETED";
    transaction_hash: string | null;
}

interface CertificateListProps {
    walletAddress: string | null;
}

export default function CertificateList({ walletAddress }: CertificateListProps) {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Cüzdan adresi her değiştiğinde (bağlandığında) listeyi yenile
    useEffect(() => {
        if (walletAddress) {
            fetchUserCertificates(walletAddress);
        } else {
            setCertificates([]);
        }
    }, [walletAddress]);

    const fetchUserCertificates = async (addr: string) => {
        try {
            setIsLoading(true);
            const response = await fetch(`/api/certificates?wallet=${addr}`);
            const data = await response.json();
            if (response.ok) {
                setCertificates(data.data);
            }
        } catch (err) {
            console.error("Sertifikalar yüklenemedi:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Cüzdan bağlı değilse listeyi hiç göstermiyoruz (UX Temizliği)
    if (!walletAddress) return null;

    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-4">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Sertifikalarım</h2>
                <div className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                    {certificates.length} Kayıt
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[1, 2].map((i) => (
                        <div key={i} className="h-48 rounded-[2rem] bg-gray-100 dark:bg-white/5 animate-pulse" />
                    ))}
                </div>
            ) : certificates.length === 0 ? (
                <div className="py-20 text-center bg-gray-50 dark:bg-white/2 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-white/10">
                    <div className="text-4xl mb-4">📜</div>
                    <p className="text-gray-400 dark:text-gray-500 font-medium italic">Henüz bir sertifikanız bulunmuyor.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map((cert) => (
                        <div key={cert.id} className="group relative bg-white dark:bg-zinc-950 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 hover:shadow-xl hover:shadow-indigo-500/5 transition-all hover:-translate-y-1">
                            <div className="flex flex-col h-full justify-between gap-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${cert.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600' : 'bg-yellow-500/10 text-yellow-600'
                                            }`}>
                                            {cert.status}
                                        </div>
                                        <div className="text-[10px] text-gray-300 dark:text-gray-600 font-mono">
                                            #{cert.id.slice(0, 8)}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-black text-gray-900 dark:text-white leading-tight group-hover:text-indigo-600 transition-colors">
                                            {cert.title}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{cert.issuer_name}</p>
                                    </div>
                                </div>

                                <div className="space-y-4 pt-4 border-t border-gray-50 dark:border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 flex items-center justify-center text-xs font-bold text-gray-500">
                                            {cert.recipient_name.slice(0, 1)}
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter leading-none">Alıcı</p>
                                            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{cert.recipient_name}</p>
                                        </div>
                                    </div>

                                    {cert.transaction_hash && (
                                        <div className="flex items-center gap-2 pt-2">
                                            <a
                                                href={`/verify/${cert.id}`}
                                                className="flex-1 text-center py-2.5 rounded-xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-100 transition-all hover:shadow-lg"
                                            >
                                                Doğrula 🛡️
                                            </a>
                                            <a
                                                href={`https://stellar.expert/explorer/testnet/tx/${cert.transaction_hash}`}
                                                target="_blank"
                                                className="px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                                                title="Explorer'da Gör"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}