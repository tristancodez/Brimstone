import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import MeetingsArea from './components/MeetingArea';
import TodoArea from './components/Todo';
import DashboardArea from './components/DashboardArea';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { ThemeProvider } from './context/ThemeContext';
import { AccessibilityProvider } from './context/AccessibilityContext';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('tabChange', handleTabChange as EventListener);

    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle Ctrl key combinations
      if (e.ctrlKey) {
        switch (e.key) {
          case '1':
            setActiveTab('dashboard');
            window.dispatchEvent(new CustomEvent('tabChange', { detail: 'dashboard' }));
            e.preventDefault();
            break;
          case '2':
            setActiveTab('chat');
            window.dispatchEvent(new CustomEvent('tabChange', { detail: 'chat' }));
            e.preventDefault();
            break;
          case '3':
            setActiveTab('meetings');
            window.dispatchEvent(new CustomEvent('tabChange', { detail: 'meetings' }));
            e.preventDefault();
            break;
          case '4':
            setActiveTab('todos');
            window.dispatchEvent(new CustomEvent('tabChange', { detail: 'todos' }));
            e.preventDefault();
            break;
          case 'd':
          case 'D':
            window.dispatchEvent(new CustomEvent('toggleTheme'));
            e.preventDefault();
            break;
          case '=':
          case '+':
            window.dispatchEvent(new CustomEvent('increaseFontSize'));
            e.preventDefault();
            break;
          case '-':
          case '_':
            window.dispatchEvent(new CustomEvent('decreaseFontSize'));
            e.preventDefault();
            break;
          case '0':
            window.dispatchEvent(new CustomEvent('resetFontSize'));
            e.preventDefault();
            break;
          case 's':
          case 'S':
            window.dispatchEvent(new CustomEvent('toggleScreenReader'));
            e.preventDefault();
            break;
          case 'k':
          case 'K':
            window.dispatchEvent(new CustomEvent('toggleShortcutsHelp'));
            e.preventDefault();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('tabChange', handleTabChange as EventListener);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);



  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardArea />;
      case 'chat':
        return <ChatArea />;
      case 'meetings':
        return <MeetingsArea />;
      case 'todos':
        return <TodoArea />;
      default:
        return <DashboardArea />;
    }
  };

  return (
    <AccessibilityProvider>
      <ThemeProvider>
        <div className="flex h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200">
          <a href="#main" className="skip-to-content">Skip to content</a>
          <Sidebar />
          <main id="main" className="flex-1 overflow-auto" tabIndex={-1}>
            {renderContent()}
          </main>
          <KeyboardShortcutsHelp />
        </div>
      </ThemeProvider>
    </AccessibilityProvider>
  );
}

export default App;