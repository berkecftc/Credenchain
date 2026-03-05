"use client";

import { useState } from "react";
import WalletConnect from "@/components/WalletConnect";
import CertificateForm from "@/components/CertificateForm";
import CertificateList from "@/components/CertificateList";

export default function Home() {
  // Cüzdan adresini en üst seviyede (Parent) tutuyoruz
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  return (
    <main className="min-h-screen flex flex-col items-center py-12 px-4 bg-gray-50 text-gray-900">
      <div className="max-w-4xl w-full flex flex-col items-center gap-8">

        {/* Header ve Cüzdan Bağlantısı */}
        <div className="w-full max-w-2xl bg-white p-8 rounded-xl shadow-lg text-center border border-gray-100">
          <h1 className="text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Credenchain
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Stellar ağı üzerinde, değiştirilemez ve kriptografik olarak doğrulanabilir yeni nesil dijital sertifikalar.
          </p>

          {/* Cüzdan bağlandığında adresi setWalletAddress ile yukarı çekiyoruz */}
          <WalletConnect onAddressChange={(addr) => setWalletAddress(addr)} />
        </div>

        {/* Sertifika Oluşturma Formu */}
        <CertificateForm />

        {/* Sertifika Listesi - Artık cüzdan adresini prop olarak alıyor */}
        <CertificateList walletAddress={walletAddress} />
      </div>
    </main>
  );
}