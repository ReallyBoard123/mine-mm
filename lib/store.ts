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

interface DataState {
  uploadsData: ApiResponse | null;
  measurementsData: ApiResponse | null;
  loading: boolean;
  error: string | null;
  lastUploadsUpdate: number;
  lastMeasurementsUpdate: number;
  
  // Actions
  fetchUploads: () => Promise<void>;
  fetchMeasurements: () => Promise<void>;
  clearData: () => void;
}

const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      uploadsData: null,
      measurementsData: null,
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
          set({ 
            measurementsData: response, 
            loading: false,
            lastMeasurementsUpdate: Date.now()
          });
        } catch (err) {
          set({ 
            error: err instanceof Error ? err.message : "An unknown error occurred", 
            loading: false 
          });
        }
      },
      
      clearData: () => {
        set({ 
          uploadsData: null, 
          measurementsData: null,
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
        lastUploadsUpdate: state.lastUploadsUpdate,
        lastMeasurementsUpdate: state.lastMeasurementsUpdate
      })
    }
  )
);

export default useDataStore;