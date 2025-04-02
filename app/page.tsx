"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  ApiResponse, 
  DataUpload, 
  ConsolidatedMeasurement, 
  fetchDataUploads, 
  fetchConsolidatedMeasurements 
} from "@/lib/api";

type DataType = "uploads" | "measurements";

export default function Home() {
  const [dataType, setDataType] = useState<DataType>("uploads");
  const [uploadsData, setUploadsData] = useState<ApiResponse | null>(null);
  const [measurementsData, setMeasurementsData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (dataType === "uploads") {
        const response = await fetchDataUploads();
        setUploadsData(response);
      } else {
        const response = await fetchConsolidatedMeasurements();
        setMeasurementsData(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Format date for better readability
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <main className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Motion Miners Data Explorer</h1>
      
      <div className="flex space-x-2 mb-6">
        <Button 
          variant={dataType === "uploads" ? "default" : "outline"} 
          onClick={() => setDataType("uploads")}
        >
          Data Uploads
        </Button>
        <Button 
          variant={dataType === "measurements" ? "default" : "outline"} 
          onClick={() => setDataType("measurements")}
        >
          Consolidated Measurements
        </Button>
      </div>
      
      <Button 
        onClick={handleFetchData} 
        disabled={loading}
        className="mb-6"
      >
        {loading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </>
        ) : `Fetch ${dataType === "uploads" ? "Data Uploads" : "Consolidated Measurements"}`}
      </Button>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
          <p>{error}</p>
        </div>
      )}
      
      {dataType === "uploads" && uploadsData && (
        <div className="rounded-md border">
          <Table>
            <TableCaption>Total Items: {uploadsData.totalItems}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead>Fragments</TableHead>
                <TableHead>Size (MB)</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(uploadsData.items as DataUpload[]).map((item) => (
                <TableRow key={item.uuid}>
                  <TableCell className="font-medium">{item.upload_file_name}</TableCell>
                  <TableCell>{item.created_by}</TableCell>
                  <TableCell>
                    {item.contained_measurement_fragments ? 
                      item.contained_measurement_fragments.join(", ") : 
                      "None"}
                  </TableCell>
                  <TableCell>{item.upload_size_mb.toFixed(2)}</TableCell>
                  <TableCell>{formatDate(item.date_created)}</TableCell>
                  <TableCell>
                    {item.has_error ? (
                      <span className="text-red-500">Error</span>
                    ) : item.processing_finished ? (
                      <span className="text-green-500">Completed</span>
                    ) : (
                      <span className="text-yellow-500">Processing</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {dataType === "measurements" && measurementsData && (
        <div className="rounded-md border">
          <Table>
            <TableCaption>Total Items: {measurementsData.totalItems || 0}</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Creation date</TableHead>
                <TableHead>Measurement start</TableHead>
                <TableHead>Measurement end</TableHead>
                <TableHead>Measurement duration</TableHead>
                <TableHead>Set name</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {measurementsData.items && Array.isArray(measurementsData.items) 
                ? measurementsData.items.map((item: any, index: number) => {
                    // Format duration to hours and minutes
                    const duration = item.duration_sec 
                      ? `${Math.floor(item.duration_sec / 3600)}:${String(Math.floor((item.duration_sec % 3600) / 60)).padStart(2, '0')} hrs` 
                      : '';
                    
                    // Format dates to be more readable
                    const creationDate = item.date_created ? new Date(item.date_created).toLocaleString([], {month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit'}) : '';
                    const startDate = item.measurement_start ? new Date(item.measurement_start).toLocaleString([], {month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit'}) : '';
                    const endDate = item.measurement_end ? new Date(item.measurement_end).toLocaleString([], {month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit'}) : '';
                    
                    return (
                      <TableRow key={item.uuid || index}>
                        <TableCell>{creationDate}</TableCell>
                        <TableCell>{startDate}</TableCell>
                        <TableCell>{endDate}</TableCell>
                        <TableCell>{duration}</TableCell>
                        <TableCell>{item.imu_set || ''}</TableCell>
                        <TableCell>
                          {item.has_error ? (
                            <span className="text-red-500">Error</span>
                          ) : item.processing_finished ? (
                            <span className="text-green-500">✓</span>
                          ) : (
                            <span className="text-yellow-500">Processing</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                : <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      No data available or unexpected data format
                    </TableCell>
                  </TableRow>
              }
            </TableBody>
          </Table>
        </div>
      )}
    </main>
  );
}