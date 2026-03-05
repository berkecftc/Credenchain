"use client";

import { useState, useEffect } from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";

// 1. TypeScript Interface (Clean Code: Tip Güvenliği)
interface Certificate {
    id: string;
    title: string;
    issuer_name: string;
    recipient_name: string;
    recipient_wallet: string;
    transaction_hash: string | null;
    status: "PENDING" | "COMPLETED";
    created_at: string;
}

export default function CertificateList() {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [wallet, setWallet] = useState<string | null>(null);

    // 2. Component Mount Olduğunda Cüzdanı ve Verileri Çek
    useEffect(() => {
        fetchUserCertificates();
    }, []);

    const fetchUserCertificates = async () => {
        try {
            setIsLoading(true);

            // Önce kullanıcının cüzdan adresini Freighter'dan alıyoruz
            const connected = await isConnected();
            if (!connected) {
                setError("Lütfen önce cüzdanınızı bağlayın.");
                setIsLoading(false);
                return;
            }

            const access = await requestAccess();
            if (access.error) {
                throw new Error("Cüzdan erişimi reddedildi.");
            }

            setWallet(access.address);

            // Daha önce yazdığımız kendi GET endpoint'imize istek atıyoruz
            const response = await fetch(`/api/certificates?wallet=${access.address}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Sertifikalar getirilemedi.");
            }

            setCertificates(data.data);
        } catch (err: any) {
            console.error("[FETCH_CERTS_ERROR]", err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="text-center py-8 text-gray-500 font-medium animate-pulse">Sertifikalarınız blockchain'den sorgulanıyor...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500 font-medium">{error}</div>;
    }

    return (
        <div className="w-full max-w-4xl mx-auto mt-12">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Sertifikalarım (Cüzdan Portföyü)</h2>

            {certificates.length === 0 ? (
                <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200 text-gray-500">
                    Bu cüzdan adresine tanımlı herhangi bir sertifika bulunamadı.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map((cert) => (
                        <div key={cert.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative overflow-hidden">

                            {/* Statü Rozeti (Badge) */}
                            <div className={`absolute top-0 right-0 px-4 py-1 text-xs font-bold rounded-bl-lg ${cert.status === 'COMPLETED' ? 'bg-green-500 text-white' : 'bg-yellow-400 text-yellow-900'
                                }`}>
                                {cert.status}
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mb-2 mt-2">{cert.title}</h3>
                            <p className="text-sm text-gray-600 mb-1"><span className="font-semibold text-gray-800">Veren Kurum:</span> {cert.issuer_name}</p>
                            <p className="text-sm text-gray-600 mb-4"><span className="font-semibold text-gray-800">Alıcı:</span> {cert.recipient_name}</p>

                            {/* Blockchain Doğrulama Linki */}
                            {cert.transaction_hash && (
                                <a
                                    href={`https://stellar.expert/explorer/testnet/tx/${cert.transaction_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-block mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1.5 rounded-md transition-colors"
                                >
                                    Blockchain Üzerinde Doğrula ↗
                                </a>
                            )}

                            <div className="mt-4 text-xs text-gray-400 font-mono">
                                ID: {cert.id.split('-')[0]}...
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}