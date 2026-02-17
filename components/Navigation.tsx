
import React from 'react';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: '🏠' },
    { id: 'projects', label: 'Missions', icon: '📋' },
    { id: 'chat', label: 'Assistant', icon: '🎓' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around items-center py-2 px-4 safe-area-bottom z-50 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)]">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex flex-col items-center p-2 rounded-lg transition-all duration-300 ${
            activeTab === tab.id ? 'text-emerald-600 scale-110' : 'text-slate-400'
          }`}
        >
          <span className="text-xl mb-1">{tab.icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;
