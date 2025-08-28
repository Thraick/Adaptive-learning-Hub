
import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Target, Puzzle, MessageSquare, BookOpen, BrainCircuit, BarChart4, ChevronLeft, ChevronRight, Menu, X, Settings, Lightbulb, SpellCheck, Trophy, ClipboardCheck } from 'lucide-react';
import { DataProvider, useData } from './contexts/DataContext';
import { NotificationProvider } from './contexts/NotificationContext';
import Notification from './components/Notification';
import Dashboard from './pages/Dashboard';
import Assessment from './pages/Assessment';
import SpellingGame from './pages/SpellingGame';
import ChatTrainer from './pages/ChatTrainer';
import MemoryPalace from './pages/MemoryPalace';
import ProgressTracker from './pages/ProgressTracker';
import SettingsPage from './pages/Settings';
import Quizzes from './pages/Quizzes';
import LearningPlan from './pages/LearningPlan';
import Ranks from './pages/Ranks';

type Page = 'Dashboard' | 'Assessment' | 'Spelling Game' | 'Chat' | 'Memory Palace' | 'Progress' | 'Quizzes' | 'Learning Plan' | 'Ranks' | 'Settings';

const pageComponents: Record<Page, React.FC> = {
  'Dashboard': Dashboard,
  'Assessment': Assessment,
  'Spelling Game': SpellingGame,
  'Chat': ChatTrainer,
  'Memory Palace': MemoryPalace,
  'Progress': ProgressTracker,
  'Quizzes': Quizzes,
  'Learning Plan': LearningPlan,
  'Ranks': Ranks,
  'Settings': SettingsPage,
};

const navItems = [
  { name: 'Dashboard' as Page, icon: LayoutDashboard },
  { name: 'Assessment' as Page, icon: Target },
  { name: 'Spelling Game' as Page, icon: SpellCheck },
  { name: 'Chat' as Page, icon: MessageSquare },
  { name: 'Memory Palace' as Page, icon: BrainCircuit },
  { name: 'Quizzes' as Page, icon: Lightbulb },
  { name: 'Learning Plan' as Page, icon: ClipboardCheck },
  { name: 'Progress' as Page, icon: BarChart4 },
  { name: 'Ranks' as Page, icon: Trophy },
  { name: 'Settings' as Page, icon: Settings },
];

const Sidebar: React.FC<{
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
}> = ({ currentPage, setCurrentPage, isSidebarOpen, setSidebarOpen }) => {
  const mainNavItems = navItems.slice(0, -1);
  const settingsNavItem = navItems.slice(-1)[0];

  return (
    <aside className={`bg-gray-800 text-white transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} relative hidden md:flex flex-col`}>
      <div className="flex items-center justify-between p-4 h-16 border-b border-gray-700">
        <div className={`flex items-center gap-2 overflow-hidden transition-opacity ${isSidebarOpen ? 'opacity-100' : 'opacity-0'}`}>
            <BookOpen className="text-blue-500" />
            <span className="font-bold text-xl whitespace-nowrap">Learn Hub</span>
        </div>
      </div>
      <nav className="flex-1 px-2 py-4 flex flex-col">
        <div className="space-y-2">
            {mainNavItems.map((item) => (
            <button
                key={item.name}
                onClick={() => setCurrentPage(item.name)}
                className={`flex items-center p-3 rounded-lg w-full transition-colors ${
                currentPage === item.name
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700'
                }`}
            >
                <item.icon className="h-6 w-6" />
                <span className={`ml-4 transition-opacity duration-200 ${!isSidebarOpen && 'opacity-0'}`}>{item.name}</span>
            </button>
            ))}
        </div>
        <div className="mt-auto">
            <button
                key={settingsNavItem.name}
                onClick={() => setCurrentPage(settingsNavItem.name)}
                className={`flex items-center p-3 rounded-lg w-full transition-colors ${
                currentPage === settingsNavItem.name
                    ? 'bg-blue-600 text-white'
                    : 'hover:bg-gray-700'
                }`}
            >
                <settingsNavItem.icon className="h-6 w-6" />
                <span className={`ml-4 transition-opacity duration-200 ${!isSidebarOpen && 'opacity-0'}`}>{settingsNavItem.name}</span>
            </button>
        </div>
      </nav>
      <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="absolute -right-3 top-16 bg-gray-700 hover:bg-blue-600 p-1.5 rounded-full focus:outline-none">
        {isSidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  );
};


const AppContent: React.FC = () => {
  const { apiKey } = useData();
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!apiKey) {
        setCurrentPage('Settings');
    }
  }, [apiKey]);

  const CurrentPageComponent = useMemo(() => pageComponents[currentPage], [currentPage]);

  if (!apiKey) {
    return (
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <SettingsPage />
        </main>
    );
  }

  return (
    <div className="flex h-screen bg-gray-900 text-gray-200 font-sans">
        <Sidebar
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            isSidebarOpen={isSidebarOpen}
            setSidebarOpen={setSidebarOpen}
        />

        {/* Mobile Menu */}
        <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(true)} className="p-4 fixed top-2 left-2 z-20 bg-gray-800 rounded-full">
                <Menu />
            </button>
            <div className={`fixed inset-0 bg-gray-800 z-30 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out`}>
                <div className="flex justify-between items-center p-4 border-b border-gray-700">
                    <span className="font-bold text-xl">Learn Hub</span>
                    <button onClick={() => setMobileMenuOpen(false)}><X /></button>
                </div>
                <nav className="p-4">
                    {navItems.map((item) => (
                        <button
                            key={item.name}
                            onClick={() => {
                                setCurrentPage(item.name);
                                setMobileMenuOpen(false);
                            }}
                            className={`flex items-center p-3 rounded-lg w-full text-left ${currentPage === item.name ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
                        >
                            <item.icon className="h-5 w-5 mr-3" />
                            {item.name}
                        </button>
                    ))}
                </nav>
            </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
            <CurrentPageComponent />
        </main>
    </div>
  );
};


const App: React.FC = () => {
  return (
    <DataProvider>
      <NotificationProvider>
        <AppContent />
        <Notification />
      </NotificationProvider>
    </DataProvider>
  );
}

export default App;
