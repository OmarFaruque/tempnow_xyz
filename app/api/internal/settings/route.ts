import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/database';

export const revalidate = 60; // Revalidate the data at most every 60 seconds

export async function GET() {
  try {
    const generalSettings = await getSettings('general');
    if (!generalSettings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }
    return NextResponse.json(generalSettings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
