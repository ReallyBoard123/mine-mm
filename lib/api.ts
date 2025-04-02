// lib/api.ts
export interface DataUpload {
    contained_measurement_fragments: string[] | null;
    created_by: string;
    data_type: string;
    date_created: string;
    date_modified: string;
    error_message: string | null;
    group_uuid: string;
    has_error: boolean;
    processing_finished: boolean;
    upload_file_name: string;
    upload_persisted: boolean;
    upload_size_mb: number;
    upload_target_name: string | null;
    upload_target_type: string | null;
    upload_target_uuid: string | null;
    uuid: string;
  }
  
  export interface ConsolidatedMeasurement {
    creation_date: string; // the field names in the actual response
    start: string;
    end: string;
    duration: string;
    type: string;
    uuid: string;
  }
  
  export interface ApiResponse {
    items: DataUpload[] | ConsolidatedMeasurement[];
    totalItems: number;
  }
  
  export async function fetchDataUploads(): Promise<ApiResponse> {
    // Use our internal API route instead of calling the external API directly
    const url = '/api/data-uploads';
    
    const response = await fetch(url, {
      cache: 'no-store' // Disable caching for this request
    });
  
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
  
    return await response.json();
  }
  
  export async function fetchConsolidatedMeasurements(): Promise<any> {
    // Use our internal API route instead of calling the external API directly
    const url = '/api/consolidated-measurements';
    
    const response = await fetch(url, {
      method: 'GET', // our internal route uses GET, but it will make a PUT request to the actual API
      cache: 'no-store' // Disable caching for this request
    });
  
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
  
    return await response.json();
  }