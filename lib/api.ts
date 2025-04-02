// lib/api.ts

export interface ApiResponse {
  items: any[];
  totalItems: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface DataUpload {
  uuid: string;
  upload_file_name: string;
  created_by: string;
  upload_size_mb: number;
  date_created: string;
  processing_finished: boolean;
  has_error: boolean;
  contained_measurement_fragments?: string[];
}

export interface ConsolidatedMeasurement {
  uuid: string;
  date_created: string;
  measurement_start: string;
  measurement_end: string;
  duration_sec: number;
  imu_set?: string;
  processing_finished: boolean;
  has_error: boolean;
}

// API fetch functions
export async function fetchDataUploads(): Promise<ApiResponse> {
  // Replace with your actual API endpoint
  const response = await fetch('/api/data-uploads');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch data uploads: ${response.statusText}`);
  }
  
  return await response.json();
}

export async function fetchConsolidatedMeasurements(): Promise<ApiResponse> {
  // Replace with your actual API endpoint
  const response = await fetch('/api/consolidated-measurements');
  
  if (!response.ok) {
    throw new Error(`Failed to fetch consolidated measurements: ${response.statusText}`);
  }
  
  return await response.json();
}