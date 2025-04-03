import React, { createContext, useContext, useState, useEffect } from 'react';

interface AccessibilityContextType {
  screenReaderEnabled: boolean;
  toggleScreenReader: () => void;
  keyboardShortcutsEnabled: boolean;
  toggleKeyboardShortcuts: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(() => {
    const saved = localStorage.getItem('screenReader');
    return saved ? saved === 'true' : false;
  });

  const [keyboardShortcutsEnabled, setKeyboardShortcutsEnabled] = useState(() => {
    const saved = localStorage.getItem('keyboardShortcuts');
    return saved ? saved === 'true' : true;
  });

  useEffect(() => {
    document.documentElement.setAttribute('aria-live', screenReaderEnabled ? 'polite' : 'off');
    localStorage.setItem('screenReader', screenReaderEnabled ? 'true' : 'false');
  }, [screenReaderEnabled]);

  useEffect(() => {
    localStorage.setItem('keyboardShortcuts', keyboardShortcutsEnabled ? 'true' : 'false');
  }, [keyboardShortcutsEnabled]);

  // Set up keyboard shortcuts
  useEffect(() => {
    if (!keyboardShortcutsEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if Alt key is pressed
      if (!e.altKey) return;

      switch (e.key) {
        case 'd': // Alt+D: Toggle dark mode
          window.dispatchEvent(new CustomEvent('toggleTheme'));
          break;
        case '+': // Alt+Plus: Increase font size
          window.dispatchEvent(new CustomEvent('increaseFontSize'));
          break;
        case '-': // Alt+Minus: Decrease font size
          window.dispatchEvent(new CustomEvent('decreaseFontSize'));
          break;
        case '0': // Alt+0: Reset font size
          window.dispatchEvent(new CustomEvent('resetFontSize'));
          break;
        case 's': // Alt+S: Toggle screen reader
          setScreenReaderEnabled(prev => !prev);
          break;
        case '1': // Alt+1: Dashboard
        case '2': // Alt+2: Chat
        case '3': // Alt+3: Meetings
        case '4': // Alt+4: Todo List
        case '5': // Alt+5: Teams
          const tabIndex = parseInt(e.key) - 1;
          const tabs = ['dashboard', 'chat', 'meetings', 'todos', 'teams'];
          if (tabIndex >= 0 && tabIndex < tabs.length) {
            window.dispatchEvent(new CustomEvent('tabChange', { detail: tabs[tabIndex] }));
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keyboardShortcutsEnabled]);

  const toggleScreenReader = () => {
    setScreenReaderEnabled(prev => !prev);
  };

  const toggleKeyboardShortcuts = () => {
    setKeyboardShortcutsEnabled(prev => !prev);
  };

  return (
    <AccessibilityContext.Provider value={{
      screenReaderEnabled,
      toggleScreenReader,
      keyboardShortcutsEnabled,
      toggleKeyboardShortcuts
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};
