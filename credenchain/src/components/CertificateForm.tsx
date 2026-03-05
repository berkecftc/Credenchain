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
        <div className="w-full max-w-md mx-auto mt-8 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Yeni Sertifika Oluştur</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Input alanlarımız aynı şekilde kalıyor */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eğitim/Sertifika Adı</label>
                    <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400" placeholder="Örn: İleri Düzey React Eğitimi" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Veren Kurum (Issuer)</label>
                    <input type="text" name="issuerName" value={formData.issuerName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400" placeholder="Örn: Tech Academy" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alıcı Adı Soyadı</label>
                    <input type="text" name="recipientName" value={formData.recipientName} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-400" placeholder="Örn: Ali Yılmaz" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alıcı Cüzdan Adresi (G...)</label>
                    <input type="text" name="recipientWallet" value={formData.recipientWallet} onChange={handleChange} required maxLength={56} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm text-gray-900 placeholder-gray-400" placeholder="G..." />
                </div>

                <button type="submit" disabled={isLoading} className="w-full bg-gray-900 text-white font-medium py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
                    {isLoading ? "İşleniyor..." : "Sertifika Talebi Oluştur"}
                </button>

                {message && (
                    <div className={`p-3 rounded-lg text-sm font-medium break-all ${message.type === 'success' ? 'bg-green-100 text-green-800' : message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                        {message.text}
                    </div>
                )}
            </form>
        </div>
    );
}