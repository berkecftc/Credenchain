import WalletConnect from "@/components/WalletConnect";
import CertificateForm from "@/components/CertificateForm";
import CertificateList from "@/components/CertificateList";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 md:p-12 relative overflow-hidden">
      {/* Abstract Background Elements */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-500/10 dark:bg-purple-500/20 rounded-full blur-[120px] pointer-events-none translate-y-1/2" />

      <div className="max-w-2xl w-full flex flex-col items-center gap-10 relative z-10 my-auto py-10">

        {/* Header ve Cüzdan Bağlantısı */}
        <div className="w-full bg-white/70 dark:bg-zinc-950/70 backdrop-blur-2xl p-8 sm:p-12 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.1)] border border-white/40 dark:border-white/10 text-center transition-all duration-300 hover:border-white/80 dark:hover:border-white/20">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-8 shadow-lg shadow-indigo-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 sm:w-10 sm:h-10 text-white">
              <path fillRule="evenodd" d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.735c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.97a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08zm3.094 8.016a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.225 2.226a.75.75 0 001.22-.086l3.695-5.184z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-4xl sm:text-[3.5rem] font-extrabold mb-6 leading-tight tracking-tight text-gray-900 dark:text-white">
            Credenchain
          </h1>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-10 max-w-lg mx-auto leading-relaxed">
            Stellar ağı üzerinde, değiştirilemez ve kriptografik olarak doğrulanabilir yeni nesil dijital sertifikalar.
          </p>
          <WalletConnect />
        </div>

        {/* Sertifika Oluşturma Formu */}
        <CertificateForm />
        <CertificateList />
      </div>
    </main>
  );
}