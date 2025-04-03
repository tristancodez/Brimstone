import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  isDark: boolean;
  fontSize: string;
  toggleTheme: () => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : false;
  });

  const [fontSize, setFontSize] = useState(() => {
    const savedSize = localStorage.getItem('fontSize');
    return savedSize || 'medium';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Apply font size to html element
    document.documentElement.setAttribute('data-font-size', fontSize);
    localStorage.setItem('fontSize', fontSize);
  }, [isDark, fontSize]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  const increaseFontSize = () => {
    setFontSize(prev => {
      switch (prev) {
        case 'small': return 'medium';
        case 'medium': return 'large';
        case 'large': return 'x-large';
        default: return prev;
      }
    });
  };

  const decreaseFontSize = () => {
    setFontSize(prev => {
      switch (prev) {
        case 'x-large': return 'large';
        case 'large': return 'medium';
        case 'medium': return 'small';
        default: return prev;
      }
    });
  };

  const resetFontSize = () => {
    setFontSize('medium');
  };

  return (
    <ThemeContext.Provider value={{ 
      isDark, 
      fontSize, 
      toggleTheme, 
      increaseFontSize, 
      decreaseFontSize, 
      resetFontSize 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};