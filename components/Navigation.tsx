import React from 'react';
import { AppTab, ThemeColor } from '../types';
import { Clock, List, BarChart2, MessageCircleHeart } from 'lucide-react';

interface NavigationProps {
  currentTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  themeColor: ThemeColor;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange, themeColor }) => {
  const navItems = [
    { id: AppTab.TRACKER, label: 'Registrar', icon: Clock },
    { id: AppTab.HISTORY, label: 'Histórico', icon: List },
    { id: AppTab.STATS, label: 'Gráficos', icon: BarChart2 },
    { id: AppTab.AI, label: 'Dicas IA', icon: MessageCircleHeart },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-${themeColor}-100 dark:border-slate-800 px-4 pb-safe pt-2 shadow-lg z-50 h-20 transition-colors duration-300`}>
      <div className="flex justify-around items-center h-full pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center w-16 transition-colors duration-200 ${
                isActive ? `text-${themeColor}-500 dark:text-${themeColor}-400` : `text-slate-400 hover:text-${themeColor}-300`
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs mt-1 font-medium ${isActive ? `text-${themeColor}-600 dark:text-${themeColor}-400` : ''}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;