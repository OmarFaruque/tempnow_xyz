import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { settings } from '@/lib/schema';
import { eq } from 'drizzle-orm';



interface StoredToken {
  access_token: string;
  datetime: string; // ISO 8601 date string
}

interface MotApiConfig {
  mot_client_id?: string;
  mot_client_secret?: string;
  mot_scope_url?: string;
  mot_token_url?: string;
}

async function getMotAccessToken(motApiConfig?: MotApiConfig): Promise<string> {
  // 1. Check for an existing, valid token in the database
  const tokenRecord = await db.query.settings.findFirst({
    where: eq(settings.param, 'mot_token'),
  });

  if (tokenRecord?.value) {
    const storedToken: StoredToken = JSON.parse(tokenRecord.value);
    const storedTime = new Date(storedToken.datetime);
    const now = new Date();
    const minutesDiff = (now.getTime() - storedTime.getTime()) / (1000 * 60);

    // If token is still valid (less than 58 minutes old), return it
    if (minutesDiff < 58) {
      return storedToken.access_token;
    }
  }

  // 2. If no valid token, request a new one
  const MOT_CLIENT_ID = motApiConfig?.mot_client_id || process.env.MOT_CLIENT_ID;
  const MOT_CLIENT_SECRET = motApiConfig?.mot_client_secret || process.env.MOT_CLIENT_SECRET;
  const MOT_SCOPE_URL = motApiConfig?.mot_scope_url || process.env.MOT_SCOPE_URL;
  const MOT_TOKEN_URL = motApiConfig?.mot_token_url || process.env.MOT_TOKEN_URL;

  if (!MOT_CLIENT_ID || !MOT_CLIENT_SECRET || !MOT_SCOPE_URL || !MOT_TOKEN_URL) {
    throw new Error('Missing MOT client credentials in settings (motApi) or environment variables.');
  }

  const response = await fetch(MOT_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: MOT_CLIENT_ID,
      client_secret: MOT_CLIENT_SECRET,
      scope: MOT_SCOPE_URL,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to retrieve MOT access token:", errorBody);
    throw new Error('Failed to retrieve access token from MOT service.');
  }

  const tokenData = await response.json();
  const accessToken = tokenData.access_token;

  // 3. Store the new token and timestamp in the database
  const newTokenToStore: StoredToken = {
    access_token: accessToken,
    datetime: new Date().toISOString(),
  };

  await db
    .insert(settings)
    .values({ param: 'mot_token', value: JSON.stringify(newTokenToStore) })
    .onConflictDoUpdate({
      target: settings.param,
      set: { value: JSON.stringify(newTokenToStore) },
    });

  return accessToken;
}

interface CarDetails {
  registration?: string;
  make?: string;
  model?: string;
  engineCapacity?: string | number | null;
  year?: string | number | 'Unknown';
  color?: string;
  provider?: string;
}

async function fetchFromMot(cleanReg: string, apiKey?: string, motApiConfig?: MotApiConfig): Promise<CarDetails | null> {
  try {
    const resolvedApiKey = apiKey || process.env.MOT_API_KEY;
    if (!resolvedApiKey) {
      console.warn('MOT_API_KEY is not configured');
      return null;
    }

    const accessToken = await getMotAccessToken(motApiConfig);
    const apiUrl = `https://history.mot.api.gov.uk/v1/trade/vehicles/registration/${encodeURIComponent(cleanReg)}`;

    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': resolvedApiKey,
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.warn('MOT API responded with non-ok:', errorData);
      return null;
    }

    const data = await apiResponse.json().catch(() => null);
    if (!data || !data.registration) return null;

    return {
      registration: data.registration,
      make: data.make,
      model: data.model,
      engineCapacity: data.engineSize,
      year: data.yearOfManufacture || 'Unknown',
      color: data.primaryColour,
      provider: 'mot',
    };
  } catch (err) {
    console.error('Error fetching from MOT:', err);
    return null;
  }
}

