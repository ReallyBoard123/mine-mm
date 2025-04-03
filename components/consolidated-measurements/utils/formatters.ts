/**
 * Format duration in seconds to hours and minutes
 */
export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${String(minutes).padStart(2, '0')} hrs`;
  };
  
  /**
   * Format date for better readability
   */
  export const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString([], {
      month: 'numeric', 
      day: 'numeric', 
      year: '2-digit', 
      hour: 'numeric', 
      minute: '2-digit'
    });
  };
  
  /**
   * Format time only from a date string
   */
  export const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit'
    });
  };
  
  /**
   * Format date for last update display
   */
  export const formatLastUpdate = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    
    return new Date(timestamp).toLocaleString([], {
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };