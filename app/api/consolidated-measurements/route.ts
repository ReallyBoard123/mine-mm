// app/api/consolidated-measurements/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const groupUuid = process.env.GROUP_UUID;
    const authToken = process.env.API_AUTH_TOKEN;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    
    const url = `${apiUrl}/data_store/${groupUuid}/consolidated_measurements?skip=0&limit=50&column=date_created&direction=desc&maintenance_mode=false&language=en`;
    
    // Key difference: Using PUT instead of GET
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'accept-encoding': 'gzip, deflate, br, zstd',
        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
        'authorization': `Bearer ${authToken}`,
        'content-type': 'application/json',
        'content-length': '2',
        'cookie': 'lng=en',
        'origin': 'https://mpi.motionminers.com',
        'referer': 'https://mpi.motionminers.com/insights/data-store/consolidated-measurements',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36'
      },
      // Include empty JSON body as shown in the request
      body: '{}',
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
    console.error('Error fetching consolidated measurements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consolidated measurements' },
      { status: 500 }
    );
  }
}