async function fetchFromDayinsure(cleanReg: string): Promise<CarDetails | null> {
  try {
    const apiUrl = `https://web-api.dayinsure.com/api/v1/vehicle/${cleanReg}`;
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.warn('Dayinsure API responded with non-ok:', errorData);
      return null;
    }

    const data = await apiResponse.json().catch(() => null);
    const vehicleDetail = data?.detail;
    if (!vehicleDetail || !vehicleDetail.registration) return null;

    return {
      registration: vehicleDetail.registration,
      make: vehicleDetail.make,
      model: vehicleDetail.model,
      engineCapacity: vehicleDetail.engineSize,
      year: vehicleDetail.year || 'Unknown',
      color: vehicleDetail.colour,
      provider: 'dayinsure',
    };
  } catch (err) {
    console.error('Error fetching from Dayinsure:', err);
    return null;
  }
}

async function fetchFromCheckCarDetails(cleanReg: string, apiKey?: string): Promise<CarDetails | null> {
  try {
    const resolvedApiKey = apiKey || process.env.CHECK_CAR_DETAILS_API_KEY;
    if (!resolvedApiKey) {
      console.warn('check_car_details_api_key is not configured');
      return null;
    }

    const apiUrl = `https://api.checkcardetails.co.uk/vehicledata/vehicleregistration?apikey=${encodeURIComponent(resolvedApiKey)}&vrm=${encodeURIComponent(cleanReg)}`;
    const apiResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.warn('Check Car Details API responded with non-ok:', errorData);
      return null;
    }

    const data = await apiResponse.json().catch(() => null);
    if (!data || !data.registrationNumber) return null;

    return {
      registration: data.registrationNumber,
      make: data.make,
      model: data.model,
      engineCapacity: data.engineCapacity,
      year: data.yearOfManufacture || 'Unknown',
      color: data.colour,
      provider: 'ccd',
    };
  } catch (err) {
    console.error('Error fetching from Check Car Details:', err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const registration: string | undefined = body.registration;

    if (!registration || typeof registration !== 'string' || registration.trim() === '') {
      return NextResponse.json({ message: 'Vehicle registration is required.' }, { status: 400 });
    }

    const cleanReg = registration.trim().replace(/\s/g, '');

    const settingsFromDb = await db.query.settings.findFirst({
      where: eq(settings.param, 'general')
    });

    const motApiSettingsFromDb = await db.query.settings.findFirst({
      where: eq(settings.param, 'motApi')
    });

    const generalSettings = settingsFromDb?.value ? JSON.parse(settingsFromDb.value) : {};
    const motApiSettings = motApiSettingsFromDb?.value ? JSON.parse(motApiSettingsFromDb.value) : {};
    const apiProvider = generalSettings.carSearchApiProvider || 'dayinsure';

    const mot_api_key = motApiSettings.mot_api_key || generalSettings.mot_api_key;
    const ccd_api_key = motApiSettings.check_car_details_api_key || generalSettings.check_car_details_api_key;
    const motApiConfig: MotApiConfig = {
      mot_client_id: motApiSettings.mot_client_id || generalSettings.mot_client_id,
      mot_client_secret: motApiSettings.mot_client_secret || generalSettings.mot_client_secret,
      mot_scope_url: motApiSettings.mot_scope_url || generalSettings.mot_scope_url,
      mot_token_url: motApiSettings.mot_token_url || generalSettings.mot_token_url,
    };

    const allProviders = ['mot', 'dayinsure', 'ccd'];
    const orderedProviders = [apiProvider, ...allProviders.filter(p => p !== apiProvider)];

    let carDetails: CarDetails | null = null;

    for (const provider of orderedProviders) {
      if (provider === 'mot') {
        carDetails = await fetchFromMot(cleanReg, mot_api_key, motApiConfig);
      } else if (provider === 'dayinsure') {
        carDetails = await fetchFromDayinsure(cleanReg);
      } else if (provider === 'ccd') {
        carDetails = await fetchFromCheckCarDetails(cleanReg, ccd_api_key);
      } else {
        // Unknown provider - skip
        continue;
      }

      if (carDetails && carDetails.registration) {
        break; // found valid result
      }

      console.info(`Provider ${provider} returned no usable vehicle data, trying next.`);
    }

    if (!carDetails || !carDetails.registration) {
      return NextResponse.json({ message: 'Vehicle details not found from any provider.' }, { status: 404 });
    }

    return NextResponse.json(carDetails, { status: 200 });

  } catch (error) {
    console.error("Check-vehicle API error:", error);
    const errorMessage = error instanceof Error ? error.message : 'An internal server error occurred.';
    return NextResponse.json({ message: errorMessage }, { status: 500 });
  }
}