import { ConsolidatedMeasurement } from "@/lib/api";
import { MeasurementTable } from "./MeasurementTable";
import { SensorInfo } from "../utils/sensorUtils";

interface ShiftGroupDetailsProps {
  measurements: ConsolidatedMeasurement[];
  expanded: boolean;
  getSensorInfo: (measurement: ConsolidatedMeasurement) => SensorInfo;
}

/**
 * Expandable details section for a shift group
 */
export function ShiftGroupDetails({ 
  measurements, 
  expanded,
  getSensorInfo
}: ShiftGroupDetailsProps) {
  if (!expanded) {
    return null;
  }
  
  return (
    <MeasurementTable 
      measurements={measurements} 
      getSensorInfo={getSensorInfo} 
    />
  );
}