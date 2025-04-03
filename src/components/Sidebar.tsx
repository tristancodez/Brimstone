import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, Calendar, Settings, Search, Menu, CheckSquare, 
  LayoutDashboard, Moon, Sun, ZoomIn, ZoomOut, Accessibility, Bell, ChevronRight, HelpCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAccessibility } from '../context/AccessibilityContext';

interface NavItemProps {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  shortcut?: string;
  badge?: number;
}

const NavItem: React.FC<NavItemProps> = ({ 
  icon, text, active, onClick, ariaLabel, shortcut, badge 
}) => (
  <div 
    className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200
      ${active 
        ? 'bg-gradient-to-r from-purple-500/20 to-purple-500/5 dark:from-purple-600/20 dark:to-purple-600/5 border-l-4 border-purple-600 dark:border-purple-500' 
        : 'hover:bg-purple-50 dark:hover:bg-dark-card/60 border-l-4 border-transparent'
      } focus-ring`}
    onClick={onClick}
    role="button"
    tabIndex={0}
    aria-label={ariaLabel || text}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick && onClick();
      }
    }}
  >
    <div className={`${active 
      ? 'text-purple-700 dark:text-purple-400' 
      : 'text-gray-600 dark:text-dark-text-secondary'}`}>
      {icon}
    </div>
    <span className={`ml-3 text-sm-dynamic transition-colors duration-200 ${
      active 
        ? 'font-medium text-purple-800 dark:text-purple-300' 
        : 'text-gray-700 dark:text-dark-text-primary'
    }`}>{text}</span>
    
    {badge !== undefined && badge > 0 && (
      <span className="ml-auto flex items-center justify-center w-5 h-5 text-xs bg-red-500 text-white rounded-full">
        {badge > 99 ? '99+' : badge}
      </span>
    )}
    
    {shortcut && !badge && (
      <span className="ml-auto text-xs text-gray-500 dark:text-dark-text-muted px-1.5 py-0.5 bg-gray-100 dark:bg-dark-bg/60 rounded">
        {shortcut}
      </span>
    )}
  </div>
);

const Sidebar: React.FC = () => {
  const { isDark, toggleTheme, increaseFontSize, decreaseFontSize } = useTheme();
  const { screenReaderEnabled, toggleScreenReader } = useAccessibility();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Mock notifications for UI enhancement
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New message from Alex", read: false, time: "10m ago" },
    { id: 2, title: "Meeting starts in 15 minutes", read: false, time: "15m ago" },
    { id: 3, title: "Task deadline approaching", read: true, time: "1h ago" },
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    window.dispatchEvent(new CustomEvent('tabChange', { detail: tab }));
  };

  // Listen for global theme toggle events
  useEffect(() => {
    const handleToggleTheme = () => toggleTheme();
    const handleIncreaseFontSize = () => increaseFontSize();
    const handleDecreaseFontSize = () => decreaseFontSize();

    window.addEventListener('toggleTheme', handleToggleTheme);
    window.addEventListener('increaseFontSize', handleIncreaseFontSize);
    window.addEventListener('decreaseFontSize', handleDecreaseFontSize);

    return () => {
      window.removeEventListener('toggleTheme', handleToggleTheme);
      window.removeEventListener('increaseFontSize', handleIncreaseFontSize);
      window.removeEventListener('decreaseFontSize', handleDecreaseFontSize);
    };
  }, [toggleTheme, increaseFontSize, decreaseFontSize]);

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} h-screen bg-white dark:bg-dark-card border-r border-gray-200 dark:border-dark-border flex flex-col transition-all duration-300 ease-in-out shadow-sm`}>
      <div className="p-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">
              B
            </div>
            <span className="ml-2 font-semibold text-gray-800 dark:text-dark-text-primary">Brimstone</span>
          </div>
        )}
        
        <div className="flex items-center">
          {!collapsed && (
            <div className="relative mr-2">
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg relative"
                aria-label="Notifications"
              >
                <Bell size={20} className="text-gray-600 dark:text-dark-text-secondary" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border z-10 max-h-[80vh] overflow-hidden">
                  <div className="p-3 border-b border-gray-200 dark:border-dark-border flex justify-between items-center">
                    <h3 className="font-medium text-gray-800 dark:text-dark-text-primary">Notifications</h3>
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map(notification => (
                      <div 
                        key={notification.id}
                        className={`p-3 border-b border-gray-100 dark:border-dark-border/50 hover:bg-gray-50 dark:hover:bg-dark-bg/50 cursor-pointer ${
                          !notification.read ? 'bg-purple-50 dark:bg-purple-900/10' : ''
                        }`}
                      >
                        <div className="flex items-start">
                          {!notification.read && (
                            <div className="h-2 w-2 mt-1.5 bg-purple-600 rounded-full mr-2 flex-shrink-0"></div>
                          )}
                          <div className="flex-1">
                            <p className={`text-sm ${!notification.read ? 'font-medium text-gray-800 dark:text-dark-text-primary' : 'text-gray-600 dark:text-dark-text-secondary'}`}>
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-2 text-center">
                    <button className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-bg"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={20} className="text-gray-600 dark:text-dark-text-secondary" />
            ) : (
              <Menu size={20} className="text-gray-600 dark:text-dark-text-secondary" />
            )}
          </button>
        </div>
      </div>
      
      {!collapsed && (
        <div className="relative mx-4 mt-4">
          <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-dark-text-muted" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-dark-bg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:text-dark-text-primary text-sm-dynamic"
            aria-label="Search"
          />
        </div>
      )}
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          <NavItem 
            icon={<LayoutDashboard size={collapsed ? 24 : 20} />} 
            text={collapsed ? "" : "Dashboard"} 
            active={activeTab === 'dashboard'}
            onClick={() => handleTabClick('dashboard')}
            shortcut={collapsed ? "" : "Ctrl+1"}
          />
          <NavItem 
            icon={<MessageSquare size={collapsed ? 24 : 20} />} 
            text={collapsed ? "" : "Chat"} 
            active={activeTab === 'chat'}
            onClick={() => handleTabClick('chat')}
            shortcut={collapsed ? "" : "Ctrl+2"}
            badge={collapsed ? 0 : 3}
          />
          <NavItem 
            icon={<Calendar size={collapsed ? 24 : 20} />} 
            text={collapsed ? "" : "Meetings"} 
            active={activeTab === 'meetings'}
            onClick={() => handleTabClick('meetings')}
            shortcut={collapsed ? "" : "Ctrl+3"}
            badge={collapsed ? 0 : 1}
          />
          <NavItem 
            icon={<CheckSquare size={collapsed ? 24 : 20} />} 
            text={collapsed ? "" : "Todo List"} 
            active={activeTab === 'todos'}
            onClick={() => handleTabClick('todos')}
            shortcut={collapsed ? "" : "Ctrl+4"}
          />
    
        </div>

        {!collapsed && (
          <div className="mt-8 border-t border-gray-200 dark:border-dark-border pt-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider mb-2 px-3">
              Accessibility
            </h3>
            <div className="space-y-1">
              <NavItem 
                icon={isDark ? <Sun size={20} /> : <Moon size={20} />} 
                text={isDark ? "Light Mode" : "Dark Mode"} 
                onClick={toggleTheme}
                ariaLabel="Toggle dark mode"
              />
              <NavItem 
                icon={<ZoomIn size={20} />} 
                text="Increase Font" 
                onClick={increaseFontSize}
                ariaLabel="Increase font size"
                shortcut="Ctrl++"
              />
              <NavItem 
                icon={<ZoomOut size={20} />} 
                text="Decrease Font" 
                onClick={decreaseFontSize}
                ariaLabel="Decrease font size"
                shortcut="Ctrl+-"
              />
              <NavItem 
                icon={<Accessibility size={20} />} 
                text="Screen Reader" 
                onClick={toggleScreenReader}
                ariaLabel="Toggle screen reader"
                active={screenReaderEnabled}
              />
            </div>
            
            <h3 className="text-xs font-semibold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider mb-2 px-3 mt-4">
              Help
            </h3>
            <div className="space-y-1">
              <NavItem 
                icon={<HelpCircle size={20} />} 
                text="Keyboard Shortcuts" 
                onClick={() => window.dispatchEvent(new CustomEvent('toggleShortcutsHelp'))}
                ariaLabel="Show keyboard shortcuts"
              />
            </div>
          </div>
        )}
      </div>

      <div className={`p-4 border-t border-gray-200 dark:border-dark-border ${collapsed ? 'flex justify-center' : ''}`}>
        {collapsed ? (
          <div className="relative group">
            <img
              src="https://api.dicebear.com/7.x/avatars/svg?seed=user"
              alt="User"
              className="w-10 h-10 rounded-full border-2 border-purple-200 dark:border-purple-900/30"
            />
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-card rounded-full"></div>
            
            <div className="absolute left-full ml-2 bottom-0 w-48 bg-white dark:bg-dark-card rounded-lg shadow-lg border border-gray-200 dark:border-dark-border p-3 invisible group-hover:visible transition-all duration-200 opacity-0 group-hover:opacity-100 z-10">
              <p className="font-medium text-gray-800 dark:text-dark-text-primary">User</p>
              <p className="text-sm text-gray-500 dark:text-dark-text-secondary truncate">user@example.com</p>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-dark-border">
                <button className="w-full text-left py-1 text-sm text-gray-700 dark:text-dark-text-primary hover:text-purple-600 dark:hover:text-purple-400">
                  Settings
                </button>
                <button 
                  className="w-full text-left py-1 text-sm text-gray-700 dark:text-dark-text-primary hover:text-purple-600 dark:hover:text-purple-400"
                >
                  Profile
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center mb-4">
              <div className="relative">
                <img
                  src="https://cdn-icons-png.flaticon.com/512/64/64572.png"
                  alt="User"
                  className="w-10 h-10 rounded-full border-2 border-purple-200 dark:border-purple-900/30"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-dark-card rounded-full"></div>
              </div>
              <div className="ml-3">
                <p className="font-medium text-gray-800 dark:text-dark-text-primary text-sm-dynamic">User</p>
                <p className="text-sm text-gray-500 dark:text-dark-text-secondary text-xs-dynamic truncate">user@example.com</p>
              </div>
            </div>
            <div className="space-y-1">
              <NavItem icon={<Settings size={20} />} text="Settings" />
              <NavItem icon={<Settings size={20} />} text="Profile" />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Sidebar;