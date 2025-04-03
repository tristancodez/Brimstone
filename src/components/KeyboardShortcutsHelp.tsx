import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const KeyboardShortcutsHelp: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { } = useTheme();
  
  useEffect(() => {
    // Listen for the custom event from the sidebar
    const handleToggleShortcuts = () => setIsOpen(prev => !prev);
    window.addEventListener('toggleShortcutsHelp', handleToggleShortcuts);
    
    // Close on escape key
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscKey);
    
    return () => {
      window.removeEventListener('toggleShortcutsHelp', handleToggleShortcuts);
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen]);

  const shortcuts = [
    { key: 'Ctrl+D', description: 'Toggle dark/light mode' },
    { key: 'Ctrl++', description: 'Increase font size' },
    { key: 'Ctrl+-', description: 'Decrease font size' },
    { key: 'Ctrl+0', description: 'Reset font size' },
    { key: 'Ctrl+S', description: 'Toggle screen reader support' },
    { key: 'Ctrl+1', description: 'Navigate to Dashboard' },
    { key: 'Ctrl+2', description: 'Navigate to Chat' },
    { key: 'Ctrl+3', description: 'Navigate to Meetings' },
    { key: 'Ctrl+4', description: 'Navigate to Todo List' },
    { key: 'Ctrl+5', description: 'Navigate to Teams' },
    { key: 'Tab', description: 'Navigate between interactive elements' },
    { key: 'Shift+Tab', description: 'Navigate backwards' },
    { key: 'Enter/Space', description: 'Activate focused element' },
  ];

  return (
    <>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="shortcuts-title">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full mx-4 p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 id="shortcuts-title" className="text-xl font-semibold text-gray-800 dark:text-dark-text-primary">Keyboard Shortcuts</h2>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-gray-500 dark:text-dark-text-secondary hover:text-gray-700 dark:hover:text-dark-text-primary focus-ring rounded"
                aria-label="Close keyboard shortcuts dialog"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="divide-y divide-gray-200 dark:divide-dark-border">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="py-3 flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded text-sm font-mono">
                    {shortcut.key}
                  </kbd>
                  <span className="text-gray-700 dark:text-dark-text-secondary ml-4 flex-1 text-right">
                    {shortcut.description}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-sm text-gray-500 dark:text-dark-text-muted">
              <p>Press <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-dark-bg border border-gray-300 dark:border-dark-border rounded text-xs font-mono">Esc</kbd> to close this dialog.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default KeyboardShortcutsHelp;
