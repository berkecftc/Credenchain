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
        <div className="w-full max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Sertifikalarım</h2>

            {isLoading ? (
                <p className="text-gray-500 animate-pulse">Yükleniyor...</p>
            ) : certificates.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-dashed text-gray-400">
                    Henüz bir sertifikanız bulunmuyor.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificates.map((cert) => (
                        <div key={cert.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative">
                            <span className={`absolute top-2 right-2 px-2 py-1 rounded text-[10px] font-bold ${cert.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                {cert.status}
                            </span>
                            <h3 className="font-bold text-gray-800">{cert.title}</h3>
                            <p className="text-xs text-gray-500">{cert.issuer_name}</p>
                            {cert.transaction_hash && (
                                <a
                                    href={`https://stellar.expert/explorer/testnet/tx/${cert.transaction_hash}`}
                                    target="_blank"
                                    className="text-xs text-blue-600 mt-2 inline-block hover:underline"
                                >
                                    Blockchain'de Gör ↗
                                </a>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}