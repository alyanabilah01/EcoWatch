
import React, { useState, useEffect, useRef } from 'react';
import Navigation from './components/Navigation';
import ProjectDetail from './components/ProjectDetail';
import FindingsHistory from './components/FindingsHistory';
import { PROJECTS, BADGES } from './constants';
import { Project, UserProfile, ChatMessage, Observation, ProjectCategory } from './types';
import { 
  getProjectRecommendations, 
  getEducationalChatResponse, 
  generateEducationalImage, 
  getProjectPrediction, 
  PredictionResult, 
  getSmartSuggestions 
} from './services/geminiService';
import { db, getOrCreateLocalUser, saveObservation, saveChatMessage, cachePrediction, getCachedPredictions } from './services/db';

const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [viewHistoryProject, setViewHistoryProject] = useState<Project | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string>('Syncing patterns...');
  const [smartSuggestions, setSmartSuggestions] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Record<string, PredictionResult>>({});
  const [isPredicting, setIsPredicting] = useState<string | null>(null);
  
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [user, setUser] = useState<UserProfile>({
    name: 'Researcher',
    level: 1,
    points: 0,
    contributions: 0,
    badges: [],
    expertise: {
      [ProjectCategory.BIODIVERSITY_FLORA]: 0,
      [ProjectCategory.AIR_QUALITY]: 0,
      [ProjectCategory.WATER_HEALTH]: 0,
    },
    learnedInterests: []
  });

  useEffect(() => {
    const initApp = async () => {
      try {
        const userData = await getOrCreateLocalUser();
        setUser(userData);
        const cached = await getCachedPredictions();
        setPredictions(cached);
        const history = await db.chat.orderBy('timestamp').toArray();
        if (history.length > 0) setChatMessages(history);
        else {
          const welcome = { id: '1', text: "EcoWatch AI online. Ready to explore nature today?", sender: 'ai', timestamp: Date.now() } as ChatMessage;
          setChatMessages([welcome]);
          await saveChatMessage(welcome);
        }
      } finally { setIsInitializing(false); }
    };
    initApp();
  }, []);

  useEffect(() => {
    if (!isInitializing && activeTab === 'dashboard') {
      getProjectRecommendations(user).then(setAiAdvice);
      getSmartSuggestions(user).then(setSmartSuggestions);
    }
  }, [activeTab, user.points, isInitializing]);

  const handleFetchPrediction = async (project: Project) => {
    if (predictions[project.category]) return;
    setIsPredicting(project.category);
    
    // Count historical findings for this project
    const count = await db.observations.where('projectId').equals(project.id).count();
    
    const result = await getProjectPrediction(project.category, count);
    setPredictions(prev => ({ ...prev, [project.category]: result }));
    await cachePrediction(project.category, result);
    setIsPredicting(null);
  };

  const renderDashboard = () => (
    <div className="p-6 space-y-8 pb-32 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">EcoWatch</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intelligence Node</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden">
          <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`} alt="Ava" className="w-9 h-9" />
        </div>
      </div>

      <div className="bg-slate-900 rounded-[36px] p-7 text-white shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 space-y-5">
          <div className="flex justify-between items-start">
            <span className="bg-white/10 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-emerald-400 border border-white/5">Weekly Forecast</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[9px] font-black opacity-60 uppercase tracking-widest">Live Sync</span>
            </div>
          </div>
          <p className="text-base font-medium leading-relaxed italic pr-8">"{aiAdvice}"</p>
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">Impact Level</p>
              <p className="text-sm font-black text-emerald-400">Stable</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">Local Trend</p>
              <p className="text-sm font-black text-amber-400">Improving</p>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 text-[160px] opacity-[0.03] rotate-12 transition-transform duration-700">🌍</div>
      </div>

      {smartSuggestions && (
        <div className="space-y-4 animate-in slide-in-from-left-6 duration-500">
          <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest ml-1">Smart Tips</h3>
          <div className="bg-white border border-slate-100 rounded-[32px] p-6 shadow-sm divide-y divide-slate-50">
             {smartSuggestions.split('\n').filter(l => l.trim()).slice(0, 3).map((line, i) => (
               <div key={i} className="flex gap-4 py-3 first:pt-0 last:pb-0">
                 <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center text-[10px] font-black text-indigo-600 shrink-0">{i+1}</div>
                 <p className="text-[13px] text-slate-600 font-medium leading-tight">{line.replace(/^[-*]\s|\d+\.\s/, '')}</p>
               </div>
             ))}
          </div>
        </div>
      )}

      <div className="bg-emerald-600 rounded-[36px] p-7 text-white shadow-xl shadow-emerald-100/50">
        <div className="flex justify-between items-end mb-5">
          <div>
            <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">Progress</span>
            <h2 className="text-4xl font-black mt-1 leading-none">{user.points} <span className="text-lg font-normal opacity-70">XP</span></h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-black uppercase opacity-60 tracking-widest">Discoveries</span>
            <p className="text-2xl font-black">{user.contributions}</p>
          </div>
        </div>
        <div className="w-full bg-black/10 h-2 rounded-full overflow-hidden">
          <div className="bg-white h-full rounded-full transition-all duration-1000" style={{ width: `${(user.points % 500) / 500 * 100}%` }} />
        </div>
      </div>
    </div>
  );

  const renderProjects = () => (
    <div className="p-6 space-y-8 pb-32">
      <header className="mb-4">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Missions</h1>
        <p className="text-slate-500 font-medium text-sm italic">Analyze trends and log local health.</p>
      </header>

      <div className="space-y-10">
        {PROJECTS.map(project => (
          <div key={project.id} className="bg-white rounded-[40px] border border-slate-100 overflow-hidden flex flex-col shadow-sm">
            <div className="h-44 bg-slate-50 relative flex items-center justify-center text-7xl">{project.icon}</div>
            <div className="p-8">
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 bg-indigo-50 px-4 py-1.5 rounded-full inline-block">{project.category}</span>
                <button 
                  onClick={() => setViewHistoryProject(project)}
                  className="bg-slate-50 text-slate-400 p-2.5 rounded-xl hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                >
                  📂 History
                </button>
              </div>
              
              <h3 className="text-xl font-black text-slate-900 mb-2">{project.title}</h3>
              <p className="text-slate-500 text-[14px] mb-8 leading-relaxed font-medium">{project.description}</p>
              
              <div className="mb-8">
                {predictions[project.category] ? (
                  <div className={`rounded-3xl p-6 border-2 animate-in zoom-in duration-300 ${predictions[project.category].riskLevel === 'High' ? 'bg-red-50/50 border-red-50' : 'bg-emerald-50/50 border-emerald-50'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">📈</span>
                        <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Future Outlook</h4>
                      </div>
                      <span className={`text-[10px] font-black px-3 py-1 rounded-lg ${predictions[project.category].riskLevel === 'High' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        {predictions[project.category].riskLevel} RISK
                      </span>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Weekly Forecast</p>
                        <p className="text-sm text-slate-800 font-bold">{predictions[project.category].forecast}</p>
                      </div>
                      <div className="pt-3 border-t border-slate-100">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Biodiversity Status</p>
                        <p className="text-sm text-slate-800 font-bold">{predictions[project.category].biodiversityStatus}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => handleFetchPrediction(project)}
                    className="w-full bg-slate-50 border border-slate-100 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-100 transition-all"
                  >
                    {isPredicting === project.category ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span>Calculating Predictions...</span>
                      </div>
                    ) : '🔍 Forecast Environmental Risks'}
                  </button>
                )}
              </div>

              <button 
                onClick={() => setSelectedProject(project)} 
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs hover:bg-indigo-600 transition-all active:scale-95 uppercase tracking-widest shadow-xl shadow-slate-100"
              >
                Log New Entry
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFEFF] max-w-md mx-auto relative shadow-2xl border-x border-slate-100 overflow-x-hidden no-scrollbar">
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'projects' && renderProjects()}
      {activeTab === 'chat' && (
        <div className="flex flex-col h-screen pb-24">
          <header className="p-6 bg-white border-b border-slate-50 shrink-0">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Neural Lab</h1>
            <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest">Scientific AI Agent</p>
          </header>
          <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar bg-[#FAFBFF]">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] p-5 rounded-3xl text-[14px] shadow-sm font-medium leading-relaxed ${msg.sender === 'user' ? 'bg-slate-900 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                  {msg.imageUrl && <img src={msg.imageUrl} alt="Visual" className="mb-4 rounded-2xl w-full object-cover border border-slate-50 aspect-square" />}
                  <div className="space-y-2">
                    {msg.text.split('\n').map((line, idx) => (
                      <p key={idx}>{line}</p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start pl-4">
                <div className="flex gap-1.5 items-center bg-slate-100 px-4 py-2 rounded-full">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 bg-white border-t border-slate-50 shrink-0">
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!chatInput.trim() || isChatLoading) return;
              const userMsg = { id: Date.now().toString(), text: chatInput, sender: 'user', timestamp: Date.now() } as ChatMessage;
              setChatMessages(prev => [...prev, userMsg]);
              setChatInput('');
              setIsChatLoading(true);
              getEducationalChatResponse(userMsg.text, chatMessages.slice(-5).map(m => ({ role: m.sender === 'user' ? 'user' : 'model', parts: [{ text: m.text }] })), user).then(res => {
                const aiMsg = { id: (Date.now()+1).toString(), text: res, sender: 'ai', timestamp: Date.now() } as ChatMessage;
                setChatMessages(prev => [...prev, aiMsg]);
                setIsChatLoading(false);
              });
            }} className="flex gap-3">
              <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Analyze trends..." className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
              <button type="submit" className="bg-indigo-600 text-white w-14 h-14 rounded-2xl shadow-lg shadow-indigo-100 flex items-center justify-center shrink-0 transition-transform active:scale-90">📤</button>
            </form>
          </div>
        </div>
      )}
      {activeTab === 'profile' && (
        <div className="p-8 space-y-10 pb-32">
          <header className="flex items-center gap-8">
            <div className="w-28 h-28 rounded-[40px] overflow-hidden border-[6px] border-white shadow-2xl shrink-0">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`} alt="Ava" className="w-full h-full p-2" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{user.name}</h1>
              <div className="mt-2 inline-block px-4 py-1.5 bg-indigo-600 rounded-full">
                <p className="text-white font-black uppercase tracking-widest text-[10px]">Lvl {user.level} Guardian</p>
              </div>
            </div>
          </header>
          <div className="grid grid-cols-2 gap-5">
            <div className="bg-white p-7 rounded-[40px] border border-slate-100 text-center shadow-sm">
              <p className="text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest">Scientific XP</p>
              <p className="text-3xl font-black text-slate-900">{user.points}</p>
            </div>
            <div className="bg-white p-7 rounded-[40px] border border-slate-100 text-center shadow-sm">
              <p className="text-[11px] font-black text-slate-400 uppercase mb-2 tracking-widest">Records</p>
              <p className="text-3xl font-black text-slate-900">{user.contributions}</p>
            </div>
          </div>
          <div className="space-y-6">
             <h3 className="text-[12px] font-black text-slate-900 uppercase tracking-widest ml-1">Research Credentials</h3>
             <div className="grid grid-cols-2 gap-4">
                {BADGES.map(badge => (
                  <div key={badge.id} className="bg-white border border-slate-50 p-6 rounded-[32px] flex flex-col items-center gap-3 shadow-sm transition-shadow">
                    <span className="text-4xl mb-1">{badge.icon}</span>
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider text-center leading-tight">{badge.name}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>
      )}
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {selectedProject && (
        <ProjectDetail 
          project={selectedProject} 
          onClose={() => setSelectedProject(null)} 
          onSuccess={(pts) => {
            setUser(prev => ({...prev, points: prev.points + pts, contributions: prev.contributions + 1}));
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          }} 
        />
      )}

      {viewHistoryProject && (
        <FindingsHistory 
          project={viewHistoryProject} 
          onClose={() => setViewHistoryProject(null)} 
        />
      )}

      {showConfetti && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white p-10 rounded-[48px] text-center shadow-2xl animate-in zoom-in duration-500 transform-gpu">
              <div className="w-20 h-20 bg-emerald-100 rounded-[32px] flex items-center justify-center text-5xl mx-auto mb-6">📡</div>
              <h2 className="font-black text-2xl text-slate-900 tracking-tight uppercase">Record Saved</h2>
              <p className="text-[12px] text-emerald-600 font-black uppercase tracking-widest mt-3">XP Synchronized</p>
              <button onClick={() => setShowConfetti(false)} className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">Continue</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
