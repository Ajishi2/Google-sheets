import { Cell, CellValidation } from '../types/sheet';

type FormulaFunction = (args: (number | string | null)[]) => number | string | null;

const formulaFunctions: Record<string, FormulaFunction> = {
  SUM: (args) => {
    const validNumbers = args
      .map(arg => typeof arg === 'string' ? parseFloat(arg) : arg)
      .filter((n): n is number => n !== null && !isNaN(n));
    return validNumbers.length ? validNumbers.reduce((a, b) => a + b, 0) : null;
  },
  AVERAGE: (args) => {
    const validNumbers = args
      .map(arg => typeof arg === 'string' ? parseFloat(arg) : arg)
      .filter((n): n is number => n !== null && !isNaN(n));
    return validNumbers.length ? validNumbers.reduce((a, b) => a + b, 0) / validNumbers.length : null;
  },
  MAX: (args) => {
    const validNumbers = args
      .map(arg => typeof arg === 'string' ? parseFloat(arg) : arg)
      .filter((n): n is number => n !== null && !isNaN(n));
    return validNumbers.length ? Math.max(...validNumbers) : null;
  },
  MIN: (args) => {
    const validNumbers = args
      .map(arg => typeof arg === 'string' ? parseFloat(arg) : arg)
      .filter((n): n is number => n !== null && !isNaN(n));
    return validNumbers.length ? Math.min(...validNumbers) : null;
  },
  COUNT: (args) => args.filter((n) => n !== null && (typeof n === 'number' || !isNaN(parseFloat(n as string)))).length,
  TRIM: (args) => {
    if (args.length === 0) return null;
    const value = String(args[0] || '');
    return value.trim();
  },
  UPPER: (args) => {
    if (args.length === 0) return null;
    const value = String(args[0] || '');
    return value.toUpperCase();
  },
  LOWER: (args) => {
    if (args.length === 0) return null;
    const value = String(args[0] || '');
    return value.toLowerCase();
  }
};

// Helper to expand a range like "A1:B3" into individual cell references
export function expandRange(range: string): string[] {
  const match = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
  if (!match) return [range];

  const [, startCol, startRow, endCol, endRow] = match;
  const startColNum = colLetterToNumber(startCol);
  const endColNum = colLetterToNumber(endCol);
  const startRowNum = parseInt(startRow);
  const endRowNum = parseInt(endRow);

  const cells: string[] = [];
  for (let row = startRowNum; row <= endRowNum; row++) {
    for (let col = startColNum; col <= endColNum; col++) {
      cells.push(`${numberToColLetter(col)}${row}`);
    }
  }
  return cells;
}

// Convert column letter to number (A=1, B=2, etc.)
function colLetterToNumber(col: string): number {
  let result = 0;
  for (let i = 0; i < col.length; i++) {
    result = result * 26 + (col.charCodeAt(i) - 64);
  }
  return result;
}

