import { useState, useCallback, useEffect } from 'react';
import { formatTime } from '../utils/formatters';
import useDataStore, { ShiftGroup } from '@/lib/store'; // Import from store

/**
 * Hook for managing shift groups
 */
export const useShiftGroups = () => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  
  // Use shift groups from the store
  const { shiftGroups } = useDataStore();
  
  /**
   * Get time range for a shift group
   */
  const getGroupTimeRange = useCallback((group: ShiftGroup): string => {
    if (group.measurements.length === 0) return "";
    
    const startTimes = group.measurements.map(m => new Date(m.measurement_start).getTime());
    const endTimes = group.measurements.map(m => new Date(m.measurement_end).getTime());
    
    const earliestStart = new Date(Math.min(...startTimes));
    const latestEnd = new Date(Math.max(...endTimes));
    
    return `${formatTime(earliestStart.toISOString())} - ${formatTime(latestEnd.toISOString())}`;
  }, []);
  
  /**
   * Toggle expansion of a shift group
   */
  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }, []);
  
  /**
   * Check if a group is expanded
   */
  const isGroupExpanded = useCallback((groupId: string) => {
    return expandedGroups.has(groupId);
  }, [expandedGroups]);
  
  return {
    shiftGroups,
    toggleGroup,
    isGroupExpanded,
    getGroupTimeRange,
    expandedGroups,
    setExpandedGroups
  };
};