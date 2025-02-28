import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSheetStore } from '../store/useSheetStore';

export function Sheet() {
  const {
    state,
    setSelectedCell,
    setSelectedRange,
    setCellValue,
    resizeRow,
    resizeColumn,
    startDrag,
    endDrag,
    cancelDrag,
    validateCell
  } = useSheetStore();
  
  const { cells, columns, rows, selectedCell, selectedRange, isDragging, dragStartCell } = state;
  
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isResizingRow, setIsResizingRow] = useState(false);
  const [isResizingColumn, setIsResizingColumn] = useState(false);
  const [resizeTarget, setResizeTarget] = useState<string | null>(null);
  const [initialSize, setInitialSize] = useState(0);
  const [initialPosition, setInitialPosition] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const tableRef = useRef<HTMLTableElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Handle cell selection
  const handleCellClick = (cellId: string, event: React.MouseEvent) => {
    if (isResizingRow || isResizingColumn) return;
    
    if (isDragging) {
      endDrag(cellId);
      return;
    }
    
    if (event.shiftKey && selectedCell) {
      // Range selection with shift key
      const selectedCellCol = selectedCell.match(/[A-Z]+/)?.[0] || '';
      const selectedCellRow = selectedCell.match(/\d+/)?.[0] || '';
      
      const clickedCellCol = cellId.match(/[A-Z]+/)?.[0] || '';
      const clickedCellRow = cellId.match(/\d+/)?.[0] || '';
      
      const startColIndex = columns.findIndex(col => col.id === selectedCellCol);
      const endColIndex = columns.findIndex(col => col.id === clickedCellCol);
      
      const startRowIndex = rows.findIndex(row => row.id === selectedCellRow);
      const endRowIndex = rows.findIndex(row => row.id === clickedCellRow);
      
      const minColIndex = Math.min(startColIndex, endColIndex);
      const maxColIndex = Math.max(startColIndex, endColIndex);
      
      const minRowIndex = Math.min(startRowIndex, endRowIndex);
      const maxRowIndex = Math.max(startRowIndex, endRowIndex);
      
      const range: string[] = [];
      
      for (let r = minRowIndex; r <= maxRowIndex; r++) {
        for (let c = minColIndex; c <= maxColIndex; c++) {
          range.push(`${columns[c].id}${rows[r].id}`);
        }
      }
      
      setSelectedRange(range);
    } else {
      setSelectedCell(cellId);
    }
  };
  
  // Handle double click to edit cell
  const handleCellDoubleClick = (cellId: string) => {
    setEditingCell(cellId);
    setEditValue(cells[cellId]?.value || '');
    setValidationError(null);
    
    // Focus the input after it's rendered
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 0);
  };
  
  // Handle cell edit input change
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
    setValidationError(null);
  };
  
  // Handle cell edit completion
  const handleEditComplete = () => {
    if (editingCell) {
      // Validate the input before setting the cell value
      const cell = cells[editingCell];
      if (cell?.validation) {
        const validationResult = validateCell(editValue, cell.validation);
        if (!validationResult.valid) {
          setValidationError(validationResult.message || 'Invalid input');
          return;
        }
      }
      
      setCellValue(editingCell, editValue);
      setEditingCell(null);
      setValidationError(null);
    }
  };
  
  // Handle key press in edit mode
  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditComplete();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setValidationError(null);
    }
  };
  
  // Handle click outside to finish editing
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (editingCell && editInputRef.current && !editInputRef.current.contains(e.target as Node)) {
        handleEditComplete();
      }
      
      if (isDragging && e.buttons !== 1) {
        cancelDrag();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mouseup', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mouseup', handleClickOutside);
    };
  }, [editingCell, isDragging, cancelDrag, editValue]);
  
  // Handle row resize
  const handleRowResizeStart = (e: React.MouseEvent, rowId: string, initialHeight: number) => {
    e.preventDefault();
    setIsResizingRow(true);
    setResizeTarget(rowId);
    setInitialSize(initialHeight);
    setInitialPosition(e.clientY);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingRow && resizeTarget) {
        const delta = e.clientY - initialPosition;
        const newHeight = Math.max(20, initialSize + delta);
        resizeRow(resizeTarget, newHeight);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizingRow(false);
      setResizeTarget(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle column resize
  const handleColumnResizeStart = (e: React.MouseEvent, colId: string, initialWidth: number) => {
    e.preventDefault();
    setIsResizingColumn(true);
    setResizeTarget(colId);
    setInitialSize(initialWidth);
    setInitialPosition(e.clientX);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingColumn && resizeTarget) {
        const delta = e.clientX - initialPosition;
        const newWidth = Math.max(50, initialSize + delta);
        resizeColumn(resizeTarget, newWidth);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizingColumn(false);
      setResizeTarget(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  // Handle cell drag start
  const handleCellDragStart = (cellId: string, e: React.MouseEvent) => {
    if (e.buttons !== 1) return; // Only primary mouse button
    
    // Don't start drag if we're resizing or editing
    if (isResizingRow || isResizingColumn || editingCell) return;
    
    // Don't start drag if we're clicking on an empty cell
    if (!cells[cellId]) return;
    
    startDrag(cellId);
  };
  
  // Handle select all click (top-left corner)
  const handleSelectAll = () => {
    const allCells: string[] = [];
    
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < columns.length; c++) {
        allCells.push(`${columns[c].id}${rows[r].id}`);
      }
    }
    
    setSelectedRange(allCells);
  };
  
  // Handle select column
  const handleSelectColumn = (colId: string) => {
    const columnCells: string[] = [];
    
    for (let r = 0; r < rows.length; r++) {
      columnCells.push(`${colId}${rows[r].id}`);
    }
    
    setSelectedRange(columnCells);
  };
  
  // Handle select row
  const handleSelectRow = (rowId: string) => {
    const rowCells: string[] = [];
    
    for (let c = 0; c < columns.length; c++) {
      rowCells.push(`${columns[c].id}${rowId}`);
    }
    
    setSelectedRange(rowCells);
  };
  
  // Render a cell
  const renderCell = useCallback(
    (colId: string, rowId: string) => {
      const cellId = `${colId}${rowId}`;
      const cell = cells[cellId];
      const isSelected = selectedCell === cellId;
      const isInRange = selectedRange?.includes(cellId);
      const isEditing = editingCell === cellId;
      
      // Determine cell alignment class
      let alignmentClass = 'text-left';
      if (cell?.format.align === 'center') alignmentClass = 'text-center';
      if (cell?.format.align === 'right') alignmentClass = 'text-right';
      
      // Format displayed value based on numberFormat
      let displayValue = cell?.computed !== undefined && cell?.computed !== null 
        ? cell.computed 
        : cell?.value || '';
        
      if (cell?.format.numberFormat === 'currency' && typeof displayValue === 'number') {
        displayValue = displayValue.toLocaleString('en-US', { 
          style: 'currency', 
          currency: 'USD' 
        });
      } else if (cell?.format.numberFormat === 'percent' && typeof displayValue === 'number') {
        displayValue = `${(displayValue * 100).toFixed(2)}%`;
      }
      
      return (
        <td
          key={cellId}
          className={`border border-gray-200 relative ${
            isSelected ? 'outline outline-2 outline-blue-500 z-10' : ''
          } ${isInRange ? 'bg-blue-50' : ''}`}
          onClick={(e) => handleCellClick(cellId, e)}
          onDoubleClick={() => handleCellDoubleClick(cellId)}
          onMouseDown={(e) => handleCellDragStart(cellId, e)}
          onMouseEnter={() => isDragging && dragStartCell !== cellId && endDrag(cellId)}
        >
          {isEditing ? (
            <div className="relative w-full h-full">
              <input
                ref={editInputRef}
                type="text"
                value={editValue}
                onChange={handleEditChange}
                onKeyDown={handleEditKeyDown}
                onBlur={handleEditComplete}
                className={`w-full h-full px-2 py-1 border-none focus:outline-none ${
                  validationError ? 'bg-red-50' : ''
                }`}
                style={{
                  fontWeight: cell?.format.bold ? 'bold' : 'normal',
                  fontStyle: cell?.format.italic ? 'italic' : 'normal',
                  fontSize: `${cell?.format.fontSize || 12}px`,
                  color: cell?.format.color || '#000000',
                }}
              />
              {validationError && (
                <div className="absolute top-full left-0 z-50 bg-red-100 text-red-800 text-xs p-1 rounded shadow-md">
                  {validationError}
                </div>
              )}
            </div>
          ) : (
            <div
              className={`h-full w-full px-2 py-1 overflow-hidden ${alignmentClass}`}
              style={{
                fontWeight: cell?.format.bold ? 'bold' : 'normal',
                fontStyle: cell?.format.italic ? 'italic' : 'normal',
                fontSize: `${cell?.format.fontSize || 12}px`,
                color: cell?.format.color || '#000000',
              }}
            >
              {displayValue}
            </div>
          )}
        </td>
      );
    },
    [cells, selectedCell, selectedRange, editingCell, editValue, setSelectedCell, isDragging, dragStartCell, startDrag, endDrag, validationError]
  );

  return (
    <div className="overflow-auto flex-1 bg-white">
      <table ref={tableRef} className="border-collapse w-full">
        <thead>
          <tr>
            <th 
              className="w-10 bg-gray-100 border border-gray-200 sticky top-0 left-0 z-20 cursor-pointer hover:bg-gray-200"
              onClick={handleSelectAll}
            >
              {/* Select all button */}
              <div className="w-4 h-4 m-auto border border-gray-400"></div>
            </th>
            {columns.map((col, index) => (
              <th
                key={col.id}
                className="bg-gray-100 border border-gray-200 font-normal px-2 py-1 text-sm text-gray-600 sticky top-0 z-10 relative group cursor-pointer hover:bg-gray-200"
                style={{ width: col.width }}
                onClick={() => handleSelectColumn(col.id)}
              >
                {col.id}
                <div
                  className="absolute top-0 right-0 w-1 h-full cursor-col-resize group-hover:bg-blue-400"
                  onMouseDown={(e) => handleColumnResizeStart(e, col.id, col.width)}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} style={{ height: row.height }} className="relative group">
              <td 
                className="bg-gray-100 border border-gray-200 text-center text-sm text-gray-600 sticky left-0 z-10 relative cursor-pointer hover:bg-gray-200"
                onClick={() => handleSelectRow(row.id)}
              >
                {row.id}
                <div
                  className="absolute bottom-0 left-0 w-full h-1 cursor-row-resize group-hover:bg-blue-400"
                  onMouseDown={(e) => handleRowResizeStart(e, row.id, row.height)}
                />
              </td>
              {columns.map((col) => renderCell(col.id, row.id))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}