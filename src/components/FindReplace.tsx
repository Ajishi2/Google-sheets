import React from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { X } from 'lucide-react';

export function FindReplace() {
  const { 
    state, 
    toggleFindReplace, 
    updateFindReplaceOptions, 
    findAndReplaceText 
  } = useSheetStore();
  
  const { findReplaceOpen, findReplaceOptions } = state;
  
  if (!findReplaceOpen) return null;
  
  return (
    <div className="absolute top-32 right-4 bg-white border border-gray-300 shadow-lg rounded-md w-80 z-50">
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="font-medium">Find and replace</h3>
        <button 
          className="p-1 rounded-full hover:bg-gray-100"
          onClick={toggleFindReplace}
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="p-3 space-y-3">
        <div>
          <label className="block text-sm mb-1">Find</label>
          <input 
            type="text"
            value={findReplaceOptions.findText}
            onChange={(e) => updateFindReplaceOptions({ findText: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="Text to find"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Replace with</label>
          <input 
            type="text"
            value={findReplaceOptions.replaceText}
            onChange={(e) => updateFindReplaceOptions({ replaceText: e.target.value })}
            className="w-full px-2 py-1 border rounded text-sm"
            placeholder="Replacement text"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center text-sm">
            <input 
              type="checkbox"
              checked={findReplaceOptions.matchCase}
              onChange={(e) => updateFindReplaceOptions({ matchCase: e.target.checked })}
              className="mr-1"
            />
            Match case
          </label>
          
          <label className="flex items-center text-sm">
            <input 
              type="checkbox"
              checked={findReplaceOptions.matchEntireCell}
              onChange={(e) => updateFindReplaceOptions({ matchEntireCell: e.target.checked })}
              className="mr-1"
            />
            Match entire cell
          </label>
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          <button 
            className="px-3 py-1 bg-gray-100 text-sm rounded hover:bg-gray-200"
            onClick={toggleFindReplace}
          >
            Cancel
          </button>
          <button 
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
            onClick={findAndReplaceText}
            disabled={!findReplaceOptions.findText}
          >
            Replace
          </button>
        </div>
      </div>
    </div>
  );
}