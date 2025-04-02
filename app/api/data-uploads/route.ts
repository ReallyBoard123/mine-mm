// app/api/data-uploads/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const groupUuid = process.env.GROUP_UUID;
    const authToken = process.env.API_AUTH_TOKEN;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    const url = `${apiUrl}/data_store/${groupUuid}/data_source_uploads?skip=0&limit=50&column=date_created&direction=desc&maintenance_mode=false&language=en`;
    
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'authorization': `Bearer ${authToken}`,
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `API request failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}