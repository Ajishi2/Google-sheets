import React from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { FunctionSquare } from 'lucide-react';

export function FormulaBar() {
  const { state, setCellValue, setFormulaBarValue } = useSheetStore();
  const { selectedCell, formulaBarValue } = state;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setFormulaBarValue(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedCell) {
      setCellValue(selectedCell, formulaBarValue);
    }
  };

  const handleBlur = () => {
    if (selectedCell) {
      setCellValue(selectedCell, formulaBarValue);
    }
  };

  return (
    <div className="flex items-center gap-2 p-1 border-b bg-white">
      <button className="p-1 rounded hover:bg-gray-100" title="Function">
        <FunctionSquare size={16} />
      </button>
      <div className="font-mono bg-gray-100 px-2 py-1 rounded text-sm min-w-[40px] text-center">
        {selectedCell || ''}
      </div>
      <input
        type="text"
        value={formulaBarValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Enter a value or formula (e.g., =SUM(A1,B1))"
        className="flex-1 px-2 py-1 border rounded text-sm"
      />
    </div>
  );
}