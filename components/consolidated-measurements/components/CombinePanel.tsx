import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CombinePanelProps {
  selectedCount: number;
  showCustomNameInput: boolean;
  customShiftName: string;
  onShowNameInput: () => void;
  onNameChange: (name: string) => void;
  onCombine: () => void;
  onCancel: () => void;
}

/**
 * Panel for combining multiple shift groups
 */
export function CombinePanel({
  selectedCount,
  showCustomNameInput,
  customShiftName,
  onShowNameInput,
  onNameChange,
  onCombine,
  onCancel
}: CombinePanelProps) {
  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4 flex flex-col sm:flex-row items-center justify-between">
      <div>
        <h3 className="font-medium text-blue-800">Combine Mode</h3>
        <p className="text-sm text-blue-600">Selected {selectedCount} shifts to combine</p>
      </div>
      
      <div className="flex space-x-2 mt-3 sm:mt-0">
        {!showCustomNameInput ? (
          <Button size="sm" onClick={onShowNameInput}>
            Name Combined Shift
          </Button>
        ) : (
          <div className="flex items-center">
            <Input
              type="text"
              placeholder="Enter shift name"
              value={customShiftName}
              onChange={(e) => onNameChange(e.target.value)}
              className="text-sm h-8 mr-2"
            />
          </div>
        )}
        
        <Button size="sm" variant="default" onClick={onCombine}>
          Combine
        </Button>
        
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}