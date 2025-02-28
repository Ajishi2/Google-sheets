import React, { useState, useRef } from 'react';
import { useSheetStore } from '../store/useSheetStore';
import { saveSheetToFile, loadSheetFromFile } from '../utils/FileOperation';
import { Notification } from './Notification';


type FileMenuProps = {
  filename: string;
  setFilename: (name: string) => void;
};

export const FileMenu: React.FC<FileMenuProps> = ({ filename, setFilename }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const { state, loadState, resetState } = useSheetStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    setError(null);
  };

  const handleSave = () => {
    try {
      saveSheetToFile(state);
      setNotification({ type: 'success', message: 'Spreadsheet saved successfully!' });
      setIsOpen(false);
    } catch (err) {
      setNotification({ type: 'error', message: 'Failed to save file' });
      console.error('Save error:', err);
    }
  };

  const handleNew = () => {
    if (window.confirm('Create a new spreadsheet? Unsaved changes will be lost.')) {
      resetState();
      setFilename('Untitled spreadsheet');
      setNotification({ type: 'info', message: 'New spreadsheet created' });
      setIsOpen(false);
    }
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const newFilename = file.name.replace(/\.json$/, '');

    loadSheetFromFile(
      file,
      (loadedState) => {
        loadState(loadedState);
        setFilename(newFilename);
        setNotification({ type: 'success', message: `Spreadsheet "${newFilename}" loaded successfully!` });
        setIsOpen(false);
      },
      (errorMsg) => {
        setNotification({ type: 'error', message: errorMsg });
      }
    );

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <button 
        className="p-1 hover:bg-gray-200 rounded"
        onClick={toggleMenu}
      >
        File
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md border border-gray-200 z-50 w-48">
          <ul className="py-1">
            <li>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleNew}
              >
                New spreadsheet
              </button>
            </li>
            <li>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleLoadClick}
              >
                Open...
              </button>
              <input 
                type="file" 
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
            </li>
            <li>
              <button 
                className="w-full text-left px-4 py-2 hover:bg-gray-100"
                onClick={handleSave}
              >
                Save as...
              </button>
            </li>
          </ul>
        </div>
      )}

      {notification && (
        <Notification 
          type={notification.type} 
          message={notification.message} 
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};


// ✅ Now, every save, load, or error action will trigger a notification!
// Want me to add an undo feature or show a timestamp in the notification? Let me know! 🚀