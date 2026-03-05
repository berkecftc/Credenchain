"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import * as StellarSdk from "@stellar/stellar-sdk";

export default function VerifyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const [certData, setCertData] = useState<any>(null);
    const [onChainOwner, setOnChainOwner] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            verifyCertificate(id);
        }
    }, [id]);

    const verifyCertificate = async (certificateId: string) => {
        try {
            setLoading(true);
            setError(null);

            // 1. Veritabanı Kontrolü
            const res = await fetch(`/api/verify/${certificateId}`);
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "Sertifika kaydı bulunamadı.");
            }
            const data = await res.json();
            setCertData(data);

            // 2. Blockchain (On-chain) Doğrulaması
            const rpcUrl = "https://soroban-testnet.stellar.org:443";
            const server = new StellarSdk.rpc.Server(rpcUrl);
            const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID;

            if (!contractId) {
                console.warn("NEXT_PUBLIC_CONTRACT_ID is not defined.");
                return;
            }

            const contract = new StellarSdk.Contract(contractId);

            // Simülasyon için işlem objesi oluşturmamız gerekiyor.
            // Ağdan hesap çekmek yerine (getAccount), sadece geçerli bir Account objesi oluşturuyoruz.
            const tempAccount = new StellarSdk.Account(data.recipient_wallet, "0");

            const tx = new StellarSdk.TransactionBuilder(tempAccount, {
                networkPassphrase: StellarSdk.Networks.TESTNET,
                fee: "100"
            })
                .addOperation(contract.call("verify_certificate", StellarSdk.nativeToScVal(certificateId, { type: "string" })))
                .setTimeout(30)
                .build();

            const simulation = await server.simulateTransaction(tx);

            if (StellarSdk.rpc.Api.isSimulationSuccess(simulation)) {
                const resultScVal = simulation.result!.retval;
                const ownerAddress = StellarSdk.scValToNative(resultScVal);
                setOnChainOwner(ownerAddress.toString());
            } else {
                console.warn("Blockchain simülasyonu başarısız oldu veya sertifika bulunamadı.");
            }
        } catch (err: any) {
            console.error("Doğrulama hatası:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Kriptografik kanıtlar taranıyor...</p>
                </div>
            </div>
        );
    }

    if (error || !certData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl text-center">
                    <div className="text-5xl mb-4 text-red-500">⚠️</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Hata Oluştu</h1>
                    <p className="text-gray-600 mb-6">{error || "Sertifika bulunamadı."}</p>
                    <Link
                        href="/"
                        className="bg-gray-900 text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-all inline-block shadow-lg active:scale-95"
                    >
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        );
    }

    const isVerified = onChainOwner === certData.recipient_wallet;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            {/* Navigasyon */}
            <div className="w-full max-w-2xl mb-6">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-gray-500 hover:text-indigo-600 transition-all font-bold text-sm bg-white px-5 py-2.5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Ana Sayfaya Dön
                </Link>
            </div>

            <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className={`p-8 text-center ${isVerified ? 'bg-green-600' : 'bg-red-600'} text-white transition-colors duration-500`}>
                    <div className="text-5xl mb-4 animate-bounce">{isVerified ? "✅" : "❌"}</div>
                    <h1 className="text-2xl font-bold uppercase tracking-widest">
                        {isVerified ? "Sertifika Doğrulandı" : "Doğrulama Başarısız"}
                    </h1>
                    <p className="opacity-80 text-sm mt-2">Stellar Soroban Network aracılığıyla onaylandı.</p>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-2xl">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mb-1">Sertifika Adı</p>
                            <p className="text-lg font-bold text-gray-800">{certData.title}</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-2xl">
                            <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mb-1">Veren Kurum</p>
                            <p className="text-lg font-bold text-gray-800">{certData.issuer_name}</p>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-tighter mb-1">Sertifika Sahibi</p>
                        <p className="text-xl font-bold text-gray-900">{certData.recipient_name}</p>
                        <p className="text-xs font-mono text-gray-500 truncate mt-1 bg-gray-100 p-2 rounded-md">{certData.recipient_wallet}</p>
                    </div>

                    {isVerified ? (
                        <div className="bg-green-50 p-5 rounded-2xl border border-green-100 flex items-start gap-4 shadow-sm">
                            <span className="text-2xl">🛡️</span>
                            <div>
                                <p className="text-sm font-bold text-green-800">On-chain Kanıtı Mevcut</p>
                                <p className="text-xs text-green-700 leading-relaxed">
                                    Bu sertifika kaydı Stellar blockchain üzerinde doğrudan cüzdan adresine bağlıdır ve veritabanı kayıtları ile eşleşmektedir.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-100 flex items-start gap-4 shadow-sm">
                            <span className="text-2xl">⚠️</span>
                            <div>
                                <p className="text-sm font-bold text-red-800">Doğrulama Uyarısı</p>
                                <p className="text-xs text-red-700 leading-relaxed">
                                    Sertifika veritabanında mevcut ancak blockchain üzerindeki sahibi ile bir eşleşme sağlanamadı.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 flex flex-col sm:flex-row justify-between items-center border-t border-gray-100 gap-4">
                        <a
                            href={`https://stellar.expert/explorer/testnet/tx/${certData.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm font-bold hover:underline bg-blue-50 px-4 py-2 rounded-xl transition-all"
                        >
                            İşlem Kaydını İncele (Explorer) ↗
                        </a>
                        <div className="text-right">
                            <p className="text-[9px] text-gray-300 font-mono uppercase">Reference ID</p>
                            <span className="text-[11px] text-gray-400 font-mono">{certData.id}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}