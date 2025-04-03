import { ConsolidatedMeasurement } from "@/lib/api";
import { SensorInfo } from "../utils/sensorUtils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface StatusCellProps {
  measurement: ConsolidatedMeasurement;
  sensorInfo: SensorInfo;
}

/**
 * Status cell with tooltip for failed measurements
 */
export function StatusCell({ measurement, sensorInfo }: StatusCellProps) {
  if (measurement.has_error || !measurement.processing_finished) {
    const tooltipContent = sensorInfo.missing.length > 0 ? (
      <>
        <p className="font-medium">Missing sensor files:</p>
        <ul className="list-disc pl-4 mt-1">
          {sensorInfo.missing.map((sensor, idx) => (
            <li key={idx}>{sensor}</li>
          ))}
        </ul>
        {sensorInfo.uploaded.length > 0 && (
          <>
            <p className="font-medium mt-2">Uploaded sensor files:</p>
            <ul className="list-disc pl-4 mt-1">
              {sensorInfo.uploaded.map((sensor, idx) => (
                <li key={idx}>{sensor}</li>
              ))}
            </ul>
          </>
        )}
      </>
    ) : (
      <p>Unable to determine missing sensors</p>
    );
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-red-500 cursor-help">
              {measurement.has_error ? "Error" : "Failed"}
            </span>
          </TooltipTrigger>
          <TooltipContent className="w-64 p-3">
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
  
  return <span className="text-green-500">✓</span>;
}