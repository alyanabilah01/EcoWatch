
import React, { useState, useEffect } from 'react';
import { Project, Observation } from '../types';
import { analyzeObservationImage, getAddressFromCoords } from '../services/geminiService';
import { saveObservation } from '../services/db';

interface ProjectDetailProps {
  project: Project;
  onClose: () => void;
  onSuccess: (points: number) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onClose, onSuccess }) => {
  const [fileData, setFileData] = useState<{ url: string; type: string } | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    let interval: any;
    if (analyzing) {
      setScanProgress(0);
      interval = setInterval(() => {
        setScanProgress(prev => (prev >= 100 ? 0 : prev + 2));
      }, 30);
    }
    return () => clearInterval(interval);
  }, [analyzing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFileData({ url: reader.result as string, type: file.type });
      reader.readAsDataURL(file);

      // Capture location when photo is taken
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setLocation(coords);
            // Get human-readable address
            getAddressFromCoords(coords.lat, coords.lng).then(setAddress);
          },
          (error) => {
            console.warn("Geolocation failed:", error.message);
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      }
    }
  };

  const handleAnalyze = async () => {
    if (!fileData) return;
    setAnalyzing(true);
    try {
      const base64 = fileData.url.split(',')[1];
      const result = await analyzeObservationImage(base64, project.title, location || undefined);
      setAiAnalysis(result);
    } catch (err) {
      setAiAnalysis("Unable to reach the lab. Check your connection.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveFinding = async () => {
    if (!fileData || !aiAnalysis) return;
    setSubmitting(true);
    
    try {
      const observation: Observation = {
        id: crypto.randomUUID(),
        projectId: project.id,
        timestamp: Date.now(),
        location: location ? { ...location, address: address || undefined } : undefined,
        imageUrl: fileData.url,
        analysis: aiAnalysis,
        userId: 'local_user',
        isValidated: true,
        data: {
          notes: "Auto-analyzed via Gemini AI"
        }
      };

      await saveObservation(observation, project.category);
      onSuccess(project.points);
      onClose();
    } catch (error) {
      console.error("Failed to save observation:", error);
      alert("Database uplink failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatReport = (text: string) => {
    return text.split('\n').filter(l => l.trim()).map((line, i) => {
      if (line.includes(':')) {
        const parts = line.split(':');
        const title = parts[0];
        const content = parts.slice(1).join(':');
        return (
          <div key={i} className="mb-4 last:mb-0">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title.trim()}</h4>
            <p className="text-sm text-slate-700 font-medium leading-relaxed">{content.trim()}</p>
          </div>
        );
      }
      return <p key={i} className="text-sm text-slate-600 mb-3">{line}</p>;
    });
  };

  return (
    <div className="fixed inset-0 bg-[#FBFDFF] z-[60] overflow-y-auto pb-24">
      <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between z-10">
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600">✕</button>
        <div className="flex-1 text-center">
          <h2 className="font-black text-slate-900 tracking-tight">New Finding</h2>
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{project.title}</p>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="p-6 max-w-xl mx-auto space-y-8">
        {/* Specimen Capture */}
        <div className="space-y-4">
          <div className={`border-4 border-dashed rounded-[40px] p-2 transition-all ${fileData ? 'border-emerald-100 shadow-sm' : 'border-slate-100'}`}>
            <div className="rounded-[32px] overflow-hidden min-h-[280px] bg-slate-50 flex items-center justify-center relative">
              {fileData ? (
                <>
                  <img src={fileData.url} alt="Capture" className="w-full h-full object-cover max-h-[400px]" />
                  {location && (
                    <div className="absolute top-4 right-4 left-4 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg flex items-center gap-3 border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500">
                      <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-sm shrink-0">📍</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-900 truncate leading-tight">
                          {address || "Locating..."}
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  )}
                  {analyzing && (
                    <div className="absolute inset-0 bg-slate-900/70 flex flex-col items-center justify-center p-8 text-white backdrop-blur-sm">
                      <div className="w-full max-w-xs space-y-4 text-center">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                          <span>Analyzing...</span>
                          <span>{scanProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                        </div>
                        <p className="text-[10px] font-bold text-emerald-100 mt-4 uppercase">Running ID algorithms</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <label className="w-full h-[280px] cursor-pointer flex flex-col items-center justify-center gap-4 hover:bg-slate-100/50 transition-colors">
                  <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-3xl">📷</div>
                  <div className="text-center">
                    <span className="block text-sm font-black text-slate-800 uppercase tracking-widest">Take a Photo</span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Real-time capture only</span>
                  </div>
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>
          
          {fileData && !aiAnalysis && !analyzing && (
            <button 
              onClick={handleAnalyze} 
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 transform transition active:scale-95"
            >
              Analyze Finding
            </button>
          )}
        </div>

        {/* AI Scientific Report */}
        {aiAnalysis && (
          <div className="bg-white border border-slate-100 rounded-[32px] p-7 shadow-sm animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl">🧬</div>
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-widest text-[11px]">Analysis Report</h3>
                <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Validated by AI Lab</p>
              </div>
            </div>
            <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-50">
              {formatReport(aiAnalysis)}
            </div>
          </div>
        )}

        {fileData && aiAnalysis && (
          <button
            onClick={handleSaveFinding}
            disabled={submitting}
            className="w-full bg-slate-900 text-white font-black py-5 rounded-[28px] shadow-2xl disabled:opacity-50 transition-all active:scale-95 uppercase tracking-[0.2em] text-xs"
          >
            {submitting ? 'Syncing to Database...' : `Save Finding (+${project.points} XP)`}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProjectDetail;

