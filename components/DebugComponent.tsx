"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fetchDataUploads, fetchConsolidatedMeasurements } from "@/lib/api";
import { DataUpload, ConsolidatedMeasurement } from "@/lib/api";

export default function DebugComponent() {
  const [uploadsData, setUploadsData] = useState<DataUpload[] | null>(null);
  const [measurementsData, setMeasurementsData] = useState<ConsolidatedMeasurement[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relationshipFindings, setRelationshipFindings] = useState<string[]>([]);

  // Function to fetch and log data structures
  const fetchAndLogData = async () => {
    setLoading(true);
    setError(null);
    const findings: string[] = [];
    
    try {
      // Fetch uploads data
      const uploadsResponse = await fetchDataUploads();
      console.log("DATA UPLOADS RESPONSE STRUCTURE:", uploadsResponse);
      console.log("SAMPLE UPLOAD ITEM:", uploadsResponse.items[0]);
      setUploadsData(uploadsResponse.items as DataUpload[]);
      
      // Fetch consolidated measurements
      const measurementsResponse = await fetchConsolidatedMeasurements();
      console.log("CONSOLIDATED MEASUREMENTS RESPONSE STRUCTURE:", measurementsResponse);
      console.log("SAMPLE MEASUREMENT ITEM:", measurementsResponse.items[0]);
      setMeasurementsData(measurementsResponse.items as ConsolidatedMeasurement[]);
      
      // Try to identify relationships between uploads and measurements
      console.log("ANALYZING RELATIONSHIPS BETWEEN UPLOADS AND MEASUREMENTS:");
      findings.push("Analyzing relationships between uploads and measurements...");
      
      const uploads = uploadsResponse.items as DataUpload[];
      const measurements = measurementsResponse.items as ConsolidatedMeasurement[];
      
      // Check if uploads have contained_measurement_fragments
      const uploadsWithFragments = uploads.filter(u => 
        u.contained_measurement_fragments && 
        u.contained_measurement_fragments.length > 0
      );
      
      if (uploadsWithFragments.length > 0) {
        console.log(`${uploadsWithFragments.length} uploads have contained_measurement_fragments`);
        findings.push(`${uploadsWithFragments.length} uploads have contained_measurement_fragments`);
        
        // Sample a few uploads with fragments
        const sampleUpload = uploadsWithFragments[0];
        console.log("SAMPLE UPLOAD WITH FRAGMENTS:", sampleUpload);
        console.log("CONTAINED FRAGMENTS:", sampleUpload.contained_measurement_fragments);
        
        findings.push(`Sample upload file: ${sampleUpload.upload_file_name}`);
        findings.push(`Contains fragments: ${sampleUpload.contained_measurement_fragments?.join(", ")}`);
        
        // Check if these fragments match measurement UUIDs
        const matchingMeasurements = measurements.filter(m => 
          sampleUpload.contained_measurement_fragments?.includes(m.uuid)
        );
        
        console.log(`Found ${matchingMeasurements.length} measurements matching fragments from sample upload`);
        findings.push(`Found ${matchingMeasurements.length} measurements matching fragments from sample upload`);
        
        if (matchingMeasurements.length > 0) {
          console.log("MATCHING MEASUREMENT:", matchingMeasurements[0]);
          findings.push(`Matching measurement has UUID: ${matchingMeasurements[0].uuid}`);
          findings.push(`Matching measurement set: ${matchingMeasurements[0].imu_set}`);
        }
      } else {
        findings.push("No uploads with contained_measurement_fragments found");
      }
      
      // Check for relationships in the other direction
      // Look for measurements with missing_fragment_ids
      const measurementsWithMissingFragments = measurements.filter(m => 
        m.missing_fragment_ids && m.missing_fragment_ids.length > 0
      );
      
      if (measurementsWithMissingFragments.length > 0) {
        console.log(`${measurementsWithMissingFragments.length} measurements have missing_fragment_ids`);
        findings.push(`${measurementsWithMissingFragments.length} measurements have missing_fragment_ids`);
        
        const sampleMeasurement = measurementsWithMissingFragments[0];
        console.log("SAMPLE MEASUREMENT WITH MISSING FRAGMENTS:", sampleMeasurement);
        findings.push(`Sample measurement with missing fragments for set: ${sampleMeasurement.imu_set}`);
        findings.push(`Missing fragment IDs: ${sampleMeasurement.missing_fragment_ids}`);
      } else {
        findings.push("No measurements with missing_fragment_ids found");
      }
      
      // Check for sensor information in upload filenames
      const sensorRegex = /Sensor_(\d+)/i;
      const uploadsWithSensorInfo = uploads.filter(u => sensorRegex.test(u.upload_file_name));
      
      if (uploadsWithSensorInfo.length > 0) {
        console.log(`${uploadsWithSensorInfo.length} uploads have sensor information in the filename`);
        findings.push(`${uploadsWithSensorInfo.length} uploads have sensor information in the filename`);
        
        // Extract sensor numbers from a few uploads
        const sensorNumbers = uploadsWithSensorInfo.slice(0, 5).map(u => {
          const match = u.upload_file_name.match(sensorRegex);
          return match ? match[1] : "unknown";
        });
        
        console.log("SAMPLE SENSOR NUMBERS:", sensorNumbers);
        findings.push(`Sample sensor numbers: ${sensorNumbers.join(", ")}`);
      } else {
        findings.push("No uploads with sensor information in filename found");
      }
      
      // Conclusion
      if (uploadsWithFragments.length > 0) {
        findings.push("CONCLUSION: Uploads appear to have contained_measurement_fragments that reference measurement UUIDs. This is the key relationship between uploads and measurements.");
      } else {
        findings.push("CONCLUSION: Unable to definitively determine the relationship between uploads and measurements. Further investigation needed.");
      }
      
      setRelationshipFindings(findings);
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">API Response Debug Tool</h1>
      
      <div className="mb-4">
        <Button 
          onClick={fetchAndLogData}
          disabled={loading}
        >
          {loading ? "Loading..." : "Fetch and Log API Responses"}
        </Button>
        <p className="text-sm mt-2 text-muted-foreground">
          Please open your browser console (F12) to see the logged data structures.
        </p>
      </div>
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {relationshipFindings.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Relationship Analysis</h2>
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4">
            {relationshipFindings.map((finding, idx) => (
              <p key={idx} className="mb-1">{finding}</p>
            ))}
          </div>
        </div>
      )}
      
      {uploadsData && measurementsData && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Sample Data Upload ({uploadsData.length} total)</h2>
            <pre className="bg-gray-100 p-4 rounded-md text-xs max-h-60 overflow-auto">
              {JSON.stringify(uploadsData[0], null, 2)}
            </pre>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Sample Consolidated Measurement ({measurementsData.length} total)</h2>
            <pre className="bg-gray-100 p-4 rounded-md text-xs max-h-60 overflow-auto">
              {JSON.stringify(measurementsData[0], null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}