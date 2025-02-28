import { create } from 'zustand';
import { produce } from 'immer';
import { Cell, SheetState, CellValidation } from '../types/sheet';
import { evaluateFormula, findAndReplace, removeDuplicates, validateCellValue } from '../utils/formulas';

const INITIAL_ROWS = 100;
const INITIAL_COLS = 26;

const createInitialState = (): SheetState => {
  const columns = Array.from({ length: INITIAL_COLS }, (_, i) => ({
    id: String.fromCharCode(65 + i),
    width: 100,
  }));

  const rows = Array.from({ length: INITIAL_ROWS }, (_, i) => ({
    id: (i + 1).toString(),
    height: 25,
  }));

  return {
    cells: {},
    columns,
    rows,
    selectedCell: null,
    selectedRange: null,
    formulaBarValue: '',
    findReplaceOpen: false,
    findReplaceOptions: {
      findText: '',
      replaceText: '',
      matchCase: false,
      matchEntireCell: false,
    },
    isDragging: false,
    dragStartCell: null,
    chartOpen: false,
    chartOptions: {
      type: 'bar',
      title: '',
      dataRange: '',
      labelRange: '',
    },
  };
};

// Helper function to recalculate all formulas
const recalculateFormulas = (cells: Record<string, Cell>) => {
  // First pass: mark all formula cells for recalculation
  Object.keys(cells).forEach(cellId => {
    const cell = cells[cellId];
    if (cell.value && cell.value.startsWith('=')) {
      cell.needsRecalculation = true;
    }
  });

  // Second pass: recalculate all formulas
  Object.keys(cells).forEach(cellId => {
    const cell = cells[cellId];
    if (cell.needsRecalculation) {
      cell.computed = evaluateFormula(cell.value.substring(1), cells);
      delete cell.needsRecalculation;
    }
  });
};

