import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
    // 1. Evrensel Postgres Bağlantı Havuzu (Pool)
    const pool = new Pool({
        connectionString: process.env.POSTGRES_URL,
        // Bulut veritabanları (Supabase vb.) bağlantıyı şifrelemek için SSL'i zorunlu tutar
        ssl: { rejectUnauthorized: false },
    });

    try {
        // 2. Saf SQL sorgularını doğrudan havuz üzerinden çalıştırıyoruz
        await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          issuer_name VARCHAR(255) NOT NULL,
          recipient_name VARCHAR(255) NOT NULL,
          recipient_wallet VARCHAR(56) NOT NULL,
          transaction_hash VARCHAR(100) UNIQUE,
          status VARCHAR(20) DEFAULT 'PENDING',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_recipient_wallet ON certificates(recipient_wallet);
    `);

        return NextResponse.json({ message: 'Veritabanı tabloları başarıyla oluşturuldu!' }, { status: 200 });
    } catch (error) {
        console.error('[API_SETUP] Veritabanı oluşturma hatası:', error);
        return NextResponse.json({ error: 'Tablolar oluşturulamadı.' }, { status: 500 });
    } finally {
        // 3. Clean Code: İşlem bitince bağlantı havuzunu kapatıp Memory Leak'i önlüyoruz
        await pool.end();
    }
}