// Convert number to column letter
function numberToColLetter(num: number): string {
  let result = '';
  while (num > 0) {
    const remainder = (num - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

export function evaluateFormula(formula: string, cells: Record<string, Cell>): number | string | null {
  try {
    // Check if it's a simple function call
    const functionMatch = formula.match(/^(\w+)\((.*)\)$/);
    if (functionMatch) {
      const [, functionName, args] = functionMatch;

      // Split by commas, but handle ranges with colons
      const argParts: string[] = [];
      let currentPart = '';
      let inQuotes = false;
      
      for (let i = 0; i < args.length; i++) {
        const char = args[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
          currentPart += char;
        } else if (char === ',' && !inQuotes) {
          argParts.push(currentPart.trim());
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      
      if (currentPart) {
        argParts.push(currentPart.trim());
      }

      // Process each argument, expanding ranges if needed
      const cellRefs: string[] = [];
      argParts.forEach(arg => {
        if (arg.includes(':')) {
          // It's a range, expand it
          cellRefs.push(...expandRange(arg));
        } else {
          cellRefs.push(arg);
        }
      });

      const values = cellRefs.map((ref) => {
        // Check if it's a direct value (number or string)
        if (/^-?\d+(\.\d+)?$/.test(ref)) {
          return parseFloat(ref);
        }
        
        // Check if it's a quoted string
        if ((ref.startsWith('"') && ref.endsWith('"')) || 
            (ref.startsWith("'") && ref.endsWith("'"))) {
          return ref.substring(1, ref.length - 1);
        }
        
        // Otherwise it's a cell reference
        const cell = cells[ref];
        if (!cell) return null;
        
        // If the cell has a computed value, use that
        if (cell.computed !== undefined && cell.computed !== null) {
          return typeof cell.computed === 'number' ? 
            cell.computed : 
            (parseFloat(cell.computed as string) || cell.computed);
        }
        
        // Otherwise try to parse the cell value
        const num = parseFloat(cell.value);
        return isNaN(num) ? cell.value : num;
      });

      // Handle data quality functions
      if (functionName === 'TRIM' || functionName === 'UPPER' || functionName === 'LOWER') {
        return formulaFunctions[functionName](values);
      }

      // Handle mathematical functions
      if (functionName in formulaFunctions) {
        return formulaFunctions[functionName](values);
      }
    }

    // If not a function, try to evaluate as a simple expression
    // This is a very basic implementation and doesn't handle complex expressions
    const cellRefRegex = /([A-Z]+[0-9]+)/g;
    let evalFormula = formula;
    
    // Replace all cell references with their values
    let match;
    while ((match = cellRefRegex.exec(formula)) !== null) {
      const cellRef = match[0];
      const cell = cells[cellRef];
      let cellValue = 0;
      
      if (cell) {
        if (cell.computed !== undefined && cell.computed !== null) {
          cellValue = typeof cell.computed === 'number' ? 
            cell.computed : 
            (parseFloat(cell.computed as string) || 0);
        } else {
          cellValue = parseFloat(cell.value) || 0;
        }
      }
      
      evalFormula = evalFormula.replace(cellRef, cellValue.toString());
    }
    
    // Safely evaluate the formula
    // Note: This is a simplified approach and not secure for production
    try {
      // eslint-disable-next-line no-eval
      return eval(evalFormula);
    } catch (e) {
      console.error('Error evaluating formula:', e);
      return null;
    }
  } catch (error) {
    console.error('Error in formula evaluation:', error);
    return null;
  }
}

// Function to find and replace text in a range of cells
export function findAndReplace(
  cells: Record<string, Cell>,
  findText: string,
  replaceText: string,
  options: { matchCase: boolean; matchEntireCell: boolean },
  range?: string[]
): Record<string, Cell> {
  const cellsToSearch = range ? range.map(id => cells[id]).filter(Boolean) : Object.values(cells);
  
  const newCells = { ...cells };
  
  cellsToSearch.forEach(cell => {
    if (!cell || !cell.value) return;
    
    let value = cell.value;
    let shouldReplace = false;
    
    if (options.matchEntireCell) {
      if (options.matchCase) {
        shouldReplace = value === findText;
      } else {
        shouldReplace = value.toLowerCase() === findText.toLowerCase();
      }
      
      if (shouldReplace) {
        newCells[cell.id] = {
          ...cell,
          value: replaceText,
          computed: cell.value.startsWith('=') ? null : undefined
        };
      }
    } else {
      let newValue;
      if (options.matchCase) {
        newValue = value.replace(new RegExp(escapeRegExp(findText), 'g'), replaceText);
      } else {
        newValue = value.replace(new RegExp(escapeRegExp(findText), 'gi'), replaceText);
      }
      
      if (newValue !== value) {
        newCells[cell.id] = {
          ...cell,
          value: newValue,
          computed: cell.value.startsWith('=') ? null : undefined
        };
      }
    }
  });
  
  return newCells;
}

// Helper function to escape special characters in regex
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Function to remove duplicate rows based on selected range
export function removeDuplicates(
  cells: Record<string, Cell>,
  range: string[]
): Record<string, Cell> {
  // First, organize cells by row
  const rowsMap = new Map<string, Map<string, Cell>>();
  
  range.forEach(cellId => {
    const cell = cells[cellId];
    if (!cell) return;
    
    // Extract row and column from cellId (e.g., "A1" -> row: "1", col: "A")
    const match = cellId. match(/([A-Z]+)(\d+)/);
    if (!match) return;
    
    const [, col, row] = match;
    
    if (!rowsMap.has(row)) {
      rowsMap.set(row, new Map());
    }
    
    rowsMap.get(row)!.set(col, cell);
  });
  
  // Convert rows to strings for comparison
  const rowStrings = new Map<string, string>();
  const uniqueRows = new Set<string>();
  const duplicateRows = new Set<string>();
  
  rowsMap.forEach((colMap, rowId) => {
    // Create a string representation of the row for comparison
    const rowValues = Array.from(colMap.entries())
      .sort(([colA], [colB]) => colLetterToNumber(colA) - colLetterToNumber(colB))
      .map(([, cell]) => cell.value)
      .join('|');
    
    rowStrings.set(rowId, rowValues);
    
    if (uniqueRows.has(rowValues)) {
      duplicateRows.add(rowId);
    } else {
      uniqueRows.add(rowValues);
    }
  });
  
  // If no duplicates found, return original cells
  if (duplicateRows.size === 0) {
    return cells;
  }
  
  // Create new cells object with duplicates removed
  const newCells = { ...cells };
  
  // Clear values in duplicate rows
  duplicateRows.forEach(rowId => {
    rowsMap.get(rowId)?.forEach((cell, colId) => {
      const cellId = `${colId}${rowId}`;
      if (newCells[cellId]) {
        newCells[cellId] = {
          ...newCells[cellId],
          value: '',
          computed: undefined
        };
      }
    });
  });
  
  return newCells;
}

// Validate cell value based on validation rules
export function validateCellValue(value: string, validation?: CellValidation): { valid: boolean; message?: string } {
  if (!validation) return { valid: true };
  
  // Allow blank if specified
  if (validation.allowBlank && (!value || value.trim() === '')) {
    return { valid: true };
  }
  
  switch (validation.type) {
    case 'number':
      const num = parseFloat(value);
      if (isNaN(num)) {
        return { valid: false, message: validation.errorMessage || 'Value must be a number' };
      }
      
      if (validation.criteria === 'greater') {
        return { 
          valid: num > parseFloat(validation.value as string), 
          message: validation.errorMessage || `Value must be greater than ${validation.value}`
        };
      } else if (validation.criteria === 'less') {
        return { 
          valid: num < parseFloat(validation.value as string), 
          message: validation.errorMessage || `Value must be less than ${validation.value}`
        };
      }
      return { valid: true };
      
    case 'text':
      if (validation.criteria === 'length') {
        const maxLength = parseInt(validation.value as string);
        return { 
          valid: value.length <= maxLength, 
          message: validation.errorMessage || `Text must be ${maxLength} characters or less`
        };
      }
      return { valid: true };
      
    case 'date':
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        return { valid: false, message: validation.errorMessage || 'Value must be a valid date' };
      }
      return { valid: true };
      
    case 'list':
      const allowedValues = validation.value as string[];
      return { 
        valid: allowedValues.includes(value), 
        message: validation.errorMessage || `Value must be one of: ${allowedValues.join(', ')}`
      };
      
    default:
      return { valid: true };
  }
}