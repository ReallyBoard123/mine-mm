import { useCallback } from 'react';
import { ConsolidatedMeasurement, DataUpload } from "@/lib/api";
import { identifyMissingSensors, SensorInfo } from "../utils/sensorUtils";

/**
 * Hook for sensor detection functionality
 */
export const useSensorDetection = (uploads: DataUpload[] | undefined) => {
  /**
   * Get missing and uploaded sensors for a measurement
   */
  const getSensorInfo = useCallback((measurement: ConsolidatedMeasurement): SensorInfo => {
    return identifyMissingSensors(measurement, uploads);
  }, [uploads]);

  return {
    getSensorInfo
  };
};