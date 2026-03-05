"use client";

import { useState } from "react";
import { requestAccess, signTransaction } from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

export default function CertificateForm() {
    const [formData, setFormData] = useState({
        title: "",
        issuerName: "",
        recipientName: "",
        recipientWallet: "",
    });

    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage({ type: "info", text: "Adım 1/2: Veritabanına kaydediliyor..." });

        try {
            // 1. AŞAMA: Kendi BFF API'mize kaydedip UUID alıyoruz (Off-chain)
            const dbResponse = await fetch("/api/certificates", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const dbData = await dbResponse.json();

            if (!dbResponse.ok) {
                throw new Error(dbData.error || "Veritabanına kayıt başarısız oldu.");
            }

            const certificateId = dbData.data.id; // Postgres'in ürettiği UUID

            // 2. AŞAMA: Blockchain İşlemi (On-chain)
            setMessage({ type: "info", text: "Adım 2/2: Lütfen Freighter cüzdanından işlemi onaylayın..." });

            // Cüzdan bağlantısını alıyoruz (İşlemi kimin imzalayacağını belirlemek için)
            const access = await requestAccess();
            if (access.error) throw new Error("Cüzdan erişimi reddedildi veya Freighter bulunamadı.");
            const senderPublicKey = access.address;

            // Soroban RPC Sunucusu Bağlantısı
            const server = new StellarSdk.rpc.Server("https://soroban-testnet.stellar.org:443");
            const networkPassphrase = StellarSdk.Networks.TESTNET;
            const contractId = process.env.NEXT_PUBLIC_CONTRACT_ID;

            if (!contractId) throw new Error("Kontrat adresi (.env) bulunamadı!");

            // Göndericinin hesap bilgilerini çekiyoruz (Sequence number için gerekli)
            const sourceAccount = await server.getAccount(senderPublicKey);

            // Kontrat nesnesini oluşturuyoruz
            const contract = new StellarSdk.Contract(contractId);

            // Ham işlemi (Raw Transaction) inşa ediyoruz
            const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
                fee: "100", // Simülasyondan sonra gerçek ücretle güncellenecek
                networkPassphrase,
            })
                .addOperation(
                    contract.call(
                        "issue_certificate",
                        StellarSdk.nativeToScVal(certificateId, { type: "string" }), // UUID'yi akıllı kontrata uygun tipe çeviriyoruz
                        new StellarSdk.Address(formData.recipientWallet).toScVal()   // Cüzdan adresini tipe çeviriyoruz
                    )
                )
                .setTimeout(30)
                .build();

            // Soroban Mimarisi: İşlemi önce ağda simüle etmeliyiz ki Gas Fee ve kaynak kullanımı hesaplansın
            const simulatedTx = await server.simulateTransaction(tx);

            if (StellarSdk.rpc.Api.isSimulationError(simulatedTx)) {
                throw new Error("Akıllı kontrat simülasyonu başarısız: " + simulatedTx.error);
            }

            // Simülasyon verileriyle işlemi son haline (Assembled) getiriyoruz
            const assembledTx = StellarSdk.rpc.assembleTransaction(tx, simulatedTx).build();

            // Freighter üzerinden kullanıcıya imzalatıyoruz
            const signedXdr = await signTransaction(assembledTx.toXDR(), { networkPassphrase });
            if (signedXdr.error) throw new Error("İşlem kullanıcı tarafından reddedildi.");

            // İmzalı işlemi ağa fırlatıyoruz (Submit)
            const signedTx = StellarSdk.TransactionBuilder.fromXDR(signedXdr.signedTxXdr, networkPassphrase);
            const sendResult = await server.sendTransaction(signedTx);

            if (sendResult.status === "ERROR") {
                throw new Error("İşlem blockchain ağına gönderilirken reddedildi.");
            }
            // 3. AŞAMA: Veritabanını Güncelle (PENDING -> COMPLETED)
            // Blockchain onayı alındığı için artık veritabanımızı gönül rahatlığıyla güncelleyebiliriz.
            await fetch("/api/certificates", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: certificateId,
                    transactionHash: sendResult.hash
                })
            });

            // Başarı durumu
            setMessage({ type: "success", text: `Başarılı! Sertifika Blockchain'e kazındı. İşlem Hash: ${sendResult.hash}` });
            setFormData({ title: "", issuerName: "", recipientName: "", recipientWallet: "" });

        } catch (error) {
            console.error("[BLOCKCHAIN_TX_ERROR]", error);
            const errorMessage = error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu.";
            setMessage({ type: "error", text: errorMessage });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full bg-white dark:bg-zinc-950 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/10 transition-colors" />

            <div className="relative z-10 space-y-8">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Yeni Sertifika</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Blockchain üzerine kalıcı veri işleyin.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 ml-1">Eğitim/Sertifika Adı</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 transition-all font-medium"
                                placeholder="Örn: İleri Düzey React Eğitimi"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 ml-1">Veren Kurum</label>
                            <input
                                type="text"
                                name="issuerName"
                                value={formData.issuerName}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white placeholder-gray-400 Transition-all font-medium"
                                placeholder="Örn: Tech Academy"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 ml-1">Alıcı Adı Soyadı</label>
                            <input
                                type="text"
                                name="recipientName"
                                value={formData.recipientName}
                                onChange={handleChange}
                                required
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white placeholder-gray-400 transition-all font-medium"
                                placeholder="Örn: Ali Yılmaz"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 ml-1">Alıcı Cüzdan Adresi</label>
                            <input
                                type="text"
                                name="recipientWallet"
                                value={formData.recipientWallet}
                                onChange={handleChange}
                                required
                                maxLength={56}
                                className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500/20 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-xs transition-all tracking-wider"
                                placeholder="G..."
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full group/btn relative flex items-center justify-center py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg shadow-indigo-500/25 active:scale-[0.98] disabled:opacity-50"
                        >
                            <span className="relative flex items-center gap-2">
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        İsleniyor...
                                    </>
                                ) : (
                                    <>
                                        Yayınla & Kazı
                                        <svg className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </>
                                )}
                            </span>
                        </button>
                    </div>

                    {message && (
                        <div className={`p-4 rounded-2xl text-[11px] font-bold uppercase tracking-wider animate-in fade-in zoom-in-95 duration-300 ${message.type === 'success' ? 'bg-green-500/10 text-green-600 border border-green-500/20' :
                                message.type === 'error' ? 'bg-red-500/10 text-red-600 border border-red-500/20' :
                                    'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                            }`}>
                            <div className="flex items-start gap-2">
                                <span className="shrink-0 mt-0.5">{message.type === 'success' ? '✅' : message.type === 'error' ? '❌' : 'ℹ️'}</span>
                                <span className="break-all">{message.text}</span>
                            </div>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}