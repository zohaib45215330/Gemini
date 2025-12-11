import React, { useState } from 'react';
import { MessageSquare, Eye, Mic, Github, Command } from 'lucide-react';
import { AppTab } from './types';
import { ChatInterface } from './components/ChatInterface';
import { VisionInterface } from './components/VisionInterface';
import { LiveInterface } from './components/LiveInterface';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      
      {/* Sidebar Navigation */}
      <nav className="w-20 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 transition-all">
        <div>
          <div className="h-16 flex items-center justify-center md:justify-start md:px-6 border-b border-slate-800">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Command className="text-white w-5 h-5" />
            </div>
            <span className="hidden md:block ml-3 font-bold text-lg tracking-tight text-white">Gemini Nexus</span>
          </div>

          <div className="p-3 space-y-2 mt-4">
            <NavButton 
              active={activeTab === AppTab.CHAT} 
              onClick={() => setActiveTab(AppTab.CHAT)} 
              icon={<MessageSquare size={20} />} 
              label="Text Chat" 
            />
            <NavButton 
              active={activeTab === AppTab.VISION} 
              onClick={() => setActiveTab(AppTab.VISION)} 
              icon={<Eye size={20} />} 
              label="Vision Analysis" 
            />
            <NavButton 
              active={activeTab === AppTab.LIVE} 
              onClick={() => setActiveTab(AppTab.LIVE)} 
              icon={<Mic size={20} />} 
              label="Live Voice" 
              isNew
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center justify-center md:justify-start gap-3 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer">
                <Github size={20} />
                <span className="hidden md:inline text-sm font-medium">View Source</span>
            </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950 relative">
        <header className="h-16 border-b border-slate-800 flex items-center px-6 bg-slate-900/50 backdrop-blur-sm z-10 justify-between">
            <h1 className="text-lg font-medium text-white">
                {activeTab === AppTab.CHAT && 'Chat with Gemini 2.5 Flash'}
                {activeTab === AppTab.VISION && 'Multimodal Vision Analysis'}
                {activeTab === AppTab.LIVE && 'Real-time Voice Interaction'}
            </h1>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs text-emerald-500 font-medium uppercase tracking-wider">System Online</span>
            </div>
        </header>

        <div className="flex-1 overflow-hidden relative">
            {activeTab === AppTab.CHAT && <ChatInterface />}
            {activeTab === AppTab.VISION && <VisionInterface />}
            {activeTab === AppTab.LIVE && <LiveInterface />}
        </div>
      </main>
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  isNew?: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label, isNew }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group relative ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`}
  >
    <div className="flex items-center justify-center md:justify-start w-full">
        <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>{icon}</span>
        <span className="hidden md:block ml-3 font-medium">{label}</span>
    </div>
    {isNew && (
        <span className="absolute top-2 right-2 md:top-1/2 md:-translate-y-1/2 md:right-3 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
        </span>
    )}
  </button>
);

export default App;
