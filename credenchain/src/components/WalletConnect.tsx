"use client";

import { useState } from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";

interface WalletConnectProps {
    onAddressChange: (address: string | null) => void;
}

export default function WalletConnect({ onAddressChange }: WalletConnectProps) {
    const [internalAddress, setInternalAddress] = useState<string | null>(null);

    const handleConnect = async () => {
        try {
            const installed = await isConnected();
            if (!installed) {
                alert("Freighter cüzdanı bulunamadı. Lütfen tarayıcı eklentisini kurun.");
                return;
            }

            // Sadece bu butona basıldığında pop-up açılır
            const access = await requestAccess();

            if (access && !access.error) {
                setInternalAddress(access.address);
                onAddressChange(access.address); // Parent bileşene adresi bildiriyoruz
            }
        } catch (err) {
            console.error("Cüzdan bağlantısı başarısız:", err);
        }
    };

    return (
        <div className="flex flex-col items-center">
            {internalAddress ? (
                <div className="px-6 py-2 bg-blue-50 text-blue-700 rounded-full font-mono text-sm border border-blue-200 shadow-sm">
                    Bağlı: {internalAddress.slice(0, 6)}...{internalAddress.slice(-6)}
                </div>
            ) : (
                <button
                    onClick={handleConnect}
                    className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-all shadow-md active:scale-95"
                >
                    Freighter Cüzdanını Bağla
                </button>
            )}
        </div>
    );
}