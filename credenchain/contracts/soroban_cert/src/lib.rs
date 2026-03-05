// İşletim sistemi olmayan (Sanal Makine) bir ortamda çalışacağımız için
// Rust'ın standart kütüphanesini (std) devre dışı bırakıyoruz.
#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env, String};

#[contract]
pub struct CredenchainContract;

#[contractimpl]
impl CredenchainContract {
    /// Yeni bir sertifikayı blockchain'e yazar (Issue)
    /// cert_id: Veritabanımızdaki UUID
    /// recipient: Alıcının Stellar cüzdan adresi (G...)
    pub fn issue_certificate(env: Env, cert_id: String, recipient: Address) {
        // 1. Fail-Fast (Hızlı Hata): Bu sertifika ID'si daha önce kaydedilmiş mi?
        // Çift harcamayı (Double-entry) engellemek güvenlik açısından kritiktir.
        if env.storage().persistent().has(&cert_id) {
            panic!("Bu sertifika zaten blockchain üzerinde mevcut!");
        }

        // 2. State Management: Veriyi kalıcı hafızaya (Persistent Storage) yaz.
        // Soroban'da 3 tip storage vardır (Temporary, Persistent, Instance).
        // Sertifikalar sonsuza kadar kalmalı, bu yüzden 'persistent' kullanıyoruz.
        env.storage().persistent().set(&cert_id, &recipient);
    }

    /// Blockchain üzerinden sertifikanın gerçekliğini doğrular (Verify)
    pub fn verify_certificate(env: Env, cert_id: String) -> Address {
        // Eğer sertifika yoksa kontrat panic (hata) fırlatır.
        env.storage()
            .persistent()
            .get(&cert_id)
            .expect("Sertifika blockchain uzerinde bulunamadi!")
    }
}