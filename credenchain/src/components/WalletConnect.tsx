"use client";

import { useState, useEffect } from "react";
import { requestAccess, isConnected } from "@stellar/freighter-api";

export default function WalletConnect() {
    const [pubKey, setPubKey] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            const connected = await isConnected();
            if (connected) {
                const access = await requestAccess();
                if (access && !access.error) {
                    setPubKey(access.address);
                }
            }
        } catch (err) {
            console.error("Cüzdan bağlantısı kontrol edilirken hata oluştu:", err);
        }
    };

    const connectWallet = async () => {
        setError(null);
        setIsConnecting(true);

        try {
            const installed = await isConnected();
            if (!installed) {
                setError("Freighter cüzdanı bulunamadı. Lütfen tarayıcı eklentisini kurun.");
                return;
            }

            const access = await requestAccess();

            if (access.error) {
                setError(access.error);
                return;
            }

            setPubKey(access.address);
        } catch (err) {
            console.error("Bağlantı reddedildi veya hata oluştu:", err);
            setError("Cüzdan bağlantısı başarısız oldu.");
        } finally {
            setIsConnecting(false);
        }
    };

    const formatAddress = (address: string) => {
        return `${address.slice(0, 4)}...${address.slice(-4)}`;
    };

    return (
        <div className="flex flex-col items-center gap-3 w-full">
            {pubKey ? (
                <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-green-500/10 dark:bg-green-500/15 text-green-700 dark:text-green-400 rounded-full font-semibold text-sm border border-green-500/20 dark:border-green-500/30 shadow-sm backdrop-blur-sm transition-all hover:bg-green-500/20">
                    <div className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </div>
                    Bağlı Cüzdan: {formatAddress(pubKey)}
                </div>
            ) : (
                <button
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="relative inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white transition-all duration-300 bg-gray-900 border border-transparent rounded-full shadow-lg sm:w-auto hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 dark:focus:ring-white dark:focus:ring-offset-gray-900 disabled:opacity-70 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:-translate-y-0.5"
                >
                    {isConnecting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Bağlanıyor...
                        </>
                    ) : (
                        "Freighter Cüzdanını Bağla"
                    )}
                </button>
            )}

            {error && (
                <div className="text-red-500 dark:text-red-400 text-sm mt-2 px-4 py-2 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                    {error}
                </div>
            )}
        </div>
    );
}