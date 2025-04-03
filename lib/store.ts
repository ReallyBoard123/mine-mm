// lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { 
  ApiResponse, 
  DataUpload, 
  ConsolidatedMeasurement, 
  fetchDataUploads, 
  fetchConsolidatedMeasurements 
} from './api';

export interface ShiftGroup {
  id: string;
  date: string;
  endDate?: string;
  shiftType: "Day Shift" | "Night Shift" | "Multi-day" | "Custom";
  customName?: string;
  measurements: ConsolidatedMeasurement[];
}

interface DataState {
  uploadsData: ApiResponse | null;
  measurementsData: ApiResponse | null;
  shiftGroups: ShiftGroup[];
  loading: boolean;
  error: string | null;
  lastUploadsUpdate: number;
  lastMeasurementsUpdate: number;
  
  // Actions
  fetchUploads: () => Promise<void>;
  fetchMeasurements: () => Promise<void>;
  clearData: () => void;
  setShiftGroups: (groups: ShiftGroup[]) => void;
  combineShifts: (groupIds: string[], customName: string) => void;
  processIntoShifts: (measurements: ConsolidatedMeasurement[]) => ShiftGroup[];
}

const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      uploadsData: null,
      measurementsData: null,
      shiftGroups: [],
      loading: false,
      error: null,
      lastUploadsUpdate: 0,
      lastMeasurementsUpdate: 0,
      
      fetchUploads: async () => {
        set({ loading: true, error: null });
        
        try {
          const response = await fetchDataUploads();
          set({ 
            uploadsData: response, 
            loading: false,
            lastUploadsUpdate: Date.now()
          });
        } catch (err) {
          set({ 
            error: err instanceof Error ? err.message : "An unknown error occurred", 
            loading: false 
          });
        }
      },
      
      fetchMeasurements: async () => {
        set({ loading: true, error: null });
        
        try {
          const response = await fetchConsolidatedMeasurements();
          
          set(state => {
            // First, collect all measurements with their unique identifiers
            // We'll use a composite key since UUID alone might not be sufficient
            const freshMeasurements = new Map<string, ConsolidatedMeasurement>();
            
            response.items.forEach((measurement: ConsolidatedMeasurement) => {
              // Create a composite key using imu_set and timestamps
              const key = `${measurement.imu_set}:${measurement.measurement_start}:${measurement.measurement_end}`;
              freshMeasurements.set(key, measurement);
              
              // Also index by UUID as a fallback
              if (measurement.uuid) {
                freshMeasurements.set(measurement.uuid, measurement);
              }
            });
            
            // Process new measurements into standard groups
            const newGroups = state.processIntoShifts(response.items);
            
            // Update existing custom groups with fresh measurement data
            const updatedCustomGroups = state.shiftGroups
              .filter(group => group.shiftType === "Custom")
              .map(group => {
                // Replace measurements with fresh data where possible
                const updatedMeasurements = group.measurements.map(oldMeasurement => {
                  // Try to find by composite key first
                  const compositeKey = `${oldMeasurement.imu_set}:${oldMeasurement.measurement_start}:${oldMeasurement.measurement_end}`;
                  
                  // First try the composite key
                  if (freshMeasurements.has(compositeKey)) {
                    return freshMeasurements.get(compositeKey)!;
                  }
                  
                  // Then try by UUID
                  if (oldMeasurement.uuid && freshMeasurements.has(oldMeasurement.uuid)) {
                    return freshMeasurements.get(oldMeasurement.uuid)!;
                  }
                  
                  // Try finding by set name and timestamps
                  for (const measurement of response.items) {
                    if (measurement.imu_set === oldMeasurement.imu_set &&
                        measurement.measurement_start === oldMeasurement.measurement_start &&
                        measurement.measurement_end === oldMeasurement.measurement_end) {
                      return measurement;
                    }
                  }
                  
                  // If nothing matched, keep the old measurement
                  return oldMeasurement;
                });
                
                return {
                  ...group,
                  measurements: updatedMeasurements
                };
              });
            
            // Merge and sort all groups
            const allGroups = [...updatedCustomGroups, ...newGroups].sort((a, b) => {
              // Custom sorting logic for dates
              if (a.shiftType === "Custom" && b.shiftType === "Custom") {
                const aDateMatches = a.customName?.match(/\w+, (\w+ \d+, \d+)/);
                const bDateMatches = b.customName?.match(/\w+, (\w+ \d+, \d+)/);
                
                const aDate = aDateMatches ? new Date(aDateMatches[1]) : new Date(a.date);
                const bDate = bDateMatches ? new Date(bDateMatches[1]) : new Date(b.date);
                
                return bDate.getTime() - aDate.getTime();
              }
              
              return new Date(b.date).getTime() - new Date(a.date).getTime();
            });
            
            // For debugging
            console.log("Updated measurements in custom groups:", 
              updatedCustomGroups.flatMap(g => g.measurements).map(m => 
                `${m.imu_set}: ${m.has_error ? 'Error' : 'Success'}`
              )
            );
            
            return { 
              measurementsData: response, 
              shiftGroups: allGroups,
              loading: false,
              lastMeasurementsUpdate: Date.now()
            };
          });
        } catch (err) {
          set({ 
            error: err instanceof Error ? err.message : "An unknown error occurred", 
            loading: false 
          });
        }
      },
      
      setShiftGroups: (groups) => {
        set({ shiftGroups: groups });
      },
      
      processIntoShifts: (measurements) => {
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
          
          // Check if the measurement is already in a custom group
          const state = get();
          const isInCustomGroup = state.shiftGroups.some(group => 
            group.shiftType === "Custom" && 
            group.measurements.some(m => m.uuid === measurement.uuid)
          );
          
          // Only add to standard group if not in a custom group
          if (!isInCustomGroup) {
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
          }
        });
        
        // Convert to array and sort by date (newest first)
        return Object.values(groups).sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      },
      
      combineShifts: (groupIds, customName) => {
        set(state => {
          const selectedGroupsData = state.shiftGroups.filter(group => groupIds.includes(group.id));
          
          // Get all measurements from selected groups
          const allMeasurements = selectedGroupsData.flatMap(group => group.measurements);
          
          // Sort by time
          allMeasurements.sort((a, b) => 
            new Date(a.measurement_start).getTime() - new Date(b.measurement_start).getTime()
          );
          
          // Get earliest start and latest end dates
          const earliestStartDate = new Date(allMeasurements[0].measurement_start);
          const latestEndDate = new Date(allMeasurements[allMeasurements.length - 1].measurement_end);
          
          const startDateStr = earliestStartDate.toISOString().split('T')[0];
          const endDateStr = latestEndDate.toISOString().split('T')[0];
          
          // Format dates for display in the suffix
          const startFormatted = earliestStartDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
          });
          
          const endFormatted = latestEndDate.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric'
          });
          
          // Format times for the suffix
          const startTime = earliestStartDate.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
          });
          
          const endTime = latestEndDate.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit'
          });
          
          // Create date range suffix
          const dateRangeSuffix = ` (${startFormatted} ${startTime} - ${endFormatted} ${endTime})`;
          
          // Generate a unique ID for the combined group
          const combinedGroupId = `combined-${Date.now()}`;
          
          // Create the new combined group
          const newGroup: ShiftGroup = {
            id: combinedGroupId,
            date: startDateStr,
            endDate: endDateStr,
            shiftType: "Custom",
            customName: (customName || `Combined Shift`) + dateRangeSuffix,
            measurements: allMeasurements
          };
          
          // Create new groups array without the selected groups
          const updatedGroups = state.shiftGroups.filter(group => !groupIds.includes(group.id));
          
          // Add the new combined group
          updatedGroups.unshift(newGroup);
          
          // Sort all groups by date (newest first)
          updatedGroups.sort((a, b) => {
            // For custom groups with custom names, extract dates from the name if possible
            if (a.shiftType === "Custom" && b.shiftType === "Custom") {
              // Try to extract date from customName
              const aDateMatches = a.customName?.match(/\w+, (\w+ \d+, \d+)/);
              const bDateMatches = b.customName?.match(/\w+, (\w+ \d+, \d+)/);
              
              if (aDateMatches && bDateMatches) {
                const aDate = new Date(aDateMatches[1]);
                const bDate = new Date(bDateMatches[1]);
                return bDate.getTime() - aDate.getTime();
              }
            }
            
            // Default comparison using the date property
            return new Date(b.date).getTime() - new Date(a.date).getTime();
          });
          
          return { shiftGroups: updatedGroups };
        });
      },
      
      clearData: () => {
        set({ 
          uploadsData: null, 
          measurementsData: null,
          shiftGroups: [],
          lastUploadsUpdate: 0,
          lastMeasurementsUpdate: 0
        });
      }
    }),
    {
      name: 'motion-miners-data',
      partialize: (state) => ({
        uploadsData: state.uploadsData,
        measurementsData: state.measurementsData,
        shiftGroups: state.shiftGroups,
        lastUploadsUpdate: state.lastUploadsUpdate,
        lastMeasurementsUpdate: state.lastMeasurementsUpdate
      })
    }
  )
);

export default useDataStore;