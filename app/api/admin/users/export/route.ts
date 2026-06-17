import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await db.execute(`
      SELECT
          u.email,
          q.first_name,
          q.last_name,
          q.phone,
          u.created_at AS sign_up_date,
          q.address,
          q.post_code
      FROM
          users u
      LEFT JOIN
          (
              SELECT
                  user_id,
                  first_name,
                  last_name,
                  phone,
                  address,
                  post_code,
                  created_at,
                  ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY created_at DESC) as rn
              FROM
                  quotes
              WHERE
                  first_name IS NOT NULL AND last_name IS NOT NULL
          ) q ON u.user_id::text = q.user_id AND q.rn = 1
      WHERE
          u.email_verified_at IS NOT NULL;
    `);

    const allUsers = result as unknown as {
      email: string;
      first_name: string | null;
      last_name: string | null;
      phone: string | null;
      sign_up_date: string;
      address: string | null;
      post_code: string | null;
    }[];

    const formattedRows = allUsers.map(user => {
      const address = [user.address, user.post_code].filter(Boolean).join(', ');
      return [
        user.email,
        user.first_name || '',
        user.last_name || '',
        user.phone || '',
        user.sign_up_date ? new Date(user.sign_up_date).toISOString() : '',
        address
      ];
    });

    const csvContent = [
      ['email', 'first name', 'last name', 'phone number', 'sign up date', 'address including post code'].join(','),
      ...formattedRows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="users.csv"'
      }
    });
  } catch (error) {
    console.error('Error exporting users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}