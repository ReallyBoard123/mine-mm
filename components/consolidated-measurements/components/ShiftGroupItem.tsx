import { Button } from "@/components/ui/button";
import { ShiftGroup } from "../hooks/useShiftGroups";
import { ShiftGroupDetails } from "./ShiftGroupDetails";
import { ConsolidatedMeasurement } from "@/lib/api";
import { SensorInfo } from "../utils/sensorUtils";

interface ShiftGroupItemProps {
  group: ShiftGroup;
  isExpanded: boolean;
  isSelected: boolean;
  inCombineMode: boolean;
  timeRange: string;
  toggleGroup: (id: string) => void;
  toggleSelection: (id: string) => void;
  getSensorInfo: (measurement: ConsolidatedMeasurement) => SensorInfo;
}

/**
 * Component for a single shift group
 */
export function ShiftGroupItem({
  group,
  isExpanded,
  isSelected,
  inCombineMode,
  timeRange,
  toggleGroup,
  toggleSelection,
  getSensorInfo
}: ShiftGroupItemProps) {
  return (
    <div 
      className={`border rounded-lg overflow-hidden ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-200' : ''
      }`}
    >
      <div className="flex items-center p-4 bg-muted">
        <div 
          className="flex-1 cursor-pointer flex items-center"
          onClick={() => toggleGroup(group.id)}
        >
          <div className={`w-2 h-2 rounded-full ${
            group.shiftType === "Day Shift" ? "bg-yellow-400" : 
            group.shiftType === "Night Shift" ? "bg-blue-600" : 
            group.shiftType === "Custom" ? "bg-purple-500" : "bg-emerald-500"
          }`}></div>
          
          <h3 className="font-medium ml-2">
            {group.shiftType === "Custom" ? group.customName : (
              <>
                {new Date(group.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric',
                  year: 'numeric'
                })}
                
                {group.endDate && group.date !== group.endDate && (
                  <span> - {new Date(group.endDate).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}</span>
                )}
                
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {group.shiftType} ({group.measurements.length} measurements)
                </span>
                
                {timeRange && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {timeRange}
                  </span>
                )}
              </>
            )}
          </h3>
        </div>
        
        <div className="flex space-x-2 items-center">
          {(isExpanded || inCombineMode) && (
            <Button
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSelection(group.id)}
              className="h-8 px-2"
            >
              {isSelected ? "Selected" : "Select"}
            </Button>
          )}
          
          <span 
            className="text-xl cursor-pointer w-8 h-8 flex items-center justify-center"
            onClick={() => toggleGroup(group.id)}
          >
            {isExpanded ? '−' : '+'}
          </span>
        </div>
      </div>
      
      <ShiftGroupDetails 
        measurements={group.measurements} 
        expanded={isExpanded}
        getSensorInfo={getSensorInfo}
      />
    </div>
  );
}