"use client";

import { useState } from "react";
import WalletConnect from "@/components/WalletConnect";
import CertificateForm from "@/components/CertificateForm";
import CertificateList from "@/components/CertificateList";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  return (
    <main className="min-h-screen relative overflow-hidden selection:bg-indigo-500/30">
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 relative z-10">
        <div className="flex flex-col items-center gap-12">

          {/* Hero Section */}
          <div className="w-full max-w-2xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm transition-all hover:scale-105 cursor-default">
              <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
              <span className="text-xs font-bold tracking-widest text-indigo-600 dark:text-indigo-400 uppercase">Powered by Stellar/Soroban</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-gray-900 dark:text-white">
                Creden<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-[gradient_3s_linear_infinite]">chain</span>
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed font-medium">
                Değiştirilemez ve kriptografik olarak doğrulanabilir dijital sertifikalar ile geleceği inşa edin.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <WalletConnect onAddressChange={(addr) => setWalletAddress(addr)} />
              {walletAddress && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold border border-green-500/20 animate-in fade-in slide-in-from-top-2">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Yönetici Paneli Aktif
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
            {/* Form Section */}
            <div className="lg:col-span-12 xl:col-span-5 order-2 lg:order-1 h-fit">
              <CertificateForm />
            </div>

            {/* List Section */}
            <div className="lg:col-span-12 xl:col-span-7 order-1 lg:order-2">
              <CertificateList walletAddress={walletAddress} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}