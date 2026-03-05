import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// 1. Singleton Database Pool
// Vercel gibi Serverless ortamlarda her istekte yeni bağlantı açmamak için 
// Pool nesnesini global scope'ta bir kez tanımlıyoruz.
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
});

// POST: Yeni sertifika talebi oluştur
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, issuerName, recipientName, recipientWallet } = body;

        // 2. Fail-Fast Validation
        if (!title || !issuerName || !recipientName || !recipientWallet) {
            return NextResponse.json({ error: 'Tüm alanlar zorunludur.' }, { status: 400 });
        }

        if (!recipientWallet.startsWith('G') || recipientWallet.length !== 56) {
            return NextResponse.json({ error: 'Geçersiz Stellar Public Key formatı.' }, { status: 400 });
        }

        // 3. Güvenli SQL Enjeksiyonu (Parameterized Queries)
        // Değerleri doğrudan string içine yazmak yerine $1, $2 gibi parametreler kullanıyoruz.
        // Bu, "SQL Injection" saldırılarını %100 engeller (OWASP Güvenlik Standardı).
        const query = `
      INSERT INTO certificates (title, issuer_name, recipient_name, recipient_wallet, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
      RETURNING *;
    `;
        const values = [title, issuerName, recipientName, recipientWallet];

        const result = await pool.query(query, values);

        return NextResponse.json(
            {
                message: 'Sertifika kaydı beklemede olarak oluşturuldu. Blockchain onayı bekleniyor.',
                data: result.rows[0]
            },
            { status: 201 }
        );

    } catch (error) {
        console.error('[API_CERTIFICATES_POST] Hata:', error);
        return NextResponse.json({ error: 'Sunucu tarafında bir hata oluştu.' }, { status: 500 });
    }
}

// GET: Cüzdan adresine göre sertifikaları getir
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const walletAddress = searchParams.get('wallet');

        if (!walletAddress) {
            return NextResponse.json({ error: 'Cüzdan adresi (wallet) parametresi gerekli.' }, { status: 400 });
        }

        // Performanslı Index Okuması
        const query = `
      SELECT * FROM certificates 
      WHERE recipient_wallet = $1 
      ORDER BY created_at DESC;
    `;
        const result = await pool.query(query, [walletAddress]);

        return NextResponse.json({ data: result.rows }, { status: 200 });
    } catch (error) {
        console.error('[API_CERTIFICATES_GET] Hata:', error);
        return NextResponse.json({ error: 'Veriler getirilirken hata oluştu.' }, { status: 500 });
    }
}

// PUT: Sertifika durumunu PENDING'den COMPLETED'a çek ve Tx Hash'i kaydet
export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, transactionHash } = body;

        // Fail-Fast: Eksik veri kontrolü
        if (!id || !transactionHash) {
            return NextResponse.json({ error: 'ID ve Transaction Hash zorunludur.' }, { status: 400 });
        }

        // Saf SQL ile performanslı ve güvenli (Parameterized) Update işlemi
        const query = `
     UPDATE certificates
     SET status = 'COMPLETED', transaction_hash = $1
     WHERE id = $2
     RETURNING *;
    `;

        const result = await pool.query(query, [transactionHash, id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Sertifika veritabanında bulunamadı.' }, { status: 404 });
        }

        return NextResponse.json(
            { message: 'Sertifika başarıyla COMPLETED statüsüne alındı.', data: result.rows[0] },
            { status: 200 }
        );

    } catch (error) {
        console.error('[API_CERTIFICATES_PUT] Hata:', error);
        return NextResponse.json({ error: 'Sunucu tarafında bir hata oluştu.' }, { status: 500 });
    }
}