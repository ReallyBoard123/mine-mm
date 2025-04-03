import { useState, useEffect } from "react";
import { ConsolidatedMeasurement } from "@/lib/api";

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, X, RefreshCw } from "lucide-react";
import useDataStore from "@/lib/store";

interface ShiftGroup {
  id: string;
  date: string;
  endDate?: string;
  shiftType: "Day Shift" | "Night Shift" | "Multi-day" | "Custom";
  customName?: string;
  measurements: ConsolidatedMeasurement[];
}

export function ConsolidatedMeasurements() {
  const { 
    measurementsData, 
    shiftGroups,
    loading, 
    error, 
    fetchMeasurements,
    combineShifts,
    lastMeasurementsUpdate 
  } = useDataStore();
  
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [combineMode, setCombineMode] = useState(false);
  const [customShiftName, setCustomShiftName] = useState("");
  const [showCustomNameInput, setShowCustomNameInput] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Format last update time
  const lastUpdate = lastMeasurementsUpdate ? 
    new Date(lastMeasurementsUpdate).toLocaleString([], {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }) : 'Never';

  // Group measurements into shifts based on date patterns
  const processIntoShifts = (measurements: ConsolidatedMeasurement[]): ShiftGroup[] => {
    const groups: Record<string, ShiftGroup> = {};
    
    measurements.forEach(measurement => {
      if (!measurement.measurement_start || !measurement.measurement_end) {
        return; // Skip measurements without start/end times
      }
      
      const startDate = new Date(measurement.measurement_start);
      const endDate = new Date(measurement.measurement_end);
      
      // Format dates for comparison (YYYY-MM-DD)
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      let shiftType: "Day Shift" | "Night Shift" | "Multi-day";
      let groupKey: string;
      
      if (startDateStr === endDateStr) {
        // Same day - Day Shift
        shiftType = "Day Shift";
        groupKey = `${startDateStr}-day`;
      } else if (new Date(startDateStr).getTime() + 86400000 === new Date(endDateStr).getTime()) {
        // End date is one day after start date - Night Shift
        shiftType = "Night Shift";
        groupKey = `${startDateStr}-night`;
      } else {
        // Spans multiple days
        shiftType = "Multi-day";
        groupKey = `${startDateStr}-to-${endDateStr}`;
      }
      
      // Initialize group if it doesn't exist
      if (!groups[groupKey]) {
        groups[groupKey] = {
          id: groupKey,
          date: startDateStr,
          endDate: startDateStr !== endDateStr ? endDateStr : undefined,
          shiftType,
          measurements: []
        };
      }
      
      // Add measurement to group
      groups[groupKey].measurements.push(measurement);
    });
    
    // Convert to array and sort by date (newest first)
    return Object.values(groups).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  // Toggle expansion of a shift group
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
        // Also remove from selected if it was selected
        if (selectedGroups.has(groupId)) {
          setSelectedGroups(prev => {
            const newSelected = new Set(prev);
            newSelected.delete(groupId);
            return newSelected;
          });
        }
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Toggle selection of a shift group for combining
  const toggleGroupSelection = (groupId: string) => {
    setSelectedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      
      // If we have 2+ selected, enable combine mode
      setCombineMode(newSet.size >= 2);
      
      return newSet;
    });
  };

  // Combine selected shifts into a custom shift
  const handleCombineShifts = () => {
    if (selectedGroups.size < 2) return;
    
    // Convert selected groups Set to array
    const selectedGroupIds = Array.from(selectedGroups);
    
    // Call the store action to combine shifts
    combineShifts(selectedGroupIds, customShiftName);
    
    // Reset local UI state
    setExpandedGroups(new Set());
    setSelectedGroups(new Set());
    setCombineMode(false);
    setCustomShiftName("");
    setShowCustomNameInput(false);
  };

  // Cancel combine mode
  const cancelCombine = () => {
    setSelectedGroups(new Set());
    setCombineMode(false);
    setShowCustomNameInput(false);
    setCustomShiftName("");
  };

  // Format duration to hours and minutes
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${String(minutes).padStart(2, '0')} hrs`;
  };

  // Format date for better readability
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString([], {
      month: 'numeric', 
      day: 'numeric', 
      year: '2-digit', 
      hour: 'numeric', 
      minute: '2-digit'
    });
  };

  // Format time only
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  // Initialize data if needed
  useEffect(() => {
    if (!initialized && (!measurementsData || shiftGroups.length === 0) && !loading) {
      fetchMeasurements();
      setInitialized(true);
    }
  }, [initialized, measurementsData, shiftGroups, loading, fetchMeasurements]);

  // Get earliest start time and latest end time for a group
  const getGroupTimeRange = (group: ShiftGroup) => {
    if (group.measurements.length === 0) return "";
    
    const startTimes = group.measurements.map(m => new Date(m.measurement_start).getTime());
    const endTimes = group.measurements.map(m => new Date(m.measurement_end).getTime());
    
    const earliestStart = new Date(Math.min(...startTimes));
    const latestEnd = new Date(Math.max(...endTimes));
    
    return `${formatTime(earliestStart.toISOString())} - ${formatTime(latestEnd.toISOString())}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-muted-foreground">
          Last updated: {lastUpdate}
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          onClick={fetchMeasurements}
          disabled={loading}
          className="flex items-center gap-1"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
    
      {loading && (
        <div className="flex justify-center items-center py-8">
          <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <p>{error}</p>
        </div>
      )}
      
      {combineMode && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4 flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h3 className="font-medium text-blue-800">Combine Mode</h3>
            <p className="text-sm text-blue-600">Selected {selectedGroups.size} shifts to combine</p>
          </div>
          
          <div className="flex space-x-2 mt-3 sm:mt-0">
            {!showCustomNameInput ? (
              <Button size="sm" onClick={() => setShowCustomNameInput(true)}>
                Name Combined Shift
              </Button>
            ) : (
              <div className="flex items-center">
                <Input
                  type="text"
                  placeholder="Enter shift name"
                  value={customShiftName}
                  onChange={(e) => setCustomShiftName(e.target.value)}
                  className="text-sm h-8 mr-2"
                />
              </div>
            )}
            
            <Button size="sm" variant="default" onClick={handleCombineShifts}>
              Combine
            </Button>
            
            <Button size="sm" variant="outline" onClick={cancelCombine}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      
      {!loading && shiftGroups.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {shiftGroups.map((group, index) => {
              const isExpanded = expandedGroups.has(group.id);
              const isSelected = selectedGroups.has(group.id);
              const timeRange = getGroupTimeRange(group);
              
              return (
                <div key={group.id} className={`border rounded-lg overflow-hidden ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : ''}`}>
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
                      {(isExpanded || combineMode) && (
                        <Button
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleGroupSelection(group.id)}
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
                  
                  {isExpanded && (
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
                          {group.measurements.map((item, idx) => (
                            <TableRow key={item.uuid || idx}>
                              <TableCell>{formatDate(item.date_created)}</TableCell>
                              <TableCell>{formatDate(item.measurement_start)}</TableCell>
                              <TableCell>{formatDate(item.measurement_end)}</TableCell>
                              <TableCell>{item.duration_sec ? formatDuration(item.duration_sec) : ''}</TableCell>
                              <TableCell>{item.imu_set || ''}</TableCell>
                              <TableCell>
                                {item.has_error ? (
                                  <span className="text-red-500">Error</span>
                                ) : item.processing_finished ? (
                                  <span className="text-green-500">✓</span>
                                ) : (
                                  <span className="text-red-500">Failed</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {!loading && shiftGroups.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No measurements available.</p>
        </div>
      )}
    </div>
  );
}