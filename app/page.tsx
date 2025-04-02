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
import { DataUpload } from "@/lib/api";
import { RefreshCw } from "lucide-react";
import useDataStore from "@/lib/store";
import { ConsolidatedMeasurements } from "@/components/ConsolidatedMeasurements";

type DataType = "uploads" | "measurements";

export default function Home() {
  const [dataType, setDataType] = useState<DataType>("uploads");
  const { 
    uploadsData, 
    loading, 
    error, 
    fetchUploads,
    lastUploadsUpdate
  } = useDataStore();

  // Format last update time
  const lastUpdate = lastUploadsUpdate ? 
    new Date(lastUploadsUpdate).toLocaleString([], {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }) : 'Never';

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
      
      {dataType === "uploads" && (
        <>
          <div className="flex justify-between items-center mb-6">
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdate}
            </div>
            <Button 
              onClick={fetchUploads} 
              disabled={loading}
              className="flex items-center gap-1"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? "Loading..." : "Refresh Data"}
            </Button>
          </div>
          
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
              <p>{error}</p>
            </div>
          )}
          
          {uploadsData && (
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
        </>
      )}
      
      {dataType === "measurements" && (
        <ConsolidatedMeasurements />
      )}
    </main>
  );
}