export interface Cell {
  id: string;
  value: string;
  formula: string;
  format: CellFormat;
  computed?: number | string | null;
  needsRecalculation?: boolean;
  validation?: CellValidation;
}

export interface CellFormat {
  bold: boolean;
  italic: boolean;
  fontSize: number;
  color: string;
  align?: 'left' | 'center' | 'right';
  numberFormat?: 'general' | 'currency' | 'percent' | 'date';
}

export interface CellValidation {
  type: 'text' | 'number' | 'date' | 'list';
  criteria?: string;
  value?: string | string[];
  allowBlank?: boolean;
  showDropdown?: boolean;
  errorMessage?: string;
}

export interface Column {
  id: string;
  width: number;
}

export interface Row {
  id: string;
  height: number;
}

export interface SheetState {
  cells: Record<string, Cell>;
  columns: Column[];
  rows: Row[];
  selectedCell: string | null;
  selectedRange: string[] | null;
  formulaBarValue: string;
  findReplaceOpen: boolean;
  findReplaceOptions: {
    findText: string;
    replaceText: string;
    matchCase: boolean;
    matchEntireCell: boolean;
  };
  isDragging: boolean;
  dragStartCell: string | null;
  chartOpen: boolean;
  chartOptions: {
    type: 'bar' | 'line' | 'pie';
    title: string;
    dataRange: string;
    labelRange: string;
  };
}