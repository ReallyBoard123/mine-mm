import { ConsolidatedMeasurement } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusCell } from "./StatusCell";
import { formatDate, formatDuration } from "../utils/formatters";
import { SensorInfo } from "../utils/sensorUtils";

interface MeasurementTableProps {
  measurements: ConsolidatedMeasurement[];
  getSensorInfo: (measurement: ConsolidatedMeasurement) => SensorInfo;
}

/**
 * Table for displaying measurement details
 */
export function MeasurementTable({ measurements, getSensorInfo }: MeasurementTableProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Creation date</TableHead>
            <TableHead>Measurement start</TableHead>
            <TableHead>Measurement end</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Set name</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {measurements.map((item, idx) => (
            <TableRow key={item.uuid || idx}>
              <TableCell>{formatDate(item.date_created)}</TableCell>
              <TableCell>{formatDate(item.measurement_start)}</TableCell>
              <TableCell>{formatDate(item.measurement_end)}</TableCell>
              <TableCell>{item.duration_sec ? formatDuration(item.duration_sec) : ''}</TableCell>
              <TableCell>{item.imu_set || ''}</TableCell>
              <TableCell>
                <StatusCell 
                  measurement={item} 
                  sensorInfo={getSensorInfo(item)} 
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}