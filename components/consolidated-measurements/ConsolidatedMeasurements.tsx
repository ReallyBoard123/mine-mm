import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import useDataStore from "@/lib/store";
import { useShiftGroups } from "./hooks/useShiftGroups";
import { useSensorDetection } from "./hooks/useSensorDetection";
import { useCombineMode } from "./hooks/useCombineMode";
import { ShiftGroupItem } from "./components/ShiftGroupItem";
import { CombinePanel } from "./components/CombinePanel";
import { formatLastUpdate } from "./utils/formatters";

/**
 * Main component for consolidated measurements view
 */
export function ConsolidatedMeasurements() {
  const { 
    loading, 
    error, 
    fetchMeasurements,
    lastMeasurementsUpdate,
    uploadsData,
    fetchUploads
  } = useDataStore();
  
  const [initialized, setInitialized] = useState(false);
  
  // Initialize custom hooks
  const { 
    shiftGroups, 
    toggleGroup, 
    isGroupExpanded, 
    getGroupTimeRange,
    setExpandedGroups
  } = useShiftGroups();
  
  const { getSensorInfo } = useSensorDetection(uploadsData?.items);
  
  const {
    selectedGroups,
    combineMode,
    customShiftName,
    showCustomNameInput,
    toggleGroupSelection,
    isGroupSelected,
    handleCombineShifts,
    cancelCombine,
    showNameInput,
    setCustomShiftName,
    removeFromSelectionIfCollapsed
  } = useCombineMode(setExpandedGroups);
  
  // Format last update time
  const lastUpdate = formatLastUpdate(lastMeasurementsUpdate);
  
  // Initialize data if needed
  useEffect(() => {
    if (!initialized && !loading) {
      fetchMeasurements();
      
      // Fetch uploads data if needed for tooltips
      if (!uploadsData) {
        fetchUploads();
      }
      
      setInitialized(true);
    }
  }, [initialized, uploadsData, loading, fetchMeasurements, fetchUploads]);
  
  // Remove groups from selection when they are collapsed
  useEffect(() => {
    shiftGroups.forEach(group => {
      const isExpanded = isGroupExpanded(group.id);
      if (!isExpanded) {
        removeFromSelectionIfCollapsed(group.id, isExpanded);
      }
    });
  }, [shiftGroups, isGroupExpanded, removeFromSelectionIfCollapsed]);
  
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
        <CombinePanel
          selectedCount={selectedGroups.size}
          showCustomNameInput={showCustomNameInput}
          customShiftName={customShiftName}
          onShowNameInput={showNameInput}
          onNameChange={setCustomShiftName}
          onCombine={handleCombineShifts}
          onCancel={cancelCombine}
        />
      )}
      
      {!loading && shiftGroups.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {shiftGroups.map((group) => (
              <ShiftGroupItem
                key={group.id}
                group={group}
                isExpanded={isGroupExpanded(group.id)}
                isSelected={isGroupSelected(group.id)}
                inCombineMode={combineMode}
                timeRange={getGroupTimeRange(group)}
                toggleGroup={toggleGroup}
                toggleSelection={toggleGroupSelection}
                getSensorInfo={getSensorInfo}
              />
            ))}
          </div>
        </div>
      )}
      
      {!loading && shiftGroups.length === 0 && !error && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No measurements available.</p>
        </div>
      )}

      {process.env.NODE_ENV !== 'production' && (
        <div className="mt-8 p-4 border border-dashed border-gray-300 rounded-md">
          <h3 className="font-medium mb-2">Debug Information</h3>
          <button 
            onClick={() => {
              // Log current state for debugging
              console.log("Current shift groups:", shiftGroups);
              console.log("Measurements data:", useDataStore.getState().measurementsData);
              
              // Force refresh data
              fetchMeasurements();
            }}
            className="px-3 py-1 bg-gray-200 rounded text-sm mb-4"
          >
            Force Refresh + Debug Log
          </button>
          
          <div className="text-xs overflow-auto max-h-60">
            <div className="mb-2">Groups count: {shiftGroups.length}</div>
            <div className="mb-2">Custom groups count: {
              shiftGroups.filter(g => g.shiftType === "Custom").length
            }</div>
            <div className="mb-2">Last update: {lastUpdate}</div>
            <div className="mb-2 font-semibold">Combined Shift Statuses:</div>
            <ul className="list-disc pl-4 space-y-1">
              {shiftGroups
                .filter(g => g.shiftType === "Custom")
                .flatMap(g => g.measurements)
                .map((m, i) => (
                  <li key={i} className={m.has_error ? "text-red-500" : "text-green-500"}>
                    {m.imu_set}: {m.has_error ? "Failed" : "Success"} 
                    (UUID: {m.uuid?.substring(0, 8)})
                  </li>
                ))
              }
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}