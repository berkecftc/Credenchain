"use client";

import { useState } from "react";
import { isConnected, requestAccess } from "@stellar/freighter-api";

interface WalletConnectProps {
    onAddressChange: (address: string | null) => void;
}

export default function WalletConnect({ onAddressChange }: WalletConnectProps) {
    const [internalAddress, setInternalAddress] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = async () => {
        try {
            setIsConnecting(true);
            const installed = await isConnected();
            if (!installed) {
                alert("Freighter cüzdanı bulunamadı. Lütfen tarayıcı eklentisini kurun.");
                return;
            }

            const access = await requestAccess();

            if (access && !access.error) {
                setInternalAddress(access.address);
                onAddressChange(access.address);
            }
        } catch (err) {
            console.error("Cüzdan bağlantısı başarısız:", err);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <div className="flex flex-col items-center">
            {internalAddress ? (
                <div className="group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative px-6 py-3 bg-white dark:bg-zinc-900 ring-1 ring-gray-900/5 dark:ring-white/10 rounded-2xl leading-none flex items-center justify-center space-x-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="text-gray-900 dark:text-gray-100 font-mono text-sm font-bold">
                                {internalAddress.slice(0, 6)}...{internalAddress.slice(-6)}
                            </span>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="group relative inline-flex items-center justify-center px-10 py-4 font-bold text-white transition-all duration-200 bg-gray-900 dark:bg-white dark:text-gray-900 font-pj rounded-2xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 dark:focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-95 shadow-xl hover:shadow-indigo-500/20"
                >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-indigo-500 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></span>
                    <span className="relative flex items-center gap-2">
                        {isConnecting ? (
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                        )}
                        {isConnecting ? "Bağlanıyor..." : "Cüzdanı Bağla"}
                    </span>
                </button>
            )}
        </div>
    );
}