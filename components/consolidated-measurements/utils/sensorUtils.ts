import { ConsolidatedMeasurement, DataUpload } from "@/lib/api";

/**
 * Maps set letters to their base sensor numbers
 */
export const SET_LETTER_MAP: Record<string, number> = {
  'A': 768, 'B': 771, 'C': 774, 'D': 777,
  'E': 780, 'F': 783, 'G': 786, 'H': 789
};

/**
 * Interface for sensor information
 */
export interface SensorInfo {
  missing: string[];
  uploaded: string[];
}

/**
 * Interface for a sensor
 */
export interface Sensor {
  type: string;
  number: number;
}

/**
 * Get expected sensors for a set
 */
export const getExpectedSensors = (setName: string): Sensor[] => {
  const [setNumber, setLetter] = setName.split('-');
  if (!setNumber || !setLetter || !SET_LETTER_MAP[setLetter]) {
    return [];
  }
  
  const sensorBaseNumber = SET_LETTER_MAP[setLetter];
  
  return [
    { type: "Left Sensor", number: sensorBaseNumber },
    { type: "Middle Sensor", number: sensorBaseNumber + 1 },
    { type: "Right Sensor", number: sensorBaseNumber + 2 }
  ];
};

/**
 * Identify missing sensors for a measurement
 */
export const identifyMissingSensors = (
  measurement: ConsolidatedMeasurement,
  uploads: DataUpload[] | undefined
): SensorInfo => {
  if (!measurement || !measurement.imu_set || !uploads || uploads.length === 0) {
    return { missing: [], uploaded: [] };
  }
  
  const { imu_set: setName, group_uuid: groupUuid, missing_fragment_ids } = measurement;
  
  // Get expected sensors for this set
  const expectedSensors = getExpectedSensors(setName);
  if (expectedSensors.length === 0) {
    return { missing: [], uploaded: [] };
  }
  
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