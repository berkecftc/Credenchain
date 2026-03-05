import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false },
});

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Sadece gerekli alanları seçiyoruz (Data Privacy)
        const query = `
      SELECT id, title, issuer_name, recipient_name, recipient_wallet, transaction_hash, status, created_at
      FROM certificates
      WHERE id = $1;
    `;

        const result = await pool.query(query, [id]);

        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Sertifika bulunamadı.' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (error) {
        console.error('[API_VERIFY_GET] Hata:', error);
        return NextResponse.json({ error: 'Sorgulama sırasında hata oluştu.' }, { status: 500 });
    }
}