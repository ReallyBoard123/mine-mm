import { useState, useCallback } from 'react';
import useDataStore from '@/lib/store'; // Import store

/**
 * Hook for managing shift combine functionality
 */
export const useCombineMode = (setExpandedGroups: (groups: Set<string>) => void) => {
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
  const [combineMode, setCombineMode] = useState(false);
  const [customShiftName, setCustomShiftName] = useState("");
  const [showCustomNameInput, setShowCustomNameInput] = useState(false);
  
  // Get combineShifts function from store
  const { combineShifts } = useDataStore();
  
  /**
   * Toggle selection of a shift group
   */
  const toggleGroupSelection = useCallback((groupId: string) => {
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
  }, []);
  
  /**
   * Check if a group is selected
   */
  const isGroupSelected = useCallback((groupId: string) => {
    return selectedGroups.has(groupId);
  }, [selectedGroups]);
  
  /**
   * Handle the shift combination
   */
  const handleCombineShifts = useCallback(() => {
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
  }, [selectedGroups, customShiftName, combineShifts, setExpandedGroups]);
  
  /**
   * Cancel combine mode
   */
  const cancelCombine = useCallback(() => {
    setSelectedGroups(new Set());
    setCombineMode(false);
    setShowCustomNameInput(false);
    setCustomShiftName("");
  }, []);
  
  /**
   * Show the custom name input
   */
  const showNameInput = useCallback(() => {
    setShowCustomNameInput(true);
  }, []);
  
  /**
   * Remove a group from selection if it's no longer expanded
   */
  const removeFromSelectionIfCollapsed = useCallback((groupId: string, isExpanded: boolean) => {
    if (!isExpanded && selectedGroups.has(groupId)) {
      setSelectedGroups(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        
        // Update combine mode
        setCombineMode(newSet.size >= 2);
        
        return newSet;
      });
    }
  }, [selectedGroups]);
  
  return {
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
  };
};