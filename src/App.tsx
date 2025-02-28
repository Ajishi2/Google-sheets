import React, { useState, useRef, useEffect } from 'react';
import { Toolbar } from './components/Toolbar';
import { FormulaBar } from './components/FormulaBar';
import { Sheet } from './components/Sheet';
import { FindReplace } from './components/FindReplace';
import Chart from './components/Chart';
import { FileMenu } from './components/FileMenu';
import { Notification } from './components/Notification';

function App() {
  const [filename, setFilename] = useState('Untitled spreadsheet');
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [showComments, setShowComments] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  const handleFileAction = (action: string) => {
    setNotification({ message: `File ${action} successfully`, type: 'success' });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = (menuName: string) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  // Dropdown menu data structure
  const menuItems = {
    edit: [
      { label: 'Undo', shortcut: '⌘Z' },
      { label: 'Redo', shortcut: '⌘Y' },
      { divider: true },
      { label: 'Cut', shortcut: '⌘X' },
      { label: 'Copy', shortcut: '⌘C' },
      { label: 'Paste', shortcut: '⌘V' },
      { label: 'Paste special', submenu: true },
      { divider: true },
      { label: 'Find and replace', shortcut: '⌘F' },
      { label: 'Delete values', shortcut: '⌘Delete' },
      { divider: true },
      { label: 'Comment', shortcut: '⌘Alt+M' },
    ],
    view: [
      { label: 'Freeze', submenu: true },
      { divider: true },
      { label: 'Formulas', shortcut: '⌘`' },
      { divider: true },
      { label: 'Gridlines', checked: true },
      { label: 'Protected ranges', checked: true },
      { divider: true },
      { label: 'Hidden sheets', submenu: true },
      { divider: true },
      { label: 'Full screen', shortcut: '⌘Shift+F' },
    ],
    insert: [
      { label: 'Row above' },
      { label: 'Row below' },
      { label: 'Column left' },
      { label: 'Column right' },
      { divider: true },
      { label: 'Cells', shortcut: '⌘Alt+I, E' },
      { divider: true },
      { label: 'Chart', submenu: true },
      { label: 'Image', submenu: true },
      { label: 'Drawing' },
      { label: 'Form' },
      { divider: true },
      { label: 'Function', shortcut: '⌘Alt+I, F' },
      { label: 'Note', shortcut: '⌘Alt+I, N' },
      { label: 'Comment', shortcut: '⌘Alt+M' },
    ],
    format: [
      { label: 'Number', submenu: true },
      { divider: true },
      { label: 'Bold', shortcut: '⌘B' },
      { label: 'Italic', shortcut: '⌘I' },
      { label: 'Underline', shortcut: '⌘U' },
      { label: 'Strikethrough', shortcut: '⌘Shift+X' },
      { divider: true },
      { label: 'Font size', submenu: true },
      { divider: true },
      { label: 'Cell', submenu: true },
      { label: 'Text wrapping', submenu: true },
      { label: 'Rotation', submenu: true },
    ],
    data: [
      { label: 'Named ranges' },
      { label: 'Protected sheets and ranges' },
      { divider: true },
      { label: 'Data validation' },
      { divider: true },
      { label: 'Sort range', submenu: true },
      { label: 'Create a filter' },
      { divider: true },
      { label: 'Pivot table' },
    ],
    tools: [
      { label: 'Spelling and grammar', shortcut: '⌘Alt+X' },
      { divider: true },
      { label: 'Notification rules' },
      { label: 'Macros', submenu: true },
      { divider: true },
      { label: 'Script editor' },
    ],
    extensions: [
      { label: 'Apps Script' },
      { label: 'Google Workspace Marketplace' },
      { divider: true },
      { label: 'Add-ons', submenu: true },
    ],
    help: [
      { label: 'Search the menus', shortcut: '⌘/' },
      { divider: true },
      { label: 'Sheets Help' },
      { label: 'Training' },
      { divider: true },
      { label: 'Updates' },
      { divider: true },
      { label: 'Help Sheets improve' },
      { label: 'Report a problem' },
      { label: 'Report abuse/copyright' },
      { divider: true },
      { label: 'Keyboard shortcuts', shortcut: '⌘/' },
    ],
  };

  // Dropdown menu component
  const MenuDropdown = ({ items, menuName }: { items: any[]; menuName: string }) => {
    return (
      <div className="absolute top-full left-0 bg-white shadow-lg border border-gray-200 rounded-md min-w-48 z-50">
        {items.map((item, index) =>
          item.divider ? (
            <div key={`${menuName}-divider-${index}`} className="border-t border-gray-200 my-1"></div>
          ) : (
            <div
              key={`${menuName}-item-${index}`}
              className="px-4 py-2 text-sm hover:bg-blue-50 flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center">
                {item.checked && <span className="mr-2 text-blue-600">✓</span>}
                <span>{item.label}</span>
              </div>
              <div className="flex items-center">
                {item.shortcut && <span className="text-gray-500 text-xs ml-6">{item.shortcut}</span>}
                {item.submenu && (
                  <span className="ml-4 text-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                    </svg>
                  </span>
                )}
              </div>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-700">
      {notification.message && <Notification message={notification.message} type={notification.type} />}

      {/* Header section - more Google Sheets-like */}
      <div className="bg-white border-b border-gray-200">
        {/* Top header with logo, filename, and sharing */}
        <div className="flex items-center px-3 py-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-green-600 rounded flex items-center justify-center text-white text-xl font-medium shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm0 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
              </svg>
            </div>
            <div className="flex flex-col">
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="text-lg font-normal bg-transparent border-none hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:ring-1 focus:ring-gray-200 rounded px-2 py-1 transition-all duration-200 w-60"
                placeholder="Enter filename"
              />
              <div className="flex text-xs text-gray-500 px-2">
                <span>All changes saved in Drive</span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center mr-2">
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
                </svg>
              </button>
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </button>
              <button
                className={`p-2 rounded-full ${showComments ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                onClick={() => setShowComments(!showComments)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
                </svg>
              </button>
            </div>
            <button className="h-9 px-3 py-1 text-sm bg-gray-100 border border-gray-300 text-gray-800 rounded-md hover:bg-gray-200">
              <i className="fas fa-clock mr-1"></i>Last edit was seconds ago
            </button>
            <button className="h-9 px-6 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium">
              Share
            </button>
          </div>
        </div>

        {/* Menu bar - Google Sheets style with dropdowns */}
        <div className="flex border-t border-gray-200 relative" ref={menuRef}>
          <FileMenu filename={filename} setFilename={setFilename} onFileAction={handleFileAction} />

          {/* Dynamic menu buttons with dropdowns */}
          {Object.keys(menuItems).map((menuName) => (
            <div key={menuName} className="relative">
              <button
                className={`px-3 py-2 text-sm ${activeMenu === menuName ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}
                onClick={() => toggleMenu(menuName)}
              >
                {menuName.charAt(0).toUpperCase() + menuName.slice(1)}
              </button>
              {activeMenu === menuName && <MenuDropdown items={menuItems[menuName as keyof typeof menuItems]} menuName={menuName} />}
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar - Google style */}
      <Toolbar />

      {/* Formula bar - Google style */}
      <FormulaBar />

      <div className="h-screen flex flex-col">
        <div className="relative flex-1 overflow-auto">
          <Sheet />
          <FindReplace />
          <Chart />
        </div>

        {/* Status bar - Google style */}
        <div className="sticky bottom-0 left-0 right-0 flex items-center justify-between px-4 py-1 bg-gray-100 border-t border-gray-300 text-xs text-gray-600">
          <div className="flex items-center">
            <span>Sheet1</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:bg-gray-200 p-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
              </svg>
            </button>
            <button className="hover:bg-gray-200 p-1 rounded">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-2V9h-2V7h4v10z" />
              </svg>
            </button>
            <span>Zoom 100%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;