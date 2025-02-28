import React from 'react';
import { 
  Bold, Italic, Type, Palette, AlignLeft, AlignCenter, AlignRight, 
  DollarSign, Percent, Search, Plus, Minus, Trash2, List, Filter, BarChart
} from 'lucide-react';
import { useSheetStore } from '../store/useSheetStore';

export function Toolbar() {
  const { 
    state, 
    updateCellFormat, 
    toggleFindReplace,
    addRow,
    deleteRow,
    addColumn,
    deleteColumn,
    removeDuplicateRows,
    toggleChart,
    setCellValidation
  } = useSheetStore();
  
  const selectedCell = state.selectedCell;
  const cell = selectedCell ? state.cells[selectedCell] : null;

  const handleFormatClick = (format: keyof Cell['format']) => {
    if (!selectedCell || !cell) return;
    updateCellFormat(selectedCell, { [format]: !cell.format[format] });
  };

  const handleAlignClick = (align: 'left' | 'center' | 'right') => {
    if (!selectedCell || !cell) return;
    updateCellFormat(selectedCell, { align });
  };

  const handleNumberFormatClick = (numberFormat: 'general' | 'currency' | 'percent' | 'date') => {
    if (!selectedCell || !cell) return;
    updateCellFormat(selectedCell, { numberFormat });
    
    // Apply formatting to the displayed value if needed
    if (numberFormat === 'currency' && cell.value && !isNaN(parseFloat(cell.value))) {
      const value = parseFloat(cell.value);
      updateCellFormat(selectedCell, { 
        numberFormat: 'currency',
        align: 'right'
      });
    } else if (numberFormat === 'percent' && cell.value && !isNaN(parseFloat(cell.value))) {
      const value = parseFloat(cell.value);
      updateCellFormat(selectedCell, { 
        numberFormat: 'percent',
        align: 'right'
      });
    }
  };

  const handleAddRow = () => {
    if (selectedCell) {
      const rowId = selectedCell.match(/\d+/)?.[0];
      if (rowId) {
        addRow(rowId);
      }
    }
  };

  const handleDeleteRow = () => {
    if (selectedCell) {
      const rowId = selectedCell.match(/\d+/)?.[0];
      if (rowId) {
        deleteRow(rowId);
      }
    }
  };

  const handleAddColumn = () => {
    if (selectedCell) {
      const colId = selectedCell.match(/[A-Z]+/)?.[0];
      if (colId) {
        addColumn(colId);
      }
    }
  };

  const handleDeleteColumn = () => {
    if (selectedCell) {
      const colId = selectedCell.match(/[A-Z]+/)?.[0];
      if (colId) {
        deleteColumn(colId);
      }
    }
  };

  const handleSetDateValidation = () => {
    if (!selectedCell) return;
    
    setCellValidation(selectedCell, {
      type: 'date',
      errorMessage: 'Please enter a valid date (YYYY-MM-DD)',
      allowBlank: true
    });
  };

  return (
    <div className="flex items-center gap-1 p-1 border-b bg-white">
      <button
        className={`p-1 rounded hover:bg-gray-100 ${cell?.format.bold ? 'bg-gray-200' : ''}`}
        onClick={() => handleFormatClick('bold')}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        className={`p-1 rounded hover:bg-gray-100 ${cell?.format.italic ? 'bg-gray-200' : ''}`}
        onClick={() => handleFormatClick('italic')}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <div className="h-4 w-px bg-gray-300 mx-1" />
      <select
        className="p-1 rounded border text-sm"
        value={cell?.format.fontSize || 12}
        onChange={(e) =>
          selectedCell &&
          updateCellFormat(selectedCell, { fontSize: Number(e.target.value) })
        }
        title="Font size"
      >
        {[8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24].map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
      <div className="h-4 w-px bg-gray-300 mx-1" />
      <button 
        className={`p-1 rounded hover:bg-gray-100 ${cell?.format.align === 'left' ? 'bg-gray-200' : ''}`} 
        onClick={() => handleAlignClick('left')}
        title="Align left"
      >
        <AlignLeft size={16} />
      </button>
      <button 
        className={`p-1 rounded hover:bg-gray-100 ${cell?.format.align === 'center' ? 'bg-gray-200' : ''}`} 
        onClick={() => handleAlignClick('center')}
        title="Align center"
      >
        <AlignCenter size={16} />
      </button>
      <button 
        className={`p-1 rounded hover:bg-gray-100 ${cell?.format.align === 'right' ? 'bg-gray-200' : ''}`} 
        onClick={() => handleAlignClick('right')}
        title="Align right"
      >
        <AlignRight size={16} />
      </button>
      <div className="h-4 w-px bg-gray-300 mx-1" />
      <button 
        className={`p-1 rounded hover:bg-gray-100 ${cell?.format.numberFormat === 'currency' ? 'bg-gray-200' : ''}`}
        onClick={() => handleNumberFormatClick('currency')}
        title="Currency format"
      >
        <DollarSign size={16} />
      </button>
      <button 
        className={`p-1 rounded hover:bg-gray-100 ${cell?.format.numberFormat === 'percent' ? 'bg-gray-200' : ''}`}
        onClick={() => handleNumberFormatClick('percent')}
        title="Percent format"
      >
        <Percent size={16} />
      </button>
      <div className="h-4 w-px bg-gray-300 mx-1" />
      <input
        type="color"
        value={cell?.format.color || '#000000'}
        onChange={(e) =>
          selectedCell && updateCellFormat(selectedCell, { color: e.target.value })
        }
        className="w-6 h-6 p-0 border-0 cursor-pointer"
        title="Text color"
      />
      <div className="h-4 w-px bg-gray-300 mx-1" />
      <button 
        className="p-1 rounded hover:bg-gray-100"
        onClick={toggleFindReplace}
        title="Find and replace"
      >
        <Search size={16} />
      </button>
      <div className="h-4 w-px bg-gray-300 mx-1" />
      <button 
        className="p-1 rounded hover:bg-gray-100"
        onClick={handleAddRow}
        title="Add row"
      >
        <Plus size={16} />
      </button>
      <button 
        className="p-1 rounded hover:bg-gray-100"
        onClick={handleDeleteRow}
        title="Delete row"
      >
        <Minus size={16} />
      </button>
      <button 
        className="p-1 rounded hover:bg-gray-100"
        onClick={handleAddColumn}
        title="Add column"
      >
        <Plus size={16} className="rotate-90" />
      </button>
      <button 
        className="p-1 rounded hover:bg-gray-100"
        onClick={handleDeleteColumn}
        title="Delete column"
      >
        <Minus size={16} className="rotate-90" />
      </button>
      <div className="h-4 w-px bg-gray-300 mx-1" />
      <button 
        className="p-1 rounded hover:bg-gray-100"
        onClick={removeDuplicateRows}
        title="Remove duplicates"
      >
        <Filter size={16} />
      </button>
      <div className="h-4 w-px bg-gray-300 mx-1" />
      <button 
        className="p-1 rounded hover:bg-gray-100"
        onClick={toggleChart}
        title="Create chart"
      >
        <BarChart size={16} />
      </button>
      <div className="h-4 w-px bg-gray-300 mx-1" />
      <button 
        className="p-1 rounded hover:bg-gray-100"
        onClick={handleSetDateValidation}
        title="Set date validation"
      >
        <span className="text-xs font-mono">Date</span>
      </button>
    </div>
  );
}