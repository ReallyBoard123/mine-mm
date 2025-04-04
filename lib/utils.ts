import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { ConsolidatedMeasurement, DataUpload } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to identify missing sensors for a measurement
const identifyMissingSensors = (
  measurement: ConsolidatedMeasurement,
  uploads: DataUpload[] | undefined
): { missing: string[], uploaded: string[] } => {
  if (!measurement || !measurement.imu_set || !uploads || uploads.length === 0) {
    return { missing: [], uploaded: [] };
  }
  
  const { imu_set: setName, group_uuid: groupUuid, missing_fragment_ids } = measurement;
  
  // Parse set name (e.g., "32-A")
  const [setNumber, setLetter] = setName.split('-');
  if (!setNumber || !setLetter) {
    return { missing: [], uploaded: [] };
  }
  
  // Map for set letters to base sensor numbers
  const setLetterMap: Record<string, number> = {
    'A': 768, 'B': 771, 'C': 774, 'D': 777,
    'E': 780, 'F': 783, 'G': 786, 'H': 789
  };
  
  const sensorBaseNumber = setLetterMap[setLetter] || 0;
  if (sensorBaseNumber === 0) {
    return { missing: [], uploaded: [] };
  }
  
  // Define the expected sensors for this set
  const expectedSensors = [
    { type: "Left Sensor", number: sensorBaseNumber },
    { type: "Middle Sensor", number: sensorBaseNumber + 1 },
    { type: "Right Sensor", number: sensorBaseNumber + 2 }
  ];
  
  // APPROACH 1: Use the missing_fragment_ids if available
  if (missing_fragment_ids && missing_fragment_ids.length > 0) {
    // Parse missing sensor numbers
    const missingSensorNumbers = missing_fragment_ids.split(',')
      .map(id => id.trim())
      .filter(id => id.length > 0)
      .map(id => parseInt(id));
    
    // Determine which sensors are missing/uploaded
    const missing = expectedSensors
      .filter(sensor => missingSensorNumbers.includes(sensor.number))
      .map(sensor => `${sensor.type} (${sensor.number})`);
    
    const uploaded = expectedSensors
      .filter(sensor => !missingSensorNumbers.includes(sensor.number))
      .map(sensor => `${sensor.type} (${sensor.number})`);
    
    return { missing, uploaded };
  }
  
  // APPROACH 2: Use group_uuid to find related uploads
  if (groupUuid) {
    // Find uploads with the same group_uuid
    const relatedUploads = uploads.filter(upload => upload.group_uuid === groupUuid);
    
    if (relatedUploads.length > 0) {
      // Extract sensor numbers from filenames
      const uploadedSensorNumbers = new Set<number>();
      const sensorRegex = /Sensor_(\d+)/i;
      
      relatedUploads.forEach(upload => {
        const match = upload.upload_file_name.match(sensorRegex);
        if (match) {
          uploadedSensorNumbers.add(parseInt(match[1]));
        }
      });
      
      // Determine which sensors are present/missing
      const uploaded = expectedSensors
        .filter(sensor => uploadedSensorNumbers.has(sensor.number))
        .map(sensor => `${sensor.type} (${sensor.number})`);
      
      const missing = expectedSensors
        .filter(sensor => !uploadedSensorNumbers.has(sensor.number))
        .map(sensor => `${sensor.type} (${sensor.number})`);
      
      return { missing, uploaded };
    }
  }
  
  // APPROACH 3: Fallback to finding uploads that reference this set name
  const setUploads = uploads.filter(upload => 
    (upload.contained_measurement_fragments?.includes(setName)) ||
    upload.upload_file_name.includes(`Set_${setName}`)
  );
  
  if (setUploads.length > 0) {
    // Extract sensor numbers from filenames
    const uploadedSensorNumbers = new Set<number>();
    const sensorRegex = /Sensor_(\d+)/i;
    
    setUploads.forEach(upload => {
      const match = upload.upload_file_name.match(sensorRegex);
      if (match) {
        uploadedSensorNumbers.add(parseInt(match[1]));
      }
    });
    
    // Determine which sensors are present/missing
    const uploaded = expectedSensors
      .filter(sensor => uploadedSensorNumbers.has(sensor.number))
      .map(sensor => `${sensor.type} (${sensor.number})`);
    
    const missing = expectedSensors
      .filter(sensor => !uploadedSensorNumbers.has(sensor.number))
      .map(sensor => `${sensor.type} (${sensor.number})`);
    
    return { missing, uploaded };
  }
  
  // If all approaches fail, assume all sensors are missing
  return { 
    missing: expectedSensors.map(sensor => `${sensor.type} (${sensor.number})`),
    uploaded: []
  };
};