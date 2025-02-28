import { SheetState } from '../types/sheet';

export const saveSheetToFile = (state: SheetState) => {
  // Create a JSON blob from the current state
  const jsonState = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonState], { type: 'application/json' });
  
  // Create a downloadable URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link element and trigger download
  const link = document.createElement('a');
  link.href = url;
  link.download = 'spreadsheet.json';
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const loadSheetFromFile = (
  file: File, 
  onLoad: (state: SheetState) => void,
  onError: (error: string) => void
) => {
  const reader = new FileReader();
  
  reader.onload = (event) => {
    try {
      const content = event.target?.result as string;
      const parsedState = JSON.parse(content) as SheetState;
      
      // Validate essential structure of the loaded data
      if (!parsedState.cells || !parsedState.columns || !parsedState.rows) {
        throw new Error('Invalid spreadsheet file format');
      }
      
      onLoad(parsedState);
    } catch (error) {
      onError(`Failed to load spreadsheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  reader.onerror = () => {
    onError('Error reading file');
  };
  
  reader.readAsText(file);
};