export const useSheetStore = create<{
  state: SheetState;
  setCellValue: (cellId: string, value: string) => void;
  setSelectedCell: (cellId: string | null) => void;
  setSelectedRange: (range: string[] | null) => void;
  updateCellFormat: (cellId: string, format: Partial<Cell['format']>) => void;
  setFormulaBarValue: (value: string) => void;
  addRow: (afterRowId: string) => void;
  deleteRow: (rowId: string) => void;
  addColumn: (afterColumnId: string) => void;
  deleteColumn: (columnId: string) => void;
  resizeRow: (rowId: string, height: number) => void;
  resizeColumn: (columnId: string, width: number) => void;
  toggleFindReplace: () => void;
  updateFindReplaceOptions: (options: Partial<SheetState['findReplaceOptions']>) => void;
  findAndReplaceText: () => void;
  removeDuplicateRows: () => void;
  setCellValidation: (cellId: string, validation: CellValidation) => void;
  validateCell: (value: string, validation: CellValidation) => { valid: boolean; message?: string };
  startDrag: (cellId: string) => void;
  endDrag: (targetCellId: string) => void;
  cancelDrag: () => void;
  toggleChart: () => void;
  updateChartOptions: (options: Partial<SheetState['chartOptions']>) => void;
  createChart: () => void;
  loadState: (newState: SheetState) => void;
  resetState: () => void;
}>((set, get) => ({
  state: createInitialState(),

  setCellValue: (cellId, value) =>
    set(
      produce((state) => {
        if (!state.state.cells[cellId]) {
          state.state.cells[cellId] = {
            id: cellId,
            value: '',
            formula: '',
            format: {
              bold: false,
              italic: false,
              fontSize: 12,
              color: '#000000',
              align: 'left',
            },
          };
        }

        const cell = state.state.cells[cellId];
        
        // If the cell has validation, check if the value is valid
        if (cell.validation) {
          const validationResult = validateCellValue(value, cell.validation);
          if (!validationResult.valid) {
            // In a real app, you might show a warning or prevent the change
            console.warn(`Validation failed: ${validationResult.message}`);
            // For this implementation, we'll still allow the change
          }
        }
        
        cell.value = value;

        if (value.startsWith('=')) {
          cell.formula = value;
          try {
            cell.computed = evaluateFormula(value.substring(1), state.state.cells);
          } catch (error) {
            console.error('Error evaluating formula:', error);
            cell.computed = '#ERROR';
          }
        } else {
          cell.formula = '';
          cell.computed = null;
        }

        // Recalculate all formulas that might depend on this cell
        recalculateFormulas(state.state.cells);
      })
    ),

  setSelectedCell: (cellId) =>
    set(
      produce((state) => {
        state.state.selectedCell = cellId;
        state.state.selectedRange = cellId ? [cellId] : null;
        if (cellId) {
          state.state.formulaBarValue = state.state.cells[cellId]?.value || '';
        } else {
          state.state.formulaBarValue = '';
        }
      })
    ),

  setSelectedRange: (range) =>
    set(
      produce((state) => {
        state.state.selectedRange = range;
        if (range && range.length > 0) {
          state.state.selectedCell = range[0];
          state.state.formulaBarValue = state.state.cells[range[0]]?.value || '';
        }
      })
    ),

  updateCellFormat: (cellId, format) =>
    set(
      produce((state) => {
        if (!state.state.cells[cellId]) {
          state.state.cells[cellId] = {
            id: cellId,
            value: '',
            formula: '',
            format: {
              bold: false,
              italic: false,
              fontSize: 12,
              color: '#000000',
              align: 'left',
            },
          };
        }
        Object.assign(state.state.cells[cellId].format, format);
      })
    ),

  setFormulaBarValue: (value) =>
    set(
      produce((state) => {
        state.state.formulaBarValue = value;
      })
    ),
    
  addRow: (afterRowId) =>
    set(
      produce((state) => {
        const rowIndex = state.state.rows.findIndex(row => row.id === afterRowId);
        if (rowIndex === -1) return;
        
        // Generate a new row ID (usually the next number)
        const newRowId = (parseInt(afterRowId) + 1).toString();
        
        // Shift all rows after this point
        for (let i = state.state.rows.length - 1; i > rowIndex; i--) {
          const currentRow = state.state.rows[i];
          const newId = (parseInt(currentRow.id) + 1).toString();
          
          // Update row ID
          state.state.rows[i].id = newId;
          
          // Move cell data
          Object.keys(state.state.cells).forEach(cellId => {
            if (cellId.match(new RegExp(`[A-Z]+${currentRow.id}$`))) {
              const colPart = cellId.match(/([A-Z]+)/)?.[0] || '';
              const newCellId = `${colPart}${newId}`;
              state.state.cells[newCellId] = {
                ...state.state.cells[cellId],
                id: newCellId
              };
              delete state.state.cells[cellId];
            }
          });
        }
        
        // Insert the new row
        state.state.rows.splice(rowIndex + 1, 0, {
          id: newRowId,
          height: 25
        });
        
        // Recalculate formulas that might reference shifted cells
        recalculateFormulas(state.state.cells);
      })
    ),
    
  deleteRow: (rowId) =>
    set(
      produce((state) => {
        const rowIndex = state.state.rows.findIndex(row => row.id === rowId);
        if (rowIndex === -1) return;
        
        // Remove the row
        state.state.rows.splice(rowIndex, 1);
        
        // Remove all cells in this row
        Object.keys(state.state.cells).forEach(cellId => {
          if (cellId.match(new RegExp(`[A-Z]+${rowId}$`))) {
            delete state.state.cells[cellId];
          }
        });
        
        // Shift all rows after this point
        for (let i = rowIndex; i < state.state.rows.length; i++) {
          const currentRow = state.state.rows[i];
          const oldId = currentRow.id;
          const newId = (parseInt(oldId) - 1).toString();
          
          // Update row ID
          state.state.rows[i].id = newId;
          
          // Move cell data
          Object.keys(state.state.cells).forEach(cellId => {
            if (cellId.match(new RegExp(`[A-Z]+${oldId}$`))) {
              const colPart = cellId.match(/([A-Z]+)/)?.[0] || '';
              const newCellId = `${colPart}${newId}`;
              state.state.cells[newCellId] = {
                ...state.state.cells[cellId],
                id: newCellId
              };
              delete state.state.cells[cellId];
            }
          });
        }
        
        // Recalculate formulas that might reference shifted cells
        recalculateFormulas(state.state.cells);
      })
    ),
    
  addColumn: (afterColumnId) =>
    set(
      produce((state) => {
        const colIndex = state.state.columns.findIndex(col => col.id === afterColumnId);
        if (colIndex === -1) return;
        
        // Generate a new column ID (next letter)
        const getNextColumnId = (id: string) => {
          const lastChar = id.charCodeAt(id.length - 1);
          if (lastChar === 90) { // 'Z'
            return id.slice(0, -1) + 'AA';
          } else {
            return id.slice(0, -1) + String.fromCharCode(lastChar + 1);
          }
        };
        
        const newColId = getNextColumnId(afterColumnId);
        
        // Shift all columns after this point
        for (let i = state.state.columns.length - 1; i > colIndex; i--) {
          const currentCol = state.state.columns[i];
          const newId = getNextColumnId(currentCol.id);
          
          // Update column ID
          state.state.columns[i].id = newId;
          
          // Move cell data
          Object.keys(state.state.cells).forEach(cellId => {
            const match = cellId.match(/([A-Z]+)(\d+)/);
            if (match && match[1] === currentCol.id) {
              const rowPart = match[2];
              const newCellId = `${newId}${rowPart}`;
              state.state.cells[newCellId] = {
                ...state.state.cells[cellId],
                id: newCellId
              };
              delete state.state.cells[cellId];
            }
          });
        }
        
        // Insert the new column
        state.state.columns.splice(colIndex + 1, 0, {
          id: newColId,
          width: 100
        });
        
        // Recalculate formulas that might reference shifted cells
        recalculateFormulas(state.state.cells);
      })
    ),
    
  deleteColumn: (columnId) =>
    set(
      produce((state) => {
        const colIndex = state.state.columns.findIndex(col => col.id === columnId);
        if (colIndex === -1) return;
        
        // Remove the column
        state.state.columns.splice(colIndex, 1);
        
        // Remove all cells in this column
        Object.keys(state.state.cells).forEach(cellId => {
          const match = cellId.match(/([A-Z]+)(\d+)/);
          if (match && match[1] === columnId) {
            delete state.state.cells[cellId];
          }
        });
        
        // Recalculate formulas that might reference deleted cells
        recalculateFormulas(state.state.cells);
      })
    ),
    
  resizeRow: (rowId, height) =>
    set(
      produce((state) => {
        const row = state.state.rows.find(r => r.id === rowId);
        if (row) {
          row.height = Math.max(15, height); // Minimum height
        }
      })
    ),
    
  resizeColumn: (columnId, width) =>
    set(
      produce((state) => {
        const column = state.state.columns.find(c => c.id === columnId);
        if (column) {
          column.width = Math.max(50, width); // Minimum width
        }
      })
    ),
    
  toggleFindReplace: () =>
    set(
      produce((state) => {
        state.state.findReplaceOpen = !state.state.findReplaceOpen;
      })
    ),
    
  updateFindReplaceOptions: (options) =>
    set(
      produce((state) => {
        state.state.findReplaceOptions = {
          ...state.state.findReplaceOptions,
          ...options
        };
      })
    ),
    
  findAndReplaceText: () =>
    set(
      produce((state) => {
        const { findText, replaceText, matchCase, matchEntireCell } = state.state.findReplaceOptions;
        
        if (!findText) return;
        
        state.state.cells = findAndReplace(
          state.state.cells,
          findText,
          replaceText,
          { matchCase, matchEntireCell },
          state.state.selectedRange
        );
        
        // Recalculate formulas that might be affected
        recalculateFormulas(state.state.cells);
      })
    ),
    
  removeDuplicateRows: () =>
    set(
      produce((state) => {
        if (!state.state.selectedRange || state.state.selectedRange.length < 2) {
          return; // Need at least 2 cells selected
        }
        
        state.state.cells = removeDuplicates(
          state.state.cells,
          state.state.selectedRange
        );
        
        // Recalculate formulas that might be affected
        recalculateFormulas(state.state.cells);
      })
    ),
    
  setCellValidation: (cellId, validation) =>
    set(
      produce((state) => {
        if (!state.state.cells[cellId]) {
          state.state.cells[cellId] = {
            id: cellId,
            value: '',
            formula: '',
            format: {
              bold: false,
              italic: false,
              fontSize: 12,
              color: '#000000',
              align: 'left',
            },
          };
        }
        
        state.state.cells[cellId].validation = validation;
        
        // Validate current value against new validation rules
        const validationResult = validateCellValue(
          state.state.cells[cellId].value,
          validation
        );
        
        if (!validationResult.valid) {
          console.warn(`Cell ${cellId} value doesn't meet validation criteria: ${validationResult.message}`);
        }
      })
    ),
    
  validateCell: (value, validation) => {
    return validateCellValue(value, validation);
  },
    
  startDrag: (cellId) =>
    set(
      produce((state) => {
        state.state.isDragging = true;
        state.state.dragStartCell = cellId;
      })
    ),
    
  endDrag: (targetCellId) =>
    set(
      produce((state) => {
        const { isDragging, dragStartCell } = state.state;
        
        if (isDragging && dragStartCell && targetCellId !== dragStartCell) {
          // Copy the source cell to the target cell
          const sourceCell = state.state.cells[dragStartCell];
          
          if (sourceCell) {
            // If the target cell doesn't exist, create it
            if (!state.state.cells[targetCellId]) {
              state.state.cells[targetCellId] = {
                id: targetCellId,
                value: '',
                formula: '',
                format: {
                  bold: false,
                  italic: false,
                  fontSize: 12,
                  color: '#000000',
                  align: 'left',
                },
              };
            }
            
            // Copy value and format
            state.state.cells[targetCellId].value = sourceCell.value;
            state.state.cells[targetCellId].formula = sourceCell.formula;
            state.state.cells[targetCellId].format = { ...sourceCell.format };
            
            // If it's a formula, recalculate
            if (sourceCell.value.startsWith('=')) {
              state.state.cells[targetCellId].computed = evaluateFormula(
                sourceCell.value.substring(1),
                state.state.cells
              );
            } else {
              state.state.cells[targetCellId].computed = sourceCell.computed;
            }
          }
        }
        
        // Reset drag state
        state.state.isDragging = false;
        state.state.dragStartCell = null;
        
        // Recalculate formulas that might be affected
        recalculateFormulas(state.state.cells);
      })
    ),
    
  cancelDrag: () =>
    set(
      produce((state) => {
        state.state.isDragging = false;
        state.state.dragStartCell = null;
      })
    ),

  toggleChart: () =>
    set(
      produce((state) => {
        state.state.chartOpen = !state.state.chartOpen;
      })
    ),

  updateChartOptions: (options) =>
    set(
      produce((state) => {
        state.state.chartOptions = {
          ...state.state.chartOptions,
          ...options
        };
      })
    ),

  createChart: () =>
    set(
      produce((state) => {
        // In a real implementation, this would create a chart based on the selected data
        // For now, we'll just close the chart dialog
        state.state.chartOpen = false;
      })
    ),
    loadState: (newState: SheetState) =>
      set(
        produce((state) => {
          // Replace the entire state with the loaded state
          state.state = newState;
          
          // Recalculate all formulas in the loaded state
          recalculateFormulas(state.state.cells);
        })
      ),
      
    resetState: () =>
      set(
        produce((state) => {
          state.state = createInitialState();
        })
      ),
  }));