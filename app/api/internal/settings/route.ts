import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/database';
import { normalizeMaintenanceSettings } from '@/lib/maintenance';

export const revalidate = 0;

export async function GET() {
  try {
    const generalSettings = await getSettings('general');
    const maintenanceSettings = normalizeMaintenanceSettings(await getSettings('maintenance'));

    if (!generalSettings) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...generalSettings,
      maintenance: maintenanceSettings,
    });